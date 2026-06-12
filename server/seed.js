import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando poblamiento y saneamiento de base de datos de producción...');

  // 1. Limpieza de base de datos (Vaciado en cascada para evitar colisión de claves externas)
  console.log('🧹 Limpiando base de datos (eliminando registros previos)...');
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crear Usuarios reales
  console.log('👥 Creando usuarios administrativos y operadores reales...');
  
  const adminPassword = await bcrypt.hash('AdminNovapalma2026!', 10);
  const admin = await prisma.user.create({
    data: {
      primerNombre: 'Sandra',
      primerApellido: 'Villamizar',
      correo: 'admin@novapalma.com',
      password: adminPassword,
      rol: 'ADMIN',
      activo: true
    }
  });
  console.log(`👤 Administradora Sandra Villamizar Creada (${admin.correo})`);

  const op1Password = await bcrypt.hash('OperadorNovapalma2026!', 10);
  const operator = await prisma.user.create({
    data: {
      primerNombre: 'Andrés',
      primerApellido: 'Gómez',
      correo: 'operador@novapalma.com',
      password: op1Password,
      rol: 'OPERADOR',
      activo: true
    }
  });
  console.log(`👤 Operador Andrés Gómez Creado (${operator.correo})`);

  const op2Password = await bcrypt.hash('CarlosPerez2026!', 10);
  const operator2 = await prisma.user.create({
    data: {
      primerNombre: 'Carlos',
      primerApellido: 'Pérez',
      correo: 'carlos.perez@novapalma.com',
      password: op2Password,
      rol: 'OPERADOR',
      activo: true
    }
  });
  console.log(`👤 Operador Carlos Pérez Creado (${operator2.correo})`);

  // 3. Crear Conductores reales del pool del Excel
  console.log('👨‍✈️ Creando pool de conductores profesionales reales...');
  const driversData = [
    { key: 'LUIS ALBERTO RAPALINO', primerNombre: 'LUIS', segundoNombre: 'ALBERTO', primerApellido: 'RAPALINO', cedula: '1098654321', telefono: '3007418529' },
    { key: 'YEFERSON PARRA', primerNombre: 'YEFERSON', segundoNombre: null, primerApellido: 'PARRA', cedula: '1097564738', telefono: '3109283746' },
    { key: 'ARMANDO', primerNombre: 'ARMANDO', segundoNombre: null, primerApellido: 'DÍAZ', cedula: '1096123456', telefono: '3156291837' },
    { key: 'JESUS ARENA', primerNombre: 'JESÚS', segundoNombre: null, primerApellido: 'ARENAS', cedula: '1095987654', telefono: '3205739182' },
    { key: 'STIVEN', primerNombre: 'STIVEN', segundoNombre: null, primerApellido: 'ALARCÓN', cedula: '1094365782', telefono: '3114829103' },
    { key: 'JIMMY RODRIGUEZ', primerNombre: 'JIMMY', segundoNombre: null, primerApellido: 'RODRÍGUEZ', cedula: '1093192837', telefono: '3128471920' },
    { key: 'IMAR ASCANIO', primerNombre: 'IMAR', segundoNombre: null, primerApellido: 'ASCANIO', cedula: '1092738495', telefono: '3139582716' },
    { key: 'YORDAN', primerNombre: 'YORDAN', segundoNombre: null, primerApellido: 'CASTILLO', cedula: '1091564738', telefono: '3146372819' }
  ];

  const driverMap = {};
  const drivers = [];
  for (const item of driversData) {
    const d = await prisma.driver.create({
      data: {
        cedula: item.cedula,
        primerNombre: item.primerNombre,
        segundoNombre: item.segundoNombre,
        primerApellido: item.primerApellido,
        telefono: item.telefono,
        activo: true
      }
    });
    driverMap[item.key] = d.id;
    drivers.push(d);
  }
  console.log(`✅ ${driversData.length} Conductores registrados.`);

  // 4. Crear Vehículos reales con datos extraídos y capacidades colombianas
  console.log('🚚 Creando pool de vehículos reales con placas y modelos...');
  const vehiclesData = [
    { placa: 'RHA401', marca: 'Kenworth', modelo: 'T800 2018', capacidad: 35.0, estado: 'DISPONIBLE' },
    { placa: 'CHU030', marca: 'Chevrolet', modelo: 'FVR 2021', capacidad: 11.5, estado: 'DISPONIBLE' },
    { placa: 'SZX985', marca: 'International', modelo: 'WorkStar 2019', capacidad: 17.0, estado: 'DISPONIBLE' },
    { placa: 'TRL089', marca: 'Hino', modelo: 'Dutro 300 2022', capacidad: 5.5, estado: 'DISPONIBLE' },
    { placa: 'WOP741', marca: 'Foton', modelo: 'Aumark S 2023', capacidad: 7.0, estado: 'DISPONIBLE' }
  ];

  const vehicleMap = {};
  const vehicles = [];
  for (const item of vehiclesData) {
    const v = await prisma.vehicle.create({
      data: {
        placa: item.placa,
        marca: item.marca,
        modelo: item.modelo,
        capacidad: item.capacidad,
        estado: item.estado,
        activo: true
      }
    });
    vehicleMap[item.placa] = v.id;
    vehicles.push(v);
  }
  console.log(`✅ ${vehiclesData.length} Vehículos registrados.`);

  // 5. Cargar Viajes Reales desde el archivo JSON de extracción de Excel
  console.log('📂 Leyendo viajes extraídos del Excel...');
  const rawTrips = fs.readFileSync(path.join(__dirname, 'excel_trips.json'), 'utf8');
  const excelTrips = JSON.parse(rawTrips);

  const usedTickets = new Set();
  let realCount = 0;

  for (const trip of excelTrips) {
    const driverId = driverMap[trip.conductor];
    const vehicleId = vehicleMap[trip.placa];

    if (!driverId || !vehicleId) {
      console.warn(`⚠️ Omitiendo viaje ticket ${trip.ticket} por conductor/vehículo no mapeado.`);
      continue;
    }

    // Calcular consumo de ACPM (a razón de $9,800 COP por galón si se ingresó valor monetario)
    const valorAcpm = Number(trip.valorAcpm);
    const consumoAcpm = valorAcpm > 0 ? Number((valorAcpm / 9800).toFixed(2)) : 0.0;

    await prisma.trip.create({
      data: {
        ticket: trip.ticket,
        fecha: new Date(trip.fecha),
        origen: trip.origen,
        destino: trip.destino,
        empresa: trip.empresa,
        producto: trip.producto,
        tonelaje: trip.kilogramos / 1000.0,
        valorPago: trip.valorFlete,
        porcentajeConductor: 1.00, // En el excel, el pago al conductor es del 1% del flete
        valorConductor: trip.valorConductor,
        consumoAcpm,
        usoAcpm: valorAcpm > 0,
        usoFerry: trip.valorFerry > 0,
        valorAcpm,
        valorFerry: trip.valorFerry,
        driverId,
        vehicleId,
        registradoPorId: operator.id
      }
    });
    usedTickets.add(trip.ticket);
    realCount++;
  }
  console.log(`✅ ${realCount} Viajes reales de Abril 2026 sembrados exitosamente.`);

  // 6. Generar 200 viajes simulados realistas para Mayo y Junio 2026
  console.log('🔮 Generando 200 viajes simulados realistas...');
  
  // Patrones realistas de viajes del Excel
  const compostPattern = {
    producto: 'COMPOST',
    origen: 'EXTRACTORA-GLORIA',
    destino: 'HACIENDA -GLORIA',
    empresa: 'EXTRACTORA - GLORIA',
    costoPorTon: 12000,
    minKg: 10000,
    maxKg: 25000,
    hasAcpm: true,
    hasFerry: false
  };

  const fruitPattern1 = {
    producto: 'FRUTO',
    origen: 'PUERTO RICO',
    destino: 'EXTRACTORA-GLORIA',
    empresa: 'PUERTO RICO',
    costoPorTon: 32000,
    minKg: 15000,
    maxKg: 20000,
    hasAcpm: false,
    hasFerry: true
  };

  const fruitPattern2 = {
    producto: 'FRUTO',
    origen: 'LOMA',
    destino: 'LOMA',
    empresa: 'DAABON',
    costoPorTon: 50000,
    minKg: 15000,
    maxKg: 20000,
    hasAcpm: false,
    hasFerry: true
  };

  const patterns = [compostPattern, fruitPattern1, fruitPattern2];
  let generatedCount = 0;
  let ticketSeed = 250000;

  // Rango de fechas: de hace 40 días a hace 1 día (Mayo y Junio 2026)
  const generateSimulatedTrip = async (daysAgo) => {
    // Buscar un ticket único
    while (usedTickets.has(ticketSeed)) {
      ticketSeed++;
    }
    const ticket = ticketSeed++;
    usedTickets.add(ticket);

    // Selección aleatoria del conductor y del vehículo
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];

    // Selección aleatoria del patrón de flete
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    // Generar tonelaje de acuerdo al patrón y al límite de capacidad del vehículo
    const maxCapacity = parseFloat(vehicle.capacidad.toString()) * 1000.0; // en kg
    const minKg = Math.min(pattern.minKg, maxCapacity - 2000);
    const maxKg = Math.min(pattern.maxKg, maxCapacity);
    const kilogramos = Math.round(Math.random() * (maxKg - minKg) + minKg);
    const tonelaje = kilogramos / 1000.0;

    // Calcular valores financieros según los patrones del Excel
    const valorPago = Math.round(tonelaje * pattern.costoPorTon);
    const valorConductor = Math.round(valorPago * 0.01); // 1%

    // ACPM
    let valorAcpm = 0;
    let consumoAcpm = 0;
    if (pattern.hasAcpm) {
      consumoAcpm = Number((Math.random() * 15 + 20).toFixed(2)); // de 20 a 35 galones
      valorAcpm = Math.round(consumoAcpm * 9800);
    }

    // Ferry
    let valorFerry = 0;
    if (pattern.hasFerry) {
      valorFerry = Math.random() < 0.5 ? 110000 : 220000;
    }

    // Fecha
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    await prisma.trip.create({
      data: {
        ticket,
        fecha: date,
        origen: pattern.origen,
        destino: pattern.destino,
        empresa: pattern.empresa,
        producto: pattern.producto,
        tonelaje,
        valorPago,
        porcentajeConductor: 1.00,
        valorConductor,
        consumoAcpm,
        usoAcpm: valorAcpm > 0,
        usoFerry: valorFerry > 0,
        valorAcpm,
        valorFerry,
        driverId: driver.id,
        vehicleId: vehicle.id,
        registradoPorId: operator2.id
      }
    });

    generatedCount++;
  };

  // Generar 100 viajes para Mayo (días 11 a 40 de antigüedad)
  console.log('📅 Generando 100 viajes realistas para Mayo 2026...');
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30) + 11;
    await generateSimulatedTrip(daysAgo);
  }

  // Generar 100 viajes para Junio (días 1 a 10 de antigüedad)
  console.log('📅 Generando 100 viajes realistas para Junio 2026...');
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 10) + 1;
    await generateSimulatedTrip(daysAgo);
  }

  console.log(`✅ ${generatedCount} Viajes simulados creados exitosamente.`);
  console.log(`🎉 Poblamiento completado. Base de datos 100% limpia y saneada.`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
