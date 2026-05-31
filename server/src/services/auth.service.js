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

  // 4. Almacenar sesión activa en refresh_tokens
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 8); // Expira en 8 horas, coherente con JWT

  await prisma.refreshToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt
    }
  });

  // 5. Registrar auditoría de Login
  await auditService.logAudit({
    userId: user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: user.id,
    ipAddress,
    userAgent
  });

  console.log(`🔐 Usuario autenticado y sesión registrada: ${user.correo}`);

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

export const logout = async (token, ipAddress, userAgent) => {
  if (!token) return;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // Si el token expiró o es inválido, aún intentamos decodificarlo sin firmar para auditar el logout
    decoded = jwt.decode(token);
  }

  if (decoded && decoded.id) {
    // Revocar el token (marcarlo como revoked) en la base de datos
    await prisma.refreshToken.updateMany({
      where: { token, userId: decoded.id },
      data: { revoked: true }
    });

    // Registrar auditoría forense de LOGOUT
    await auditService.logAudit({
      userId: decoded.id,
      action: 'LOGOUT',
      entity: 'User',
      entityId: decoded.id,
      ipAddress,
      userAgent
    });

    console.log(`🛡️ Auditoría Forense: LOGOUT verificado para el usuario ${decoded.id}`);
  }
};
