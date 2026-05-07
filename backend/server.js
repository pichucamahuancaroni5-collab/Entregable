import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productosRoutes from './routes/productos.routes.js';
import ventasRoutes from './routes/ventas.routes.js';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ mensaje: 'API Nova Salud funcionando correctamente' });
});

app.get('/api/status', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'Conectado a MySQL' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
