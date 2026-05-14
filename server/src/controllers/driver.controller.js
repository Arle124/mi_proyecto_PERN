import * as driverService from '../services/driver.service.js';

export const create = async (req, res) => {
  try {
    const driver = await driverService.createDriver(req.body, req.user.id);
    res.status(201).json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const drivers = await driverService.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Conductor no encontrado' });
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const driver = await driverService.updateDriver(req.params.id, req.body, req.user.id);
    res.json(driver);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const driver = await driverService.deleteDriver(req.params.id, req.user.id);
    res.json({ message: 'Conductor eliminado (Soft Delete)', driver });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
