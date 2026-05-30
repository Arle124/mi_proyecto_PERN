import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.routes.js';

const app = express();

/**
 * ============================================================
 * CAPA DE SEGURIDAD PERIMETRAL (Hardening)
 * ============================================================
 * Como DevOps Senior, la prioridad es minimizar la superficie de ataque.
 */

// 1. HELMET: Configura cabeceras HTTP seguras para mitigar ataques como 
// XSS, Clickjacking y Sniffing de contenido.
app.use(helmet());

// 2. CORS: Restringe el acceso a orígenes conocidos.
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://mi-proyecto-pern.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir llamadas sin origen (como postman, curl o herramientas internas)
    if (!origin) return callback(null, true);
    
    // Si coincide con permitidos, o es desarrollo local o coincide con variable de entorno
    if (
      allowedOrigins.includes(origin) || 
      origin === process.env.CLIENT_URL || 
      process.env.NODE_ENV !== 'production'
    ) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado por políticas CORS de Novapalma'));
    }
  },
  credentials: true // Crucial para permitir el envío de HttpOnly Cookies
}));

// 3. RATE LIMITING: Defensa contra ataques de denegación de servicio (DoS) 
// y fuerza bruta en endpoints sensibles.
// NOTA DEV: Configurar 'trust proxy' en true permite que Express lea correctamente el cliente
// original detrás de múltiples balanceadores (ej. Cloudflare + Render Routing). Evita que el
// rate limiter bloquee por error a toda la flota compartiendo la IP interna del balanceador.
app.set('trust proxy', true); 
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Ventana de 15 minutos
  max: process.env.NODE_ENV === 'production' ? 100 : 2000, // 2000 peticiones en desarrollo para evitar bloqueos por refrescos/HMR
  message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

/**
 * ============================================================
 * MIDDLEWARES DE PARSEO Y SESIÓN
 * ============================================================
 */

// Parseo de JSON con límite de carga para evitar ataques de Payload Gigante
app.use(express.json({ limit: '10kb' }));

// Parseo de cookies para manejo seguro de sesiones vía HttpOnly Cookies
app.use(cookieParser());

/**
 * ============================================================
 * ENRUTAMIENTO (CAPA DE DOMINIO)
 * ============================================================
 */
app.use('/api', routes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('🚀 Backend Logística Novapalma (MVC Potenciado) - Funcionando');
});

// Manejador de errores global (Security Best Practice: No filtrar stacks de error al cliente)
app.use((err, req, res, next) => {
  console.error('💥 Critical Error:', err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Consulte los logs del sistema'
  });
});

export default app;
