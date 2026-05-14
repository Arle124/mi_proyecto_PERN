import * as rateTariffService from '../services/rate-tariff.service.js';

export const upsert = async (req, res) => {
  try {
    const tariff = await rateTariffService.upsertRateTariff(req.body, req.user.id);
    res.json(tariff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const tariffs = await rateTariffService.getAllTariffs();
    res.json(tariffs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
