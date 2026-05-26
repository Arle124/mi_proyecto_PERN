import { prisma } from '../config/db.js';

/**
 * ============================================================
 * SERVICIO DE AUDITORÍA FORENSE INMUTABLE (AUDIT SERVICE)
 * ============================================================
 * Núcleo de la Trazabilidad del Sistema.
 * Permite registrar bitácoras de mutación inmutables con snapshots JSON
 * representativos de los cambios (antiguos y nuevos valores).
 * Garantiza el No Repudio capturando la IP y el User-Agent.
 */

/**
 * Registra una acción en la bitácora inmutable de auditoría.
 * 
 * @important Para garantizar la atomicidad transaccional (ACID), este método acepta un cliente de
 * transacción `tx`. Si ocurre algún fallo al guardar la auditoría, la excepción se propaga y
 * aborta (Rollback) toda la transacción de la base de datos, impidiendo que existan mutaciones
 * huérfanas sin historial registrado.
 * 
 * @param {Object} auditData - Datos de la auditoría.
 * @param {string} auditData.userId - Identificador único de usuario (UUID) que ejecuta la acción
 * @param {string} auditData.action - Acción realizada ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT')
 * @param {string} auditData.entity - Nombre de la tabla o modelo afectado (ej: 'Trip', 'Vehicle', 'User')
 * @param {string} auditData.entityId - ID físico del registro afectado
 * @param {Object} [auditData.oldValues] - Snapshot anterior al cambio en formato JSON
 * @param {Object} [auditData.newValues] - Snapshot posterior al cambio en formato JSON
 * @param {string} [auditData.ipAddress] - Dirección IP desde la cual se origina el request
 * @param {string} [auditData.userAgent] - Cabecera de agente de usuario emisora
 * @param {Object} [tx] - Instancia de transacción del pool de Prisma (opcional, por defecto usa prisma normal)
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
    // Si la auditoría falla, se escribe en el log local y se propaga el error
    // para abortar transacciones ACID de negocio de manera controlada.
    console.error('❌ Error crítico en persistencia de Auditoría Forense:', error);
    throw error; 
  }
};

