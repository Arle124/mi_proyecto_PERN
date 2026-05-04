import { defineConfig } from '@prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config'; // <--- ESTO ES VITAL: Carga el .env

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL, // Para que Migrate sepa a dónde ir
  },
  // Esto es lo que te pedía el error para el Cliente
  client: {
    adapter,
  }
});