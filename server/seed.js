import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando poblamiento de base de datos...');

  // 1. Crear Administrador Inicial
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { correo: 'admin@novapalma.com' },
    update: {},
    create: {
      primerNombre: 'Admin',
      primerApellido: 'Novapalma',
      correo: 'admin@novapalma.com',
      password: adminPassword,
      rol: 'ADMIN',
      activo: true
    },
  });
  console.log(`👤 Usuario Admin: ${admin.correo}`);

  // 2. Crear Operador Inicial
  const operatorPassword = await bcrypt.hash('operador123', 10);
  const operator = await prisma.user.upsert({
    where: { correo: 'operador@novapalma.com' },
    update: {},
    create: {
      primerNombre: 'Operador',
      primerApellido: 'Logística',
      correo: 'operador@novapalma.com',
      password: operatorPassword,
      rol: 'OPERADOR',
      activo: true
    },
  });
  console.log(`👤 Usuario Operador: ${operator.correo}`);

  // 3. Crear Tarifas Base
  // Para el viaje NORMAL (Fruta): $25 pesos por kg = $25,000 por tonelada.
  // Para el viaje ESPECIAL: $600,000 como tarifa base de prueba.
  const tariffs = [
    { tipoViaje: 'NORMAL', valorTon: 25000.00 },
    { tipoViaje: 'ESPECIAL', valorTon: 600000.00 }
  ];

  for (const tariff of tariffs) {
    const t = await prisma.rateTariff.upsert({
      where: { tipoViaje: tariff.tipoViaje },
      update: { valorTon: tariff.valorTon },
      create: tariff,
    });
    console.log(`💰 Tarifa configurada: ${t.tipoViaje} -> $${t.valorTon}`);
  }

  // 4. Vehículo de prueba
  const vehicle = await prisma.vehicle.upsert({
    where: { placa: 'AAA001' },
    update: {},
    create: {
      placa: 'AAA001',
      marca: 'Hino',
      modelo: 'Dutro 2024',
      capacidad: 5.5,
      estado: 'DISPONIBLE'
    }
  });
  console.log(`🚚 Vehículo de prueba: ${vehicle.placa}`);

  // 5. Conductor de prueba
  const driver = await prisma.driver.upsert({
    where: { cedula: '123456789' },
    update: {},
    create: {
      cedula: '123456789',
      primerNombre: 'Juan',
      primerApellido: 'Pérez',
      telefono: '3001234567'
    }
  });
  console.log(`👨‍✈️ Conductor de prueba: ${driver.primerNombre} ${driver.primerApellido}`);

  console.log('✅ Poblamiento completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
