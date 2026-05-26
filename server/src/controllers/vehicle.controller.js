import * as vehicleService from '../services/vehicle.service.js';

/**
 * ============================================================
 * CONTROLADOR DE VEHÍCULOS (VEHICLE CONTROLLER)
 * ============================================================
 * Capa de Orquestación HTTP para la gestión de flota física.
 * Comunica los endpoints con el servicio de vehículos garantizando auditoría.
 */

/**
 * @route   POST /api/vehiculos
 * @desc    Registra un nuevo vehículo de fletes en el sistema
 * @access  Privado (ADMIN, OPERADOR)
 * @trazabilidad Pasa req.user.id al servicio para registrar el creador del registro en auditoría
 */
export const create = async (req, res) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body, req.user.id);
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @route   GET /api/vehiculos
 * @desc    Obtiene la lista de todos los vehículos activos
 * @access  Privado (ADMIN, OPERADOR)
 */
export const getAll = async (req, res) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route   GET /api/vehiculos/:id
 * @desc    Obtiene el detalle y estado operativo de un vehículo específico
 * @access  Privado (ADMIN, OPERADOR)
 */
export const getById = async (req, res) => {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    if (!vehicle) return res.status(404).json({ error: 'Vehículo no encontrado' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route   PUT /api/vehiculos/:id
 * @desc    Actualiza la información o estado (DISPONIBLE, EN_VIAJE, MANTENIMIENTO) del vehículo
 * @access  Privado (ADMIN, OPERADOR)
 * @trazabilidad Pasa req.user.id para registrar el snapshot del cambio de datos en la auditoría
 */
export const update = async (req, res) => {
  try {
    const vehicle = await vehicleService.updateVehicle(req.params.id, req.body, req.user.id);
    res.json(vehicle);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @route   DELETE /api/vehiculos/:id
 * @desc    Realiza la baja lógica (Soft Delete) del vehículo de la flota activa
 * @access  Privado (ADMIN)
 * @trazabilidad Registra el Soft Delete en la bitácora inmutable junto con el administrador actor
 */
export const remove = async (req, res) => {
  try {
    const vehicle = await vehicleService.deleteVehicle(req.params.id, req.user.id);
    res.json({ message: 'Vehículo eliminado (Soft Delete)', vehicle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

