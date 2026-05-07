import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [mensaje, setMensaje] = useState('');

  const cargarVentas = () => {
    api.get('/ventas')
      .then(({ data }) => setVentas(data))
      .catch(() => setMensaje('No se pudo cargar ventas'));
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const eliminarVenta = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar esta venta? El stock será restaurado.');
    if (!confirmar) return;

    try {
      await api.delete(`/ventas/${id}`);
      setMensaje('Venta eliminada correctamente');
      cargarVentas();
    } catch (error) {
      setMensaje(error.response?.data?.error || 'No se pudo eliminar la venta');
    }
  };

  const totalDia = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0);

  return (
    <main className="container py-4">
      <h1 className="section-title">Ventas registradas</h1>
      {mensaje && <div className="alert alert-warning">{mensaje}</div>}
      <div className="kpi-card mb-4">
        <span>Total vendido</span>
        <strong>S/ {totalDia.toFixed(2)}</strong>
      </div>
      <div className="table-responsive card tabla-card">
        <table className="table align-middle mb-0">
          <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Método</th><th>Estado</th><th>Total</th><th>Acción</th></tr></thead>
          <tbody>
            {ventas.map(v => (
              <tr key={v.id_venta}>
                <td>#{v.id_venta}</td>
                <td>{new Date(v.fecha).toLocaleString()}</td>
                <td>{v.cliente_nombre}</td>
                <td><span className="badge yape-badge">{v.metodo_pago}</span></td>
                <td><span className="badge text-bg-success">{v.estado_pago || 'manual'}</span></td>
                <td><strong>S/ {Number(v.total).toFixed(2)}</strong></td>
                <td>
                  <button className="btn btn-sm btn-danger" onClick={() => eliminarVenta(v.id_venta)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
