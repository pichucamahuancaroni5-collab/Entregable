import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductosAdmin from './pages/ProductosAdmin.jsx';
import Ventas from './pages/Ventas.jsx';
import PagoResultado from './pages/PagoResultado.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <nav className="navbar navbar-expand-lg navbar-light nav-farma sticky-top">
        <div className="container">
          <NavLink className="navbar-brand fw-black brand" to="/">💊 FarmaFlow</NavLink>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="menu">
            <div className="navbar-nav ms-auto gap-2 align-items-lg-center">
              <NavLink className="nav-link" to="/">Tienda</NavLink>
              <NavLink className="nav-link" to="/productos-admin">CRUD Productos</NavLink>
              <NavLink className="nav-link" to="/ventas">Ventas</NavLink>
            </div>
          </div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/productos-admin" element={<ProductosAdmin />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/pago-exitoso" element={<PagoResultado tipo="success" />} />
        <Route path="/pago-fallido" element={<PagoResultado tipo="failure" />} />
        <Route path="/pago-pendiente" element={<PagoResultado tipo="pending" />} />
      </Routes>
    </BrowserRouter>
  );
}
