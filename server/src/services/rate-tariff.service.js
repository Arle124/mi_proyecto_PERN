import { prisma } from '../config/db.js';
import * as auditService from './audit.service.js';

/**
 * Crea o actualiza una tarifa.
 */
export const upsertRateTariff = async (tariffData, userId = null) => {
  return await prisma.$transaction(async (tx) => {
    const existingTariff = await tx.rateTariff.findUnique({
      where: { producto: tariffData.producto }
    });

    const tariff = await tx.rateTariff.upsert({
      where: { producto: tariffData.producto },
      update: {
        valorKg: tariffData.valorKg,
        activo: tariffData.activo ?? true,
        deletedAt: null
      },
      create: {
        producto: tariffData.producto,
        valorKg: tariffData.valorKg,
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

    console.log(`💰 Tarifa ${tariff.producto} configurada en $${tariff.valorKg} por Kg. 🛡️ Auditoría registrada.`);
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
 * Obtiene tarifa por producto.
 */
export const getTariffByProduct = async (producto) => {
  return await prisma.rateTariff.findUnique({
    where: { producto, deletedAt: null }
  });
};
