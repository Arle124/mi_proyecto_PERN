import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas API
app.use('/api', routes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('🚀 Backend Logística Novapalma (MVC Potenciado) - Funcionando');
});

export default app;
