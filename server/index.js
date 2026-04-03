import express from 'express';
import pkg from '@prisma/client'; 
const { PrismaClient } = pkg;     
import cors from 'cors';
import dotenv from 'dotenv';
import prismaConfig from './prisma.config.js'; // Ahora apuntamos al .js

dotenv.config();

const app = express();

// Usamos el adapter que exportamos en el paso anterior
const prisma = new PrismaClient({
  adapter: prismaConfig.adapter
});

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 ¡Backend PERN funcionando al 100% en CachyOS!');
});

app.get('/usuarios', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en la base de datos" });
  }
});

// --- NUEVA RUTA PARA CREAR USUARIOS ---
app.post('/usuarios', async (req, res) => {
  const { name, email } = req.body; // Aquí recibimos lo que envíes desde Insomnia
  try {
    const newUser = await prisma.user.create({
      data: { 
        name: name, 
        email: email 
      },
    });
    res.status(201).json(newUser); // Te devuelve el usuario con su nuevo ID
  } catch (error) {
    console.error("Error al crear:", error);
    res.status(400).json({ error: "El email ya existe o faltan datos" });
  }
});

app.listen(3001, () => {
  console.log('✅ Servidor en http://localhost:3001');
});