import * as authService from '../services/auth.service.js';

export const login = async (req, res) => {
  const { correo, password } = req.body;
  const ipAddress = req.ip;
  const userAgent = req.get('User-Agent');

  try {
    const result = await authService.login(correo, password, ipAddress, userAgent);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};
