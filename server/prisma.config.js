import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Creamos la conexión a tu Postgres de CachyOS
const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL 
});

const adapter = new PrismaPg(pool);

// Exportamos el adapter directamente
export default { adapter };
