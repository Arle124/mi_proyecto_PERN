import * as rateTariffService from '../services/rate-tariff.service.js';

/**
 * ============================================================
 * CONTROLADOR DE TARIFAS (RATE TARIFF CONTROLLER)
 * ============================================================
 * Capa de Orquestación HTTP para la administración del tarifario.
 * Define los precios base por Kg que sustentan la liquidación financiera.
 */

/**
 * @route   POST /api/tarifas
 * @desc    Crea o actualiza (Upsert) una tarifa base para un producto determinado
 * @access  Privado (ADMIN)
 * @trazabilidad Requiere autenticación e inyecta el ID del administrador en la bitácora
 */
export const upsert = async (req, res) => {
  try {
    const tariff = await rateTariffService.upsertRateTariff(req.body, req.user.id);
    res.json(tariff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * @route   GET /api/tarifas
 * @desc    Obtiene todas las tarifas vigentes del sistema
 * @access  Privado (ADMIN, OPERADOR)
 */
export const getAll = async (req, res) => {
  try {
    const tariffs = await rateTariffService.getAllTariffs();
    res.json(tariffs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

