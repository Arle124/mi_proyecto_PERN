import * as userService from '../services/user.service.js';

/**
 * ============================================================
 * CONTROLADOR DE USUARIOS (USER CONTROLLER)
 * ============================================================
 * Capa de Orquestación HTTP para la gestión de usuarios/operadores.
 * Reservado exclusivamente para administradores autenticados.
 */

/**
 * @route   GET /api/usuarios
 * @desc    Lista todos los usuarios (operadores y administradores) activos
 * @access  Privado (ADMIN)
 */
export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route   POST /api/usuarios
 * @desc    Registra una nueva cuenta de operador o administrador en el sistema
 * @access  Privado (ADMIN)
 * @trazabilidad Requiere req.user.id para verificar que el creador sea un administrador activo y registrar auditoría
 */
export const createNewUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body, req.user.id);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @route   PUT /api/usuarios/:id
 * @desc    Actualiza información, contraseñas o roles de un usuario
 * @access  Privado (ADMIN)
 * @trazabilidad Valida a través del servicio que no ocurran auto-bloqueos o degradación del último administrador activo
 */
export const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

