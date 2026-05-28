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
  console.log('🌱 Iniciando poblamiento y saneamiento de base de datos...');

  // 0. Saneamiento Completo (Vaciado en orden de restricciones)
  console.log('🧹 Limpiando base de datos (eliminando registros previos)...');
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // 1. Crear Administrador Inicial
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      primerNombre: 'Admin',
      primerApellido: 'Novapalma',
      correo: 'admin@novapalma.com',
      password: adminPassword,
      rol: 'ADMIN',
      activo: true
    },
  });
  console.log(`👤 Usuario Admin Creado: ${admin.correo}`);

  // 2. Crear Operador Inicial
  const operatorPassword = await bcrypt.hash('operador123', 10);
  const operator = await prisma.user.create({
    data: {
      primerNombre: 'Operador',
      primerApellido: 'Logística',
      correo: 'operador@novapalma.com',
      password: operatorPassword,
      rol: 'OPERADOR',
      activo: true
    },
  });
  console.log(`👤 Usuario Operador Creado: ${operator.correo}`);

  // 3. Crear Conductores de Prueba
  console.log('👨‍✈️ Creando pool de 5 conductores profesionales...');
  const driversData = [
    { cedula: '123456789', primerNombre: 'Juan', primerApellido: 'Pérez', telefono: '3001234567' },
    { cedula: '987654321', primerNombre: 'Carlos', primerApellido: 'Rodríguez', telefono: '3109876543' },
    { cedula: '456789123', primerNombre: 'Mario', primerApellido: 'Gómez', telefono: '3154567890' },
    { cedula: '789123456', primerNombre: 'Luis', primerApellido: 'Martínez', telefono: '3207891234' },
    { cedula: '321654987', primerNombre: 'Jorge', primerApellido: 'Hernando', telefono: '3113216549' }
  ];

  const drivers = [];
  for (const driverVal of driversData) {
    const d = await prisma.driver.create({ data: driverVal });
    drivers.push(d);
  }
  console.log(`✅ 5 Conductores registrados.`);

  // 4. Crear Vehículos de Prueba
  console.log('🚚 Creando pool de 5 vehículos de flota pesada...');
  const vehiclesData = [
    { placa: 'AAA001', marca: 'Hino', modelo: 'Dutro 2024', capacidad: 5.5, estado: 'DISPONIBLE' },
    { placa: 'BBB002', marca: 'Chevrolet', modelo: 'FVR 2023', capacidad: 10.0, estado: 'DISPONIBLE' },
    { placa: 'CCC003', marca: 'Kenworth', modelo: 'T800 2022', capacidad: 17.5, estado: 'DISPONIBLE' },
    { placa: 'DDD004', marca: 'International', modelo: 'WorkStar 2024', capacidad: 16.0, estado: 'DISPONIBLE' },
    { placa: 'EEE005', marca: 'Foton', modelo: 'FRR 2023', capacidad: 7.2, estado: 'DISPONIBLE' }
  ];

  const vehicles = [];
  for (const vehicleVal of vehiclesData) {
    const v = await prisma.vehicle.create({ data: vehicleVal });
    vehicles.push(v);
  }
  console.log(`✅ 5 Vehículos registrados.`);

  // 5. Generar 50 Viajes Coherentes Financieramente
  console.log('📊 Generando 50 viajes simulados para auditoría...');
  
  const origins = ["Extractora Gloria", "Palmas del Cesar", "Indupalma", "Extractora La Provincia", "Hacienda El Oasis"];
  const destinations = ["Extractora Novapalma", "Terminal Barrancabermeja", "Puerto Giraldo", "Hacienda El Centro", "Planta Oleoflores"];
  const companies = ["EXTRACTORA GLORIA S.A.S.", "PALMAS DEL CESAR S.A.", "NOVAPALMA S.A.S.", "INDUPALMA S.A.", "OLEOFLORES S.A.S."];
  const products = ["FRUTO", "COMPOST"];

  let currentTicket = 14500;

  const createMockTrip = async (minDaysAgo, maxDaysAgo) => {
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    
    const product = products[Math.floor(Math.random() * products.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const destination = destinations[Math.floor(Math.random() * destinations.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    
    // Tonelaje adaptado a la capacidad del vehículo
    const maxCapacity = parseFloat(vehicle.capacidad.toString());
    const minTons = Math.max(2.0, maxCapacity - 2.0);
    const tonelaje = Number((Math.random() * (maxCapacity - minTons) + minTons).toFixed(3));
    
    // Costo flete por tonelada (entre 35,000 y 65,000 COP)
    const costPerTon = Math.floor(Math.random() * 30000) + 35000;
    const valorPago = Math.round((tonelaje * costPerTon) / 1000) * 1000; // Redondeado a miles
    
    // Porcentaje conductor (entre 8.00% y 15.00%, redondeado a 2 decimales)
    const porcentajeConductor = Number((Math.random() * 7 + 8).toFixed(2));
    const valorConductor = Math.round(valorPago * (porcentajeConductor / 100));
    
    // ACPM
    const consumoAcpm = Number((Math.random() * 15 + 10).toFixed(1));
    const valorAcpm = Math.round((consumoAcpm * 9800) / 1000) * 1000; // Aprox $9,800 COP por galón
    
    // Ferry
    const usoFerry = Math.random() < 0.3; // 30% probabilidad
    const valorFerry = usoFerry ? (Math.round((Math.random() * 70000 + 180000) / 1000) * 1000) : 0;
    
    // Fecha distribuida en el rango de días especificado
    const daysAgo = Math.floor(Math.random() * (maxDaysAgo - minDaysAgo + 1)) + minDaysAgo;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    
    await prisma.trip.create({
      data: {
        ticket: currentTicket++,
        fecha: date,
        origen: origin,
        destino: destination,
        empresa: company,
        producto: product,
        tonelaje,
        valorPago,
        consumoAcpm,
        usoFerry,
        porcentajeConductor,
        valorConductor,
        valorAcpm,
        valorFerry,
        driverId: driver.id,
        vehicleId: vehicle.id,
        registradoPorId: operator.id
      }
    });
  };

  // Generar bloque 1: 50 viajes en el mes actual (últimos 30 días)
  console.log('📅 Generando 50 viajes para el mes actual (últimos 30 días)...');
  for (let i = 0; i < 50; i++) {
    await createMockTrip(0, 29);
  }

  // Generar bloque 2: 20 viajes para el mes anterior (días 30 a 59)
  console.log('📅 Generando 20 viajes para el mes anterior (días 30 a 59)...');
  for (let i = 0; i < 20; i++) {
    await createMockTrip(30, 59);
  }

  // Generar bloque 3: 15 viajes para el mes ante-anterior (días 60 a 89)
  console.log('📅 Generando 15 viajes para hace dos meses (días 60 a 89)...');
  for (let i = 0; i < 15; i++) {
    await createMockTrip(60, 89);
  }

  console.log('✅ Base de datos saneada y 85 viajes históricos coherentes registrados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
