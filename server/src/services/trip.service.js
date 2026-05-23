import { prisma } from '../config/db.js';
import * as auditService from './audit.service.js';

/**
 * Crea un nuevo viaje con registro de auditoría.
 * Calcula el valor del pago basado en la tarifa actual de kg si es FRUTO.
 * Permite ingresar el precio estipulado manualmente si es COMPOST.
 */
export const createTrip = async (tripData, userId) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Validar que el vehículo esté activo
    const vehicle = await tx.vehicle.findUnique({
      where: { id: tripData.vehicleId }
    });

    if (!vehicle || !vehicle.activo) throw new Error('Vehículo no encontrado o inactivo');

    // 2. Validar que el conductor esté activo
    const driver = await tx.driver.findUnique({
      where: { id: tripData.driverId }
    });

    if (!driver || !driver.activo) throw new Error('Conductor no encontrado o inactivo');

    // 3. Calcular o asignar valor del pago
    let valorPago = 0;
    if (tripData.producto === 'FRUTO') {
      const tariff = await tx.rateTariff.findUnique({
        where: { producto: 'FRUTO' }
      });
      if (!tariff || !tariff.activo) throw new Error('No se encontró una tarifa activa configurada para FRUTO');
      
      // valorPago = toneladas * 1000 kg/ton * valor por kg
      valorPago = Number(tripData.tonelaje) * 1000 * Number(tariff.valorKg);
    } else if (tripData.producto === 'COMPOST') {
      if (tripData.valorPago === undefined || tripData.valorPago === null) {
        throw new Error('El valor del pago es obligatorio para el producto COMPOST');
      }
      valorPago = Number(tripData.valorPago);
    } else {
      throw new Error(`Producto no válido: ${tripData.producto}`);
    }

    // 4. Crear el viaje
    const newTrip = await tx.trip.create({
      data: {
        ticket: Number(tripData.ticket),
        fecha: new Date(tripData.fecha),
        origen: tripData.origen,
        producto: tripData.producto,
        tipoPago: tripData.tipoPago || 'TRANSFERENCIA',
        tonelaje: tripData.tonelaje,
        valorPago: valorPago,
        consumoAcpm: tripData.consumoAcpm,
        usoFerry: tripData.usoFerry || false,
        driverId: tripData.driverId,
        vehicleId: tripData.vehicleId,
        registradoPorId: userId
      },
      include: {
        driver: true,
        vehicle: true
      }
    });

    // 5. Registrar Auditoría
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
 * Re-calcula el pago o recibe el valor manual si es compost.
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
    
    // Si viene una fecha, aseguramos el formato Date
    if (updateData.fecha) {
      dataToUpdate.fecha = new Date(updateData.fecha);
    }

    // Asegurar ticket numérico
    if (updateData.ticket !== undefined) {
      dataToUpdate.ticket = Number(updateData.ticket);
    }

    // 2. Si cambia tonelaje, producto o valorPago, gestionar re-cálculos
    const producto = updateData.producto || oldTrip.producto;
    const tonelaje = updateData.tonelaje !== undefined ? updateData.tonelaje : oldTrip.tonelaje;

    if (producto === 'FRUTO') {
      const tariff = await tx.rateTariff.findUnique({
        where: { producto: 'FRUTO' }
      });
      if (!tariff || !tariff.activo) throw new Error('No se encontró una tarifa activa para FRUTO');
      dataToUpdate.valorPago = Number(tonelaje) * 1000 * Number(tariff.valorKg);
    } else if (producto === 'COMPOST') {
      if (updateData.valorPago !== undefined && updateData.valorPago !== null) {
        dataToUpdate.valorPago = Number(updateData.valorPago);
      } else if (oldTrip.producto !== 'COMPOST') {
        throw new Error('Debe especificar el valor del pago para el producto COMPOST');
      }
    }

    // 3. Ejecutar actualización
    const updatedTrip = await tx.trip.update({
      where: { id },
      data: dataToUpdate,
      include: { driver: true, vehicle: true }
    });

    // 4. Registrar Auditoría
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
 * Realiza un Soft Delete del viaje.
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

    await auditService.logAudit({
      userId,
      action: 'DELETE',
      entity: 'Trip',
      entityId: id,
      oldValues: oldTrip,
      newValues: { deletedAt: deletedTrip.deletedAt }
    }, tx);

    console.log(`🗑️ Viaje ${oldTrip.ticket} eliminado.`);
    return deletedTrip;
  });
};
