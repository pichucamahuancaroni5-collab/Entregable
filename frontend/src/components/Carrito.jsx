export default function Carrito({
  carrito,
  cambiarCantidad,
  quitar,
  total,
  onPagarMercadoPago,
  procesandoPago
}) {
  return (
    <aside className="carrito shadow-lg">
      <h4>🛒 Carrito</h4>

      {carrito.length === 0 ? (
        <p className="text-muted">
          Agrega productos para iniciar una compra.
        </p>
      ) : (
        <>
          <div className="carrito-items">
            {carrito.map(item => (
              <div
                className="carrito-item"
                key={item.id_producto}
              >
                <div>
                  <strong>{item.descripcion}</strong>

                  <p>
                    S/ {Number(item.precio).toFixed(2)} x{' '}
                    {item.cantidad}
                  </p>
                </div>

                <div className="d-flex align-items-center gap-1">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      cambiarCantidad(
                        item.id_producto,
                        item.cantidad - 1
                      )
                    }
                  >
                    -
                  </button>

                  <span className="cantidad">
                    {item.cantidad}
                  </span>

                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() =>
                      cambiarCantidad(
                        item.id_producto,
                        item.cantidad + 1
                      )
                    }
                  >
                    +
                  </button>

                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() =>
                      quitar(item.id_producto)
                    }
                  >
                    x
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="total-box">
            <span>Total</span>

            <strong>
              S/ {total.toFixed(2)}
            </strong>
          </div>

          <button
            className="btn btn-mercado w-100"
            onClick={onPagarMercadoPago}
            disabled={procesandoPago}
          >
            {procesandoPago
              ? 'Redirigiendo a Mercado Pago...'
              : 'Pagar con Mercado Pago'}
          </button>

          <small className="text-muted d-block mt-3 text-center">
            Pago seguro validado automáticamente
            con Mercado Pago.
          </small>
        </>
      )}
    </aside>
  );
}