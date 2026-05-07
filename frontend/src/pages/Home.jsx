import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import ProductoCard from '../components/ProductoCard.jsx';
import Carrito from '../components/Carrito.jsx';

const categoriasBase = [
  { nombre: 'Todos', icono: '🛒' },
  { nombre: 'Medicamentos', icono: '💊' },
  { nombre: 'Dermocosmética', icono: '✨' },
  { nombre: 'Bebé y Mamá', icono: '🍼' },
  { nombre: 'Bienestar y Nutrición', icono: '🍃' },
  { nombre: 'Cuidado Personal', icono: '🧴' },
  { nombre: 'Protección Solar', icono: '☀️' },
  { nombre: 'Primeros Auxilios', icono: '🩹' },
  { nombre: 'Ofertas', icono: '🔥' }
];

export default function Home() {
  const [productos, setProductos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [mostrarPago, setMostrarPago] = useState(false);
  const [cliente, setCliente] = useState('Cliente general');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [procesandoMP, setProcesandoMP] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');

  const cargarProductos = async () => {
    const { data } = await api.get('/productos');
    setProductos(data);
  };

  useEffect(() => {
    cargarProductos().catch(() =>
      setMensaje('No se pudo conectar con el backend. Revisa que Node esté ejecutándose.')
    );
  }, []);

  const categorias = useMemo(() => {
    const extras = [...new Set(productos.map(p => p.categoria).filter(Boolean))]
      .filter(cat => !categoriasBase.some(base => base.nombre === cat))
      .map(cat => ({ nombre: cat, icono: '🏷️' }));

    return [...categoriasBase, ...extras];
  }, [productos]);

  const productosFiltrados = productos.filter((p) => {
    const texto = `${p.descripcion || ''} ${p.detalle || ''} ${p.categoria || ''}`.toLowerCase();

    const coincideBusqueda = texto.includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaActiva === 'Todos' ||
      p.categoria === categoriaActiva;

    return coincideBusqueda && coincideCategoria;
  });

  const total = useMemo(
    () =>
      carrito.reduce(
        (sum, item) =>
          sum + Number(item.precio) * item.cantidad,
        0
      ),
    [carrito]
  );

  const agregar = (producto) => {
    setMensaje('');

    setCarrito((prev) => {
      const existe = prev.find(
        (item) => item.id_producto === producto.id_producto
      );

      if (existe) {
        if (existe.cantidad >= Number(producto.stock)) {
          setMensaje(
            'No hay más stock disponible para este producto.'
          );

          return prev;
        }

        return prev.map((item) =>
          item.id_producto === producto.id_producto
            ? {
                ...item,
                cantidad: item.cantidad + 1
              }
            : item
        );
      }

      return [
        ...prev,
        {
          ...producto,
          cantidad: 1
        }
      ];
    });
  };

  const cambiarCantidad = (id, cantidad) => {
    if (cantidad <= 0) return quitar(id);

    setCarrito((prev) =>
      prev.map((item) => {
        if (item.id_producto !== id) return item;

        return {
          ...item,
          cantidad: Math.min(
            cantidad,
            Number(item.stock)
          )
        };
      })
    );
  };

  const quitar = (id) =>
    setCarrito((prev) =>
      prev.filter((item) => item.id_producto !== id)
    );

  const pagarConMercadoPago = async () => {
    if (carrito.length === 0) {
      setMensaje('El carrito está vacío.');
      return;
    }

    try {
      setProcesandoMP(true);

      setMensaje(
        'Creando pago seguro con Mercado Pago...'
      );

      const ordenPendiente = {
        cliente_nombre:
          cliente || 'Cliente general',

        items: carrito.map((item) => ({
          id_producto: item.id_producto,
          descripcion: item.descripcion,
          precio: Number(item.precio),
          cantidad: item.cantidad
        }))
      };

      localStorage.setItem(
        'farmaflow_orden_pendiente',
        JSON.stringify(ordenPendiente)
      );

      const { data } = await api.post(
        '/ventas/crear-preferencia',
        ordenPendiente
      );

      const urlPago =
        data.init_point || data.sandbox_init_point;

      if (!urlPago) {
        throw new Error(
          'Mercado Pago no devolvió un enlace de pago'
        );
      }

      window.location.href = urlPago;

    } catch (error) {
      setMensaje(
        error.response?.data?.error ||
          error.message ||
          'Error al crear el pago con Mercado Pago'
      );

    } finally {
      setProcesandoMP(false);
    }
  };

  const confirmarVentaYape = async () => {
    if (carrito.length === 0) {
      setMensaje('El carrito está vacío.');
      setMostrarPago(false);
      return;
    }

    if (!numeroOperacion.trim()) {
      setMensaje('Ingrese el número de operación del pago.');
      return;
    }

    if (!/^\d+$/.test(numeroOperacion.trim())) {
      setMensaje(
        'El número de operación solo debe contener números.'
      );
      return;
    }

    if (numeroOperacion.trim().length < 8) {
      setMensaje(
        'El número de operación debe tener mínimo 8 dígitos.'
      );
      return;
    }

    if (numeroOperacion.trim().length > 20) {
      setMensaje(
        'El número de operación es demasiado largo.'
      );
      return;
    }

    try {
      setProcesando(true);
      setMensaje('');

      const payload = {
        cliente_nombre:
          cliente || 'Cliente general',

        metodo_pago: 'Yape',

        numero_operacion:
          numeroOperacion.trim(),

        items: carrito.map((item) => ({
          id_producto: item.id_producto,
          cantidad: item.cantidad
        }))
      };

      const { data } = await api.post(
        '/ventas',
        payload
      );

      setMensaje(
        `✅ Venta #${data.id_venta} registrada correctamente. Total: S/ ${Number(
          data.total
        ).toFixed(2)}`
      );

      setCarrito([]);
      setCliente('Cliente general');
      setNumeroOperacion('');

      await cargarProductos();

      setTimeout(() => {
        setMostrarPago(false);
      }, 1400);

    } catch (error) {
      setMensaje(
        error.response?.data?.error ||
          'Error al registrar la venta'
      );

    } finally {
      setProcesando(false);
    }
  };

  const cancelarCompra = () => {
    const confirmar = window.confirm(
      '¿Seguro que deseas cancelar la compra?'
    );

    if (confirmar) {
      setCarrito([]);
      setMostrarPago(false);
      setCliente('Cliente general');
      setNumeroOperacion('');

      setMensaje(
        'Compra cancelada. No se registró ninguna venta.'
      );
    }
  };

  return (
    <main className="container py-4">
      <section className="hero-farma mb-4">
        <div className="hero-copy">
          <span className="badge rounded-pill text-bg-light mb-2">
            Tienda online sin login
          </span>

          <h1>FarmaFlow</h1>

          <p>
            Medicamentos, cuidado personal,
            bebé, belleza, nutrición y productos
            para el bienestar en una sola
            plataforma.
          </p>

          <div className="hero-actions">
            <button
              className="btn btn-light fw-bold"
              onClick={() =>
                setCategoriaActiva('Ofertas')
              }
            >
              Ver ofertas
            </button>

            <button
              className="btn btn-outline-light fw-bold"
              onClick={() =>
                setCategoriaActiva('Todos')
              }
            >
              Ver todo
            </button>
          </div>
        </div>

        <div className="hero-banner-card">
          <span>🛡️ Pago validado</span>

          <strong>
            Compra con Mercado Pago o Yape manual
          </strong>

          <small>
            Con Mercado Pago, la venta solo se
            registra si el pago vuelve como
            aprobado.
          </small>
        </div>
      </section>

      {mensaje && !mostrarPago && (
        <div className="alert alert-warning">
          {mensaje}
        </div>
      )}

      <section className="categorias-section mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 align-items-md-center mb-3">
          <h2 className="section-title m-0">
            Categorías recomendadas
          </h2>

          <input
            className="form-control buscador"
            placeholder="¿Qué estás buscando?"
            value={busqueda}
            onChange={(e) =>
              setBusqueda(e.target.value)
            }
          />
        </div>

        <div className="categorias-grid">
          {categorias.map((cat) => (
            <button
              key={cat.nombre}
              className={`categoria-tile ${
                categoriaActiva === cat.nombre
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setCategoriaActiva(cat.nombre)
              }
            >
              <span>{cat.icono}</span>
              <strong>{cat.nombre}</strong>
            </button>
          ))}
        </div>
      </section>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="d-flex justify-content-between gap-3 align-items-center mb-3">
            <h2 className="section-title m-0">
              Productos disponibles
            </h2>

            <span className="badge rounded-pill text-bg-light contador-productos">
              {productosFiltrados.length} productos
            </span>
          </div>

          <div className="row g-3">
            {productosFiltrados.map((producto) => (
              <div
                className="col-md-6 col-xl-4"
                key={producto.id_producto}
              >
                <ProductoCard
                  producto={producto}
                  onAgregar={agregar}
                />
              </div>
            ))}

            {productosFiltrados.length === 0 && (
              <div className="col-12">
                <div className="alert alert-info">
                  No hay productos para esta
                  búsqueda o categoría.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <Carrito
            carrito={carrito}
            cambiarCantidad={cambiarCantidad}
            quitar={quitar}
            total={total}
            onPagarYape={() =>
              setMostrarPago(true)
            }
            onPagarMercadoPago={
              pagarConMercadoPago
            }
            procesandoPago={procesandoMP}
          />
        </div>
      </div>
    </main>
  );
}