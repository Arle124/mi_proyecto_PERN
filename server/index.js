import app from './src/app.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Servidor PERN (Logística) corriendo en http://localhost:${PORT}`);
  console.log('🛡️ Auditoría Forense Activa | Prisma 7 Enabled');
});
