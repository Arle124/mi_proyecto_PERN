import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

// 1. Cargar variables de entorno
dotenv.config();

// 2. Configurar el Pool de conexión y el Adapter de Prisma 7
// Esto soluciona el error PrismaClientConstructorValidationError
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- RUTAS ---

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('🚀 ¡Backend PERN funcionando al 100% en CachyOS!');
});

// Ruta para obtener todos los usuarios (GET)
app.get('/usuarios', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error en GET /usuarios:", error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// Ruta para crear usuarios (POST)
app.post('/usuarios', async (req, res) => {
  const { name, email } = req.body;
  try {
    const newUser = await prisma.user.create({
      data: { 
        name: name, 
        email: email 
      },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(400).json({ error: "El email ya existe o faltan datos" });
  }
});

// 3. Iniciar el servidor
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Servidor PERN corriendo en http://localhost:${PORT}`);
  console.log('🔗 Conectado a PostgreSQL mediante Prisma Adapter');
});