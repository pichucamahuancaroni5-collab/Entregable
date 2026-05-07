import { Router } from 'express';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { pool } from '../db.js';

const router = Router();

function getMpClient() {
  if (!process.env.MP_ACCESS_TOKEN) {
    throw new Error('Falta configurar MP_ACCESS_TOKEN en backend/.env');
  }

  return new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN
  });
}

async function registrarVenta({
  cliente_nombre = 'Cliente general',
  metodo_pago = 'Yape',
  mp_payment_id = null,
  estado_pago = 'manual',
  items = []
}) {
  const conn = await pool.getConnection();

  try {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('El carrito está vacío');
    }

    await conn.beginTransaction();

    if (mp_payment_id) {
      const [existente] = await conn.query(
        'SELECT id_venta FROM ventas WHERE mp_payment_id=? LIMIT 1',
        [mp_payment_id]
      );

      if (existente.length > 0) {
        await conn.rollback();
        return {
          yaRegistrada: true,
          id_venta: existente[0].id_venta
        };
      }
    }

    let total = 0;
    const productosValidados = [];

    for (const item of items) {
      const cantidad = Number(item.cantidad);

      if (!item.id_producto || cantidad <= 0) {
        throw new Error('Producto o cantidad inválida');
      }

      const [rows] = await conn.query(
        'SELECT id_producto, descripcion, precio, stock FROM producto WHERE id_producto=? FOR UPDATE',
        [item.id_producto]
      );

      if (rows.length === 0) {
        throw new Error('Producto no encontrado');
      }

      const producto = rows[0];

      if (Number(producto.stock) < cantidad) {
        throw new Error(
          `Stock insuficiente para ${producto.descripcion}. Disponible: ${producto.stock}`
        );
      }

      const precio = Number(producto.precio);
      const subtotal = precio * cantidad;

      total += subtotal;

      productosValidados.push({
        ...producto,
        cantidad,
        precio,
        subtotal
      });
    }

    const [ventaResult] = await conn.query(
      `INSERT INTO ventas 
       (cliente_nombre, metodo_pago, total, mp_payment_id, estado_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [cliente_nombre, metodo_pago, total, mp_payment_id, estado_pago]
    );

    const idVenta = ventaResult.insertId;

    for (const item of productosValidados) {
      await conn.query(
        `INSERT INTO detalle_venta 
        (cantidad, precio_unitario, subtotal, id_producto, id_venta)
        VALUES (?, ?, ?, ?, ?)`,
        [
          item.cantidad,
          item.precio,
          item.subtotal,
          item.id_producto,
          idVenta
        ]
      );

      await conn.query(
        'UPDATE producto SET stock = stock - ? WHERE id_producto = ?',
        [item.cantidad, item.id_producto]
      );
    }

    await conn.commit();

    return {
      id_venta: idVenta,
      total,
      yaRegistrada: false
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

router.get('/', async (req, res) => {
  try {
    const [ventas] = await pool.query(`
      SELECT id_venta, fecha, cliente_nombre, metodo_pago, total, mp_payment_id, estado_pago
      FROM ventas
      ORDER BY id_venta DESC
    `);

    res.json(ventas);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [venta] = await pool.query(
      'SELECT * FROM ventas WHERE id_venta=?',
      [req.params.id]
    );

    if (venta.length === 0) {
      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    const [detalle] = await pool.query(
      `
      SELECT d.*, p.descripcion AS producto
      FROM detalle_venta d
      LEFT JOIN producto p ON p.id_producto = d.id_producto
      WHERE d.id_venta=?
      `,
      [req.params.id]
    );

    res.json({
      ...venta[0],
      detalle
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

router.post('/crear-preferencia', async (req, res) => {
  try {
    const mpClient = getMpClient();
    const preferenceClient = new Preference(mpClient);

    const { cliente_nombre = 'Cliente general', items = [] } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'El carrito está vacío'
      });
    }

    const ids = items.map((item) => item.id_producto);

    const [productos] = await pool.query(
      'SELECT id_producto, descripcion, precio, stock FROM producto WHERE id_producto IN (?)',
      [ids]
    );

    const productosMP = [];

    for (const item of items) {
      const producto = productos.find(
        (p) => Number(p.id_producto) === Number(item.id_producto)
      );

      const cantidad = Number(item.cantidad);

      if (!producto) {
        return res.status(404).json({
          error: 'Producto no encontrado'
        });
      }

      if (cantidad <= 0) {
        return res.status(400).json({
          error: 'Cantidad inválida'
        });
      }

      if (Number(producto.stock) < cantidad) {
        return res.status(400).json({
          error: `Stock insuficiente para ${producto.descripcion}`
        });
      }

      productosMP.push({
        title: producto.descripcion,
        quantity: cantidad,
        currency_id: 'PEN',
        unit_price: Number(producto.precio)
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const preference = await preferenceClient.create({
  body: {
    items: productosMP,
    payer: {
      name: cliente_nombre || 'Cliente general'
    },
    back_urls: {
      success: `${frontendUrl}/pago-exitoso`,
      failure: `${frontendUrl}/pago-fallido`,
      pending: `${frontendUrl}/pago-pendiente`
    },
    statement_descriptor: 'FarmaFlow'
  }
});

    res.json({
      id: preference.id,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point
    });
  } catch (error) {
    console.error('ERROR MERCADO PAGO:', error);

    res.status(500).json({
      error:
        error?.message ||
        error?.cause?.[0]?.description ||
        'Error al crear la preferencia de Mercado Pago'
    });
  }
});

router.post('/confirmar-mercadopago', async (req, res) => {
  try {
    const mpClient = getMpClient();
    const paymentClient = new Payment(mpClient);

    const {
      payment_id,
      cliente_nombre = 'Cliente general',
      items = []
    } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        error: 'No se recibió el payment_id de Mercado Pago'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'No se encontró el carrito para registrar la venta'
      });
    }

    const payment = await paymentClient.get({
      id: payment_id
    });

    if (payment.status !== 'approved') {
      return res.status(400).json({
        error: `El pago todavía no está aprobado. Estado actual: ${payment.status}`,
        estado: payment.status
      });
    }

    const resultado = await registrarVenta({
      cliente_nombre,
      metodo_pago: 'Mercado Pago',
      mp_payment_id: String(payment_id),
      estado_pago: payment.status,
      items
    });

    res.status(201).json({
      mensaje: resultado.yaRegistrada
        ? 'La venta ya estaba registrada'
        : 'Pago aprobado y venta registrada correctamente',
      ...resultado
    });
  } catch (error) {
    console.error('ERROR CONFIRMAR MERCADO PAGO:', error);

    res.status(400).json({
      error: error.message
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      cliente_nombre = 'Cliente general',
      metodo_pago = 'Yape',
      numero_operacion = null,
      items = []
    } = req.body;

    if (
      metodo_pago === 'Yape' &&
      !String(numero_operacion || '').trim()
    ) {
      return res.status(400).json({
        error: 'Ingrese el número de operación Yape para validar el pago'
      });
    }

    const resultado = await registrarVenta({
      cliente_nombre,
      metodo_pago,
      mp_payment_id: numero_operacion ? `YAPE-${numero_operacion}` : null,
      estado_pago: metodo_pago === 'Yape' ? 'validacion_manual' : 'manual',
      items
    });

    res.status(201).json({
      mensaje: 'Venta registrada correctamente',
      ...resultado
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  const conn = await pool.getConnection();

  try {
    const idVenta = req.params.id;

    await conn.beginTransaction();

    const [venta] = await conn.query(
      'SELECT id_venta FROM ventas WHERE id_venta=? FOR UPDATE',
      [idVenta]
    );

    if (venta.length === 0) {
      await conn.rollback();

      return res.status(404).json({
        error: 'Venta no encontrada'
      });
    }

    const [detalles] = await conn.query(
      'SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta=?',
      [idVenta]
    );

    for (const item of detalles) {
      if (item.id_producto) {
        await conn.query(
          'UPDATE producto SET stock = stock + ? WHERE id_producto = ?',
          [item.cantidad, item.id_producto]
        );
      }
    }

    await conn.query(
      'DELETE FROM detalle_venta WHERE id_venta=?',
      [idVenta]
    );

    await conn.query(
      'DELETE FROM ventas WHERE id_venta=?',
      [idVenta]
    );

    await conn.commit();

    res.json({
      mensaje: 'Venta eliminada correctamente y stock restaurado'
    });
  } catch (error) {
    await conn.rollback();

    res.status(500).json({
      error: error.message
    });
  } finally {
    conn.release();
  }
});

export default router;