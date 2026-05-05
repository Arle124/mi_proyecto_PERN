import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Carga manual de dotenv para asegurar DATABASE_URL en Node v25
dotenv.config({ path: resolve(process.cwd(), '.env'), override: true });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL no encontrada en el entorno.');
  process.exit(1);
}

// Configuración del adaptador para Prisma 7
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando siembra de datos para Novapalma (v3.0)...');
  
  const email = 'admin@novapalma.com';
  const password = 'admin123';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { correo: email },
    update: {
      password: hashedPassword,
      rol: 'ADMIN',
      activo: true,
    },
    create: {
      correo: email,
      password: hashedPassword,
      primerNombre: 'Admin',
      primerApellido: 'Novapalma',
      rol: 'ADMIN',
      activo: true
    },
  });
  
  console.log(`🛡️ Usuario ADMIN verificado/creado: ${user.correo}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
