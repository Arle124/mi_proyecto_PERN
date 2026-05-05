/**
 * Middleware para validar permisos de administrador.
 * Verifica si el rol del usuario autenticado es 'ADMIN'.
 */
export const adminMiddleware = (req, res, next) => {
  // Se asume que authMiddleware ya inyectó req.user
  if (!req.user || req.user.rol !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
};
