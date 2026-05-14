import { prisma } from '../config/db.js';
import * as auditService from './audit.service.js';

/**
 * Crea un nuevo viaje con registro de auditoría.
 * Calcula el valor del pago basado en la tarifa actual.
 */
export const createTrip = async (tripData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar que el vehículo esté disponible
    const vehicle = await tx.vehicle.findUnique({
      where: { id: tripData.vehicleId }
    });

    if (!vehicle || !vehicle.activo) throw new Error('Vehículo no encontrado o inactivo');
    if (vehicle.estado !== 'DISPONIBLE') throw new Error(`El vehículo ${vehicle.placa} no está disponible (Estado: ${vehicle.estado})`);

    // 2. Validar que el conductor esté activo
    const driver = await tx.driver.findUnique({
      where: { id: tripData.driverId }
    });

    if (!driver || !driver.activo) throw new Error('Conductor no encontrado o inactivo');

    // 3. Obtener tarifa para el tipo de viaje
    const tariff = await tx.rateTariff.findUnique({
      where: { tipoViaje: tripData.tipoViaje }
    });

    if (!tariff) throw new Error(`No se encontró una tarifa configurada para viajes de tipo ${tripData.tipoViaje}`);

    // 4. Calcular valor del pago
    const valorPago = Number(tripData.tonelaje) * Number(tariff.valorTon);

    // 5. Crear el viaje
    const newTrip = await tx.trip.create({
      data: {
        ticket: tripData.ticket,
        fecha: tripData.fecha,
        origen: tripData.origen,
        tipoViaje: tripData.tipoViaje,
        tipoPago: tripData.tipoPago,
        tonelaje: tripData.tonelaje,
        valorPago: valorPago,
        consumoAcpm: tripData.consumoAcpm,
        usoFerry: tripData.usoFerry,
        driverId: tripData.driverId,
        vehicleId: tripData.vehicleId,
        registradoPorId: userId
      },
      include: {
        driver: true,
        vehicle: true
      }
    });

    // 6. Actualizar estado del vehículo a EN_VIAJE
    await tx.vehicle.update({
      where: { id: tripData.vehicleId },
      data: { estado: 'EN_VIAJE' }
    });

    // 7. Registrar Auditoría
    await auditService.logAudit({
      userId,
      action: 'CREATE',
      entity: 'Trip',
      entityId: newTrip.id,
      newValues: newTrip
    }, tx);

    console.log(`🎫 Viaje registrado: Ticket ${newTrip.ticket}. 🛡️ Auditoría registrada.`);
    return newTrip;
  });
};

/**
 * Obtiene todos los viajes activos (no eliminados lógicamente).
 */
export const getAllTrips = async () => {
  return await prisma.trip.findMany({
    where: { deletedAt: null },
    include: {
      driver: {
        select: { primerNombre: true, primerApellido: true, cedula: true }
      },
      vehicle: {
        select: { placa: true, marca: true }
      },
      registradoPor: {
        select: { primerNombre: true, primerApellido: true }
      }
    },
    orderBy: { fecha: 'desc' }
  });
};

/**
 * Obtiene detalle de un viaje.
 */
export const getTripById = async (id) => {
  return await prisma.trip.findUnique({
    where: { id, deletedAt: null },
    include: {
      driver: true,
      vehicle: true,
      registradoPor: true
    }
  });
};

/**
 * Actualiza un viaje existente con registro de auditoría.
 * Gestiona el re-cálculo de pagos y cambio de vehículos si es necesario.
 */
export const updateTrip = async (id, updateData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Obtener viaje actual
    const oldTrip = await tx.trip.findUnique({ 
      where: { id, deletedAt: null } 
    });
    if (!oldTrip) throw new Error('Viaje no encontrado o ya ha sido eliminado');

    const dataToUpdate = { ...updateData };
    dataToUpdate.actualizadoPorId = userId;

    // 2. Si cambia el vehículo, gestionar estados
    if (updateData.vehicleId && updateData.vehicleId !== oldTrip.vehicleId) {
      // Validar nuevo vehículo
      const newVehicle = await tx.vehicle.findUnique({ where: { id: updateData.vehicleId } });
      if (!newVehicle || !newVehicle.activo) throw new Error('Nuevo vehículo no encontrado o inactivo');
      if (newVehicle.estado !== 'DISPONIBLE') throw new Error(`El vehículo ${newVehicle.placa} no está disponible`);

      // Liberar vehículo anterior
      await tx.vehicle.update({
        where: { id: oldTrip.vehicleId },
        data: { estado: 'DISPONIBLE' }
      });

      // Ocupar nuevo vehículo
      await tx.vehicle.update({
        where: { id: updateData.vehicleId },
        data: { estado: 'EN_VIAJE' }
      });
    }

    // 3. Si cambia tonelaje o tipo de viaje, re-calcular pago
    if (updateData.tonelaje || updateData.tipoViaje) {
      const tonelaje = updateData.tonelaje || oldTrip.tonelaje;
      const tipoViaje = updateData.tipoViaje || oldTrip.tipoViaje;

      const tariff = await tx.rateTariff.findUnique({
        where: { tipoViaje }
      });
      if (!tariff) throw new Error(`No hay tarifa configurada para viajes ${tipoViaje}`);

      dataToUpdate.valorPago = Number(tonelaje) * Number(tariff.valorTon);
    }

    // 4. Ejecutar actualización
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: dataToUpdate,
      include: { driver: true, vehicle: true }
    });

    // 5. Registrar Auditoría
    await auditService.logAudit({
      userId,
      action: 'UPDATE',
      entity: 'Trip',
      entityId: id,
      oldValues: oldTrip,
      newValues: updatedTrip
    }, tx);

    console.log(`✅ Viaje ${updatedTrip.ticket} actualizado exitosamente.`);
    return updatedTrip;
  });
};

/**
 * Realiza un Soft Delete del viaje y libera el vehículo.
 */
export const deleteTrip = async (id, userId) => {
  return await prisma.$transaction(async (tx) => {
    const oldTrip = await tx.trip.findUnique({ where: { id } });
    if (!oldTrip) throw new Error('Viaje no encontrado');

    const deletedTrip = await tx.trip.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        actualizadoPorId: userId
      }
    });

    // Liberar vehículo si estaba en viaje
    await tx.vehicle.update({
      where: { id: oldTrip.vehicleId },
      data: { estado: 'DISPONIBLE' }
    });

    await auditService.logAudit({
      userId,
      action: 'DELETE',
      entity: 'Trip',
      entityId: id,
      oldValues: oldTrip,
      newValues: { deletedAt: deletedTrip.deletedAt }
    }, tx);

    console.log(`🗑️ Viaje ${oldTrip.ticket} eliminado. Vehículo liberado.`);
    return deletedTrip;
  });
};
