import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id_producto, p.descripcion, p.detalle, p.img, p.precio, p.stock,
             p.id_categoria, c.descripcion AS categoria,
             p.id_proveedor, pr.razonsocial AS proveedor
      FROM producto p
      LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
      LEFT JOIN proveedor pr ON pr.id_proveedor = p.id_proveedor
      ORDER BY p.id_producto DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/extras/listas', async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT * FROM categoria ORDER BY descripcion');
    const [proveedores] = await pool.query('SELECT * FROM proveedor ORDER BY razonsocial');
    res.json({ categorias, proveedores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM producto WHERE id_producto = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { descripcion, detalle, img, precio, stock, id_categoria, id_proveedor } = req.body;
    if (!descripcion || precio === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Nombre, precio y stock son obligatorios' });
    }
    const [result] = await pool.query(
      `INSERT INTO producto (descripcion, detalle, img, precio, stock, id_categoria, id_proveedor)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [descripcion, detalle || '', img || 'producto.svg', precio, stock, id_categoria || null, id_proveedor || null]
    );
    res.status(201).json({ id_producto: result.insertId, mensaje: 'Producto registrado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { descripcion, detalle, img, precio, stock, id_categoria, id_proveedor } = req.body;
    const [result] = await pool.query(
      `UPDATE producto
       SET descripcion=?, detalle=?, img=?, precio=?, stock=?, id_categoria=?, id_proveedor=?
       WHERE id_producto=?`,
      [descripcion, detalle || '', img || 'producto.svg', precio, stock, id_categoria || null, id_proveedor || null, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM producto WHERE id_producto=?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
