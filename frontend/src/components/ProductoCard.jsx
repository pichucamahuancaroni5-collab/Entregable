export default function ProductoCard({ producto, onAgregar }) {
  const imagen = producto.img ? `/img/${producto.img}` : '/img/producto.svg';
  const stockBajo = Number(producto.stock) <= 5;

  return (
    <div className="card producto-card h-100">
      <div className="img-wrap">
        <img src={imagen} alt={producto.descripcion} onError={(e) => { e.currentTarget.src = '/img/producto.svg'; }} />
      </div>
      <div className="card-body d-flex flex-column">
        <span className="badge rounded-pill text-bg-light categoria-badge">{producto.categoria || 'Botica'}</span>
        <h5 className="mt-2 mb-1">{producto.descripcion}</h5>
        <p className="descripcion flex-grow-1">{producto.detalle || 'Producto farmacéutico de calidad para tu salud.'}</p>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <strong className="precio">S/ {Number(producto.precio).toFixed(2)}</strong>
          <small className={stockBajo ? 'text-danger fw-bold' : 'text-success fw-bold'}>
            {stockBajo ? `⚠ Stock ${producto.stock}` : `Stock ${producto.stock}`}
          </small>
        </div>
        <button
          className="btn btn-nova w-100"
          disabled={Number(producto.stock) <= 0}
          onClick={() => onAgregar(producto)}
        >
          🛒 Agregar al carrito
        </button>
      </div>
    </div>
  );
}
