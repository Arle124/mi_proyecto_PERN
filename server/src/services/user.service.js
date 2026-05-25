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
  if (!creatorId) {
    throw new Error('Operación denegada: Se requiere la identificación del creador.');
  }

  // Verificar que el creador sea un administrador activo en la base de datos
  const actor = await prisma.user.findFirst({
    where: { id: creatorId, activo: true, deletedAt: null }
  });
  if (!actor || actor.rol !== 'ADMIN') {
    throw new Error('Operación denegada: Se requieren privilegios de administrador activos para registrar nuevos usuarios.');
  }

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

export const updateUser = async (id, updateData, adminId) => {
  if (!adminId) {
    throw new Error('Operación denegada: Se requiere la identificación del administrador.');
  }

  // Verificar que el actor sea un administrador activo en la base de datos
  const actor = await prisma.user.findFirst({
    where: { id: adminId, activo: true, deletedAt: null }
  });
  if (!actor || actor.rol !== 'ADMIN') {
    throw new Error('Operación denegada: Se requieren privilegios de administrador activos para modificar usuarios.');
  }

  // Blindaje de Seguridad: Previene el auto-bloqueo del administrador activo
  if (id === adminId) {
    if (updateData.activo === false) {
      throw new Error('Operación denegada: No puedes desactivar o suspender tu propia cuenta de administrador.');
    }
    if (updateData.rol === 'OPERADOR') {
      throw new Error('Operación denegada: No puedes degradar tu propio rol de ADMINISTRADOR a OPERADOR.');
    }
  }

  const dataToUpdate = { ...updateData };

  if (updateData.password) {
    const saltRounds = 10;
    dataToUpdate.password = await bcrypt.hash(updateData.password, saltRounds);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Obtener usuario actual
    const oldUser = await tx.user.findUnique({
      where: { id }
    });
    if (!oldUser) throw new Error('Usuario no encontrado');

    // Blindaje de seguridad adicional: Si el usuario a modificar es ADMIN,
    // y se le intenta desactivar o degradar, verificar cuántos administradores activos quedan.
    if (oldUser.rol === 'ADMIN' && (updateData.activo === false || updateData.rol === 'OPERADOR')) {
      const activeAdminsCount = await tx.user.count({
        where: {
          rol: 'ADMIN',
          activo: true,
          deletedAt: null
        }
      });

      if (activeAdminsCount <= 1) {
        throw new Error('Operación denegada: No se puede desactivar o degradar al único administrador activo en el sistema.');
      }
    }

    // 2. Ejecutar la actualización
    const updatedUser = await tx.user.update({
      where: { id },
      data: dataToUpdate
    });

    // 3. Registrar auditoría forense
    await auditService.logAudit({
      userId: adminId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValues: {
        correo: oldUser.correo,
        rol: oldUser.rol,
        activo: oldUser.activo,
        nombreCompleto: `${oldUser.primerNombre} ${oldUser.primerApellido}`
      },
      newValues: {
        correo: updatedUser.correo,
        rol: updatedUser.rol,
        activo: updatedUser.activo,
        nombreCompleto: `${updatedUser.primerNombre} ${updatedUser.primerApellido}`
      }
    }, tx);

    console.log(`🛡️ Auditoría de actualización confirmada para el usuario: ${updatedUser.correo}`);

    // Retornar usuario sin password
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  });
};
