import { prisma } from '../config/db.js';
import * as auditService from './audit.service.js';

/**
 * Crea o actualiza una tarifa.
 */
export const upsertRateTariff = async (tariffData, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    const existingTariff = await tx.rateTariff.findUnique({
      where: { tipoViaje: tariffData.tipoViaje }
    });

    const tariff = await tx.rateTariff.upsert({
      where: { tipoViaje: tariffData.tipoViaje },
      update: {
        valorTon: tariffData.valorTon,
        activo: tariffData.activo ?? true,
        deletedAt: null
      },
      create: {
        tipoViaje: tariffData.tipoViaje,
        valorTon: tariffData.valorTon,
        activo: tariffData.activo ?? true
      }
    });

    await auditService.logAudit({
      userId,
      action: existingTariff ? 'UPDATE' : 'CREATE',
      entity: 'RateTariff',
      entityId: tariff.id.toString(),
      oldValues: existingTariff || {},
      newValues: tariff
    }, tx);

    console.log(`💰 Tarifa ${tariff.tipoViaje} configurada en $${tariff.valorTon}. 🛡️ Auditoría registrada.`);
    return tariff;
  });
};

/**
 * Obtiene todas las tarifas activas.
 */
export const getAllTariffs = async () => {
  return await prisma.rateTariff.findMany({
    where: { deletedAt: null }
  });
};

/**
 * Obtiene tarifa por tipo de viaje.
 */
export const getTariffByType = async (tipoViaje) => {
  return await prisma.rateTariff.findUnique({
    where: { tipoViaje, deletedAt: null }
  });
};
