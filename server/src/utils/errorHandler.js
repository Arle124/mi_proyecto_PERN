import { Prisma } from '@prisma/client';

/**
 * Traduce y formatea errores técnicos (especialmente de Prisma y base de datos)
 * a mensajes de usuario amigables y profesionales en español.
 * 
 * @param {Error} error - El objeto de error capturado.
 * @returns {{ status: number, message: string }} Objeto con código HTTP y mensaje amigable.
 */
export const formatError = (error) => {
  // Valores por defecto
  let status = 500;
  let message = error.message || 'Ha ocurrido un error inesperado en el sistema.';

  // 1. Errores conocidos de Prisma (Base de Datos)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        status = 409; // Conflict
        const target = error.meta?.target;
        
        if (target) {
          const targetStr = Array.isArray(target) ? target.join(', ') : String(target);
          
          if (targetStr.includes('ticket')) {
            message = 'El número de ticket ingresado ya está registrado en el sistema. Por favor, use un número de ticket único para esta planilla.';
          } else if (targetStr.includes('cedula')) {
            message = 'La cédula del conductor ya se encuentra registrada en el sistema.';
          } else if (targetStr.includes('placa')) {
            message = 'La placa del vehículo ya está registrada en el sistema.';
          } else if (targetStr.includes('correo')) {
            message = 'El correo electrónico ya está registrado por otro usuario en la plataforma.';
          } else {
            message = `Ya existe un registro con el mismo valor en el campo: ${targetStr}.`;
          }
        } else {
          message = 'Ya existe un registro en el sistema con estos datos únicos (el ticket, cédula, placa o correo ya se encuentra en uso).';
        }
        break;
      }
      case 'P2003': {
        status = 400; // Bad Request
        const field = error.meta?.field_name;
        
        if (field && typeof field === 'string') {
          if (field.includes('driverId')) {
            message = 'El conductor seleccionado no es válido o no existe en el sistema.';
          } else if (field.includes('vehicleId')) {
            message = 'El vehículo seleccionado no es válido o no existe en el sistema.';
          } else if (field.includes('registradoPorId') || field.includes('actualizadoPorId')) {
            message = 'El usuario/operador asociado no es válido o no existe en el sistema.';
          } else {
            message = `Error de relación: Falla en la validación de integridad referencial del campo (${field}).`;
          }
        } else {
          message = 'Error de relación: El registro de referencia asociado no es válido o no existe.';
        }
        break;
      }
      case 'P2025':
        status = 404; // Not Found
        message = 'El registro solicitado no fue encontrado, no existe o ya ha sido eliminado.';
        break;
      case 'P2011':
        status = 400; // Bad Request
        message = 'Falta un valor obligatorio requerido por el sistema en el registro. Por favor complete todos los campos mandatorios.';
        break;
      default:
        status = 400;
        message = `Error de base de datos (${error.code}): ${error.message}`;
        break;
    }
  } 
  // 2. Errores de validación de sintaxis de Prisma
  else if (error instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = 'Error de formato: Los datos suministrados no coinciden con la estructura esperada por el servidor.';
  } 
  // 3. Errores de comunicación/inicialización de Prisma
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    status = 503; // Service Unavailable
    message = 'El sistema no pudo conectarse al servidor de base de datos. Por favor, reintente en unos instantes.';
  } 
  // 4. Errores críticos de pánico de Prisma
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    status = 500;
    message = 'Error interno crítico en el motor de persistencia. Por favor contacte a soporte técnico.';
  }
  // 5. Errores generales que se definen con mensajes explícitos (ej. throw new Error("..."))
  else if (error instanceof Error) {
    // Si es un error personalizado lanzado por nosotros, solemos poner status 400
    status = 400;
    message = error.message;
  }

  return { status, message };
};
