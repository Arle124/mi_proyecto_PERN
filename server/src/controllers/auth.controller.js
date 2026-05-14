import * as authService from '../services/auth.service.js';

/**
 * Orquestador de Autenticación.
 * Como DevOps Senior, implementamos HttpOnly Cookies para asegurar que los tokens
 * de sesión no sean accesibles mediante scripts de terceros (XSS).
 */
export const login = async (req, res) => {
  const { correo, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    const { user, token } = await authService.login(correo, password, ipAddress, userAgent);
    
    // Configuramos la cookie con flags de seguridad Enterprise-grade:
    // - httpOnly: Impide acceso desde document.cookie (Mata el XSS)
    // - secure: Solo viaja por HTTPS (en producción)
    // - sameSite: Previene ataques CSRF
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 Horas de vida en el cliente
    });

    // Retornamos solo la data del usuario, el token ya viaja blindado en la cookie
    res.json({ user });
  } catch (error) {
    console.warn(`⚠️ Intento de login fallido para: ${correo} desde IP: ${ipAddress}`);
    res.status(401).json({ error: error.message });
  }
};

/**
 * Cierre de sesión seguro.
 * Elimina la cookie del lado del cliente.
 */
export const logout = async (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Sesión finalizada correctamente' });
};
