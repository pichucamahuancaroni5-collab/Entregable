import { useEffect, useState } from 'react';
import { api } from '../api.js';

const inicial = {
  descripcion: '',
  detalle: '',
  img: 'producto.svg',
  precio: '',
  stock: '',
  id_categoria: 1,
  id_proveedor: 1
};

export default function ProductosAdmin() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [form, setForm] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    const [{ data: productosData }, { data: listas }] = await Promise.all([
      api.get('/productos'),
      api.get('/productos/extras/listas')
    ]);
    setProductos(productosData);
    setCategorias(listas.categorias || []);
    setProveedores(listas.proveedores || []);
  };

  useEffect(() => {
    cargar().catch(() => setMensaje('No se pudo cargar productos'));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        precio: Number(form.precio),
        stock: Number(form.stock),
        id_categoria: Number(form.id_categoria),
        id_proveedor: Number(form.id_proveedor)
      };
      if (editando) {
        await api.put(`/productos/${editando}`, payload);
        setMensaje('✅ Producto actualizado');
      } else {
        await api.post('/productos', payload);
        setMensaje('✅ Producto registrado');
      }
      setForm(inicial);
      setEditando(null);
      cargar();
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Error al guardar');
    }
  };

  const editar = (p) => {
    setEditando(p.id_producto);
    setForm({
      descripcion: p.descripcion || '',
      detalle: p.detalle || '',
      img: p.img || 'producto.svg',
      precio: p.precio || '',
      stock: p.stock || '',
      id_categoria: p.id_categoria || 1,
      id_proveedor: p.id_proveedor || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await api.delete(`/productos/${id}`);
    cargar();
  };

  return (
    <main className="container py-4">
      <h1 className="section-title">CRUD de Productos</h1>
      <p className="text-muted">Registra productos de farmacia, belleza, bebé, nutrición, cuidado personal y más categorías.</p>
      {mensaje && <div className="alert alert-info">{mensaje}</div>}

      <form className="card form-card p-4 mb-4" onSubmit={guardar}>
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Nombre del producto</label>
            <input className="form-control" name="descripcion" value={form.descripcion} onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Imagen</label>
            <input className="form-control" name="img" value={form.img} onChange={handleChange} placeholder="protector-solar.svg" />
            <small className="text-muted">Guarda imágenes en frontend/public/img</small>
          </div>
          <div className="col-md-2">
            <label className="form-label">Precio</label>
            <input className="form-control" name="precio" type="number" step="0.01" value={form.precio} onChange={handleChange} required />
          </div>
          <div className="col-md-2">
            <label className="form-label">Stock</label>
            <input className="form-control" name="stock" type="number" value={form.stock} onChange={handleChange} required />
          </div>
          <div className="col-md-4">
            <label className="form-label">Categoría</label>
            <select className="form-select" name="id_categoria" value={form.id_categoria} onChange={handleChange}>
              {categorias.map((c) => <option key={c.id_categoria} value={c.id_categoria}>{c.descripcion}</option>)}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Proveedor</label>
            <select className="form-select" name="id_proveedor" value={form.id_proveedor} onChange={handleChange}>
              {proveedores.map((p) => <option key={p.id_proveedor} value={p.id_proveedor}>{p.razonsocial}</option>)}
            </select>
          </div>
          <div className="col-md-12">
            <label className="form-label">Descripción corta</label>
            <textarea className="form-control" name="detalle" value={form.detalle} onChange={handleChange} rows="2"></textarea>
          </div>
        </div>
        <div className="mt-3 d-flex gap-2">
          <button className="btn btn-nova">{editando ? 'Actualizar producto' : 'Guardar producto'}</button>
          {editando && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditando(null); setForm(inicial); }}>Cancelar</button>}
        </div>
      </form>

      <div className="table-responsive card tabla-card">
        <table className="table align-middle mb-0">
          <thead>
            <tr><th>Imagen</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {productos.map((p) => (
              <tr key={p.id_producto}>
                <td><img className="mini-img" src={`/img/${p.img || 'producto.svg'}`} alt={p.descripcion} /></td>
                <td><strong>{p.descripcion}</strong><br/><small>{p.detalle}</small></td>
                <td>{p.categoria || 'Sin categoría'}</td>
                <td>S/ {Number(p.precio).toFixed(2)}</td>
                <td><span className={Number(p.stock) <= 5 ? 'badge text-bg-danger' : 'badge text-bg-success'}>{p.stock}</span></td>
                <td>
                  <button className="btn btn-sm btn-outline-primary me-2" onClick={() => editar(p)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => eliminar(p.id_producto)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
