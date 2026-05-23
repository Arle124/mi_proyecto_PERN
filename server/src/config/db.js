import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Blindaje contra caídas: Escucha errores inesperados en conexiones inactivas del pool de pg
// y evita que un error de red o de desconexión idle tire abajo el proceso de Node.js.
pool.on('error', (err) => {
  console.error('👥 Unexpected error on idle PostgreSQL client:', err);
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });

console.log('🔗 Conectado a PostgreSQL mediante Prisma Adapter (Prisma 7)');
