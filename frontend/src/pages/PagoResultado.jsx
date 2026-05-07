import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api.js';

export default function PagoResultado({ tipo }) {
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [estado, setEstado] = useState('Validando pago con Mercado Pago...');
  const [detalle, setDetalle] = useState('');
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const validar = async () => {
      if (tipo !== 'success') {
        setEstado(tipo === 'pending' ? 'Pago pendiente' : 'Pago no aprobado');
        setDetalle('La venta no fue registrada porque Mercado Pago no confirmó el pago como aprobado.');
        return;
      }

      const paymentId = params.get('payment_id') || params.get('collection_id');
      const status = params.get('status') || params.get('collection_status');
      const ordenGuardada = localStorage.getItem('farmaflow_orden_pendiente');

      if (!paymentId) {
        setEstado('No se recibió el código de pago');
        setDetalle('Mercado Pago no devolvió payment_id. No se registró la venta.');
        return;
      }

      if (status && status !== 'approved') {
        setEstado(`Pago con estado: ${status}`);
        setDetalle('La venta no fue registrada porque el pago todavía no está aprobado.');
        return;
      }

      if (!ordenGuardada) {
        setEstado('No se encontró el carrito pendiente');
        setDetalle('No se pudo registrar la venta porque no existe una orden pendiente en este navegador.');
        return;
      }

      try {
        const orden = JSON.parse(ordenGuardada);
        const { data } = await api.post('/ventas/confirmar-mercadopago', {
          payment_id: paymentId,
          cliente_nombre: orden.cliente_nombre || 'Cliente general',
          items: orden.items || []
        });

        localStorage.removeItem('farmaflow_orden_pendiente');
        setOk(true);
        setEstado('✅ Pago aprobado y venta registrada');
        setDetalle(`Venta #${data.id_venta} registrada correctamente. ${data.yaRegistrada ? 'La venta ya estaba registrada anteriormente.' : 'Stock actualizado automáticamente.'}`);
      } catch (error) {
        setEstado('No se pudo registrar la venta');
        setDetalle(error.response?.data?.error || error.message || 'Error al validar el pago.');
      }
    };

    validar();
  }, [params, tipo]);

  return (
    <main className="container py-5">
      <section className={`resultado-pago ${ok ? 'ok' : ''}`}>
        <h1>{estado}</h1>
        <p>{detalle}</p>
        <div className="d-flex gap-2 justify-content-center flex-wrap">
          <Link className="btn btn-primary" to="/">Volver a la tienda</Link>
          <Link className="btn btn-outline-primary" to="/ventas">Ver ventas</Link>
        </div>
      </section>
    </main>
  );
}
