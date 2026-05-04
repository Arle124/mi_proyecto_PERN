import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as auditService from './audit.service.js';

export const login = async (correo, password, ipAddress, userAgent) => {
  // 1. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { correo, activo: true }
  });

  if (!user) {
    throw new Error('Credenciales inválidas o usuario inactivo');
  }

  // 2. Validar password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Credenciales inválidas');
  }

  // 3. Generar JWT
  const token = jwt.sign(
    { id: user.id, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  // 4. Registrar auditoría de Login
  await auditService.logAudit({
    userId: user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    ipAddress,
    userAgent
  });

  console.log(`🔐 Usuario autenticado: ${user.correo}`);

  return {
    token,
    user: {
      id: user.id,
      primerNombre: user.primerNombre,
      primerApellido: user.primerApellido,
      correo: user.correo,
      rol: user.rol
    }
  };
};
