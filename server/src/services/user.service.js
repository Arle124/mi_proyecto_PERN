import { prisma } from '../config/db.js';
import bcrypt from 'bcrypt';
import * as auditService from './audit.service.js';

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    where: { deletedAt: null }
  });
};

export const createUser = async (userData, creatorId = null) => {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

  return await prisma.$transaction(async (tx) => {
    // 1. Crear el usuario
    const newUser = await tx.user.create({
      data: {
        primerNombre: userData.primerNombre,
        segundoNombre: userData.segundoNombre,
        primerApellido: userData.primerApellido,
        segundoApellido: userData.segundoApellido,
        correo: userData.correo,
        password: hashedPassword,
        rol: userData.rol || 'OPERADOR'
      }
    });

    // 2. Registrar en Auditoría Forense
    await auditService.logAudit({
      userId: creatorId, // ID del administrador que lo crea, si aplica
      action: 'CREATE',
      entity: 'User',
      entityId: newUser.id,
      newValues: {
        correo: newUser.correo,
        rol: newUser.rol,
        nombreCompleto: `${newUser.primerNombre} ${newUser.primerApellido}`
      }
    }, tx);

    console.log(`🛡️ Auditoría Forense confirmada para el usuario: ${newUser.correo}`);

    return newUser;
  });
};

