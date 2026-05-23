import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

// Blindaje de Seguridad: Capturar excepciones no controladas a nivel global 
// para evitar caídas silenciosas del proceso de Node.js en producción.
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception Detectada:', error.stack || error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection Detectada en Promesa:', promise, 'razón:', reason);
});

app.listen(PORT, () => {
  console.log(`✅ Servidor PERN (Logística) corriendo en http://localhost:${PORT}`);
  console.log('🛡️ Auditoría Forense Activa | Prisma 7 Enabled');
});
