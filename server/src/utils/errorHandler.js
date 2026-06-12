import { Prisma } from '@prisma/client';

/**
 * ============================================================================
 * MAPAS DECLARATIVOS DE TRADUCCIÓN DE ERRORES (Reducción de bifurcaciones McCabe)
 * ============================================================================
 */

/**
 * Mensajes de error específicos para restricciones de unicidad (Prisma P2002).
 * Mapea fragmentos identificables del campo meta afectado a explicaciones semánticas.
 */
const UNIQUE_CONSTRAINT_MESSAGES = {
  ticket: 'El número de ticket ingresado ya está registrado en el sistema. Por favor, use un número de ticket único para esta planilla.',
  cedula: 'La cédula del conductor ya se encuentra registrada en el sistema.',
  placa: 'La placa del vehículo ya está registrada en el sistema.',
  correo: 'El correo electrónico ya está registrado por otro usuario en la plataforma.'
};

/**
 * Mensajes de error específicos para fallos de claves foráneas / integridad referencial (Prisma P2003).
 */
const FOREIGN_KEY_MESSAGES = {
  driverId: 'El conductor seleccionado no es válido o no existe en el sistema.',
  vehicleId: 'El vehículo seleccionado no es válido o no existe en el sistema.',
  registradoPorId: 'El usuario/operador asociado no es válido o no existe en el sistema.',
  actualizadoPorId: 'El usuario/operador asociado no es válido o no existe en el sistema.'
};

/**
 * Traduce y formatea errores técnicos (especialmente de Prisma y base de datos)
 * a mensajes de usuario amigables y profesionales en español.
 * 
 * Se ha refactoreado de una estructura imperativa if/else anidada a un diseño
 * declarativo de diccionarios, reduciendo la complejidad ciclomática de la función.
 * 
 * @param {Error} error - El objeto de error capturado.
 * @returns {{ status: number, message: string }} Objeto con código HTTP y mensaje amigable.
 */
export const formatError = (error) => {
  // Inicialización de valores por defecto (Fallo de Servidor General)
  let status = 500;
  let message = error.message || 'Ha ocurrido un error inesperado en el sistema.';

  // 1. Interceptar errores conocidos provenientes del ORM (PrismaClientKnownRequestError)
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      
      // Código P2002: Violación de restricción única (Unique Constraint)
      case 'P2002': {
        status = 409; // HTTP 409 Conflict
        const target = error.meta?.target;
        
        if (target) {
          // Unificar en un solo string plano para simplificar la búsqueda
          const targetStr = Array.isArray(target) ? target.join(', ') : String(target);
          
          // Buscar de forma declarativa si hay un mensaje específico configurado para el target
          const matchedKey = Object.keys(UNIQUE_CONSTRAINT_MESSAGES).find(key => targetStr.includes(key));
          
          message = matchedKey 
            ? UNIQUE_CONSTRAINT_MESSAGES[matchedKey] 
            : `Ya existe un registro con el mismo valor en el campo: ${targetStr}.`;
        } else {
          // Mensaje genérico de salvaguarda si no se puede determinar la meta de restricción única
          message = 'Ya existe un registro en el sistema con estos datos únicos (el ticket, cédula, placa o correo ya se encuentra en uso).';
        }
        break;
      }
      
      // Código P2003: Violación de restricción de clave externa (Foreign Key Constraint)
      case 'P2003': {
        status = 400; // HTTP 400 Bad Request
        const field = error.meta?.field_name;
        
        if (field && typeof field === 'string') {
          // Buscar de forma declarativa el mensaje de integridad referencial adecuado
          const matchedKey = Object.keys(FOREIGN_KEY_MESSAGES).find(key => field.includes(key));
          
          message = matchedKey 
            ? FOREIGN_KEY_MESSAGES[matchedKey] 
            : `Error de relación: Falla en la validación de integridad referencial del campo (${field}).`;
        } else {
          message = 'Error de relación: El registro de referencia asociado no es válido o no existe.';
        }
        break;
      }
      
      // Código P2025: Registro no encontrado en actualizaciones/eliminaciones
      case 'P2025':
        status = 404; // HTTP 404 Not Found
        message = 'El registro solicitado no fue encontrado, no existe o ya ha sido eliminado.';
        break;
      
      // Código P2011: Violación de restricción no nula (Null Constraint)
      case 'P2011':
        status = 400; // HTTP 400 Bad Request
        message = 'Falta un valor obligatorio requerido por el sistema en el registro. Por favor complete todos los campos mandatorios.';
        break;
      
      // Otros códigos de base de datos no mapeados explícitamente
      default:
        status = 400;
        message = `Error de base de datos (${error.code}): ${error.message}`;
        break;
    }
  } 
  // 2. Errores de validación estructural de tipos en el cliente del ORM
  else if (error instanceof Prisma.PrismaClientValidationError) {
    status = 400;
    message = 'Error de formato: Los datos suministrados no coinciden con la estructura esperada por el servidor.';
  } 
  // 3. Fallo en conexión inicial con la base de datos (Ej: caída de red o credenciales incorrectas)
  else if (error instanceof Prisma.PrismaClientInitializationError) {
    status = 503; // HTTP 503 Service Unavailable
    message = 'El sistema no pudo conectarse al servidor de base de datos. Por favor, reintente en unos instantes.';
  } 
  // 4. Fallos fatales internos o de compilación binaria de Prisma
  else if (error instanceof Prisma.PrismaClientRustPanicError) {
    status = 500;
    message = 'Error interno crítico en el motor de persistencia. Por favor contacte a soporte técnico.';
  }
  // 5. Errores de negocio estándar lanzados manualmente mediante "throw new Error(...)"
  else if (error instanceof Error) {
    status = 400;
    message = error.message;
  }

  return { status, message };
};
