import { prisma } from '../config/db.js';

/**
 * Registra una acción en el log de auditoría.
 * @param {Object} auditData - Datos de la auditoría.
 * @param {string} auditData.userId - ID del usuario que realiza la acción.
 * @param {string} auditData.action - Acción (CREATE, UPDATE, DELETE, etc).
 * @param {string} auditData.entity - Nombre de la entidad (Trip, User, etc).
 * @param {string} auditData.entityId - ID de la entidad afectada.
 * @param {Object} [auditData.oldValues] - Valores anteriores (Snapshot).
 * @param {Object} [auditData.newValues] - Valores nuevos (Snapshot).
 * @param {string} [auditData.ipAddress] - Dirección IP.
 */
export const logAudit = async (auditData, tx = prisma) => {
  try {
    return await tx.auditLog.create({
      data: {
        userId: auditData.userId,
        action: auditData.action,
        entity: auditData.entity,
        entityId: auditData.entityId,
        oldValues: auditData.oldValues || {},
        newValues: auditData.newValues || {},
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent
      }
    });
  } catch (error) {
    console.error('❌ Error en Auditoría:', error);
    throw error; // Re-lanzar para asegurar que la transacción falle si la auditoría falla
  }
};
