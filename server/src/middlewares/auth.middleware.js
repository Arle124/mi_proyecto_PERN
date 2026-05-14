import jwt from 'jsonwebtoken';

/**
 * Middleware de Autenticación Centralizado.
 * Como DevOps Senior, hemos migrado de 'Authorization Bearer' a 'HttpOnly Cookies'.
 * Este cambio blinda el sistema contra ataques de robo de sesión (XSS).
 */
export const authMiddleware = (req, res, next) => {
  // Intentamos extraer el token de la cookie blindada, 
  // manteniendo compatibilidad con headers para herramientas de testing (Postman/Insomnia)
  const token = req.cookies.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Sesión no válida o expirada.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Inyectamos el payload (id, rol) en el objeto de la petición
    // Esto es vital para la trazabilidad en la capa de servicios y auditoría
    req.user = decoded; 
    
    next();
  } catch (error) {
    // Si el token es inválido, limpiamos la cookie para evitar loops de error en el cliente
    res.clearCookie('token');
    return res.status(401).json({ error: 'Token inválido o sesión caducada.' });
  }
};
