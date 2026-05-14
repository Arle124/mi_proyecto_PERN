import * as tripService from '../services/trip.service.js';

export const create = async (req, res) => {
  try {
    const trip = await tripService.createTrip(req.body, req.user.id);
    res.status(201).json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const trips = await tripService.getAllTrips();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Viaje no encontrado' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.user.id);
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const trip = await tripService.deleteTrip(req.params.id, req.user.id);
    res.json({ message: 'Viaje eliminado y vehículo liberado', trip });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
