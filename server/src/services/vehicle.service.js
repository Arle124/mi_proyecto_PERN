import { prisma } from '../config/db.js';
import * as auditService from './audit.service.js';

/**
 * Crea un nuevo vehículo con registro de auditoría.
 */
export const createVehicle = async (vehicleData, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    const newVehicle = await tx.vehicle.create({
      data: {
        placa: vehicleData.placa.toUpperCase(),
        marca: vehicleData.marca,
        modelo: vehicleData.modelo,
        capacidad: vehicleData.capacidad,
        estado: vehicleData.estado || 'DISPONIBLE',
      }
    });

    await auditService.logAudit({
      userId,
      action: 'CREATE',
      entity: 'Vehicle',
      entityId: newVehicle.id,
      newValues: newVehicle
    }, tx);

    console.log(`🚚 Vehículo ${newVehicle.placa} creado exitosamente. 🛡️ Auditoría registrada.`);
    return newVehicle;
  });
};

/**
 * Obtiene todos los vehículos activos.
 */
export const getAllVehicles = async () => {
  return await prisma.vehicle.findMany({
    where: { deletedAt: null }
  });
};

/**
 * Obtiene un vehículo por ID.
 */
export const getVehicleById = async (id) => {
  return await prisma.vehicle.findUnique({
    where: { id, deletedAt: null }
  });
};

/**
 * Actualiza un vehículo con registro de auditoría.
 */
export const updateVehicle = async (id, updateData, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    const oldVehicle = await tx.vehicle.findUnique({ where: { id } });
    
    if (!oldVehicle) throw new Error('Vehículo no encontrado');

    const updatedVehicle = await tx.vehicle.update({
      where: { id },
      data: updateData
    });

    await auditService.logAudit({
      userId,
      action: 'UPDATE',
      entity: 'Vehicle',
      entityId: id,
      oldValues: oldVehicle,
      newValues: updatedVehicle
    }, tx);

    console.log(`✅ Vehículo ${updatedVehicle.placa} actualizado. 🛡️ Auditoría registrada.`);
    return updatedVehicle;
  });
};

/**
 * Realiza un Soft Delete del vehículo.
 */
export const deleteVehicle = async (id, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    const oldVehicle = await tx.vehicle.findUnique({ where: { id } });

    if (!oldVehicle) throw new Error('Vehículo no encontrado');

    const deletedVehicle = await tx.vehicle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        activo: false,
        estado: 'MANTENIMIENTO'
      }
    });

    await auditService.logAudit({
      userId,
      action: 'DELETE', // O UPDATE (Soft Delete) según convención
      entity: 'Vehicle',
      entityId: id,
      oldValues: oldVehicle,
      newValues: { deletedAt: deletedVehicle.deletedAt, activo: false, estado: 'MANTENIMIENTO' }
    }, tx);

    console.log(`🗑️ Soft Delete aplicado al vehículo ${oldVehicle.placa}. 🛡️ Auditoría registrada.`);
    return deletedVehicle;
  });
};
