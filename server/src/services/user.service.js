import { prisma } from '../config/db.js';
import bcrypt from 'bcryptjs';
import * as auditService from './audit.service.js';

export const getAllUsers = async () => {
  return await prisma.user.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      primerNombre: true,
      segundoNombre: true,
      primerApellido: true,
      segundoApellido: true,
      correo: true,
      rol: true,
      activo: true,
      createdAt: true,
      updatedAt: true
    }
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

    // 2. Registrar en Auditoría
    await auditService.logAudit({
      userId: creatorId,
      action: 'CREATE',
      entity: 'User',
      entityId: newUser.id,
      newValues: {
        correo: newUser.correo,
        rol: newUser.rol,
        nombreCompleto: `${newUser.primerNombre} ${newUser.primerApellido}`
      }
    }, tx);

    console.log(`🛡️ Auditoría confirmada para el usuario: ${newUser.correo}`);

    // Retornar usuario sin password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  });
};

