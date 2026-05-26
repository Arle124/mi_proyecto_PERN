/**
 * ============================================================
 * MIDDLEWARE DE AUTORIZACIÓN (ROLE MIDDLEWARE - RBAC)
 * ============================================================
 * Implementa el control de acceso basado en roles (Role-Based Access Control).
 * Defensa en profundidad para evitar ataques de elevación de privilegios.
 */

/**
 * Middleware para validar permisos de administrador.
 * Verifica si el rol del usuario autenticado es 'ADMIN'.
 * Se asume que el `authMiddleware` se ejecutó previamente e inyectó `req.user`.
 * 
 * @param {Object} req - Objeto de petición HTTP Express
 * @param {Object} res - Objeto de respuesta HTTP Express
 * @param {Function} next - Función callback para continuar al siguiente middleware/controlador
 */
export const adminMiddleware = (req, res, next) => {
  // Se valida la existencia del token decodificado y que el rol sea ADMIN
  if (!req.user || req.user.rol !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador activos.' 
    });
  }
  next();
};

