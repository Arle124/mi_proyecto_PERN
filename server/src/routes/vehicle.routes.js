import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { vehicleSchema, updateVehicleSchema } from '../schemas/vehicle.schema.js';
import { adminMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.post('/', validate(vehicleSchema), vehicleController.create);

// Solo el ADMIN puede editar o eliminar vehículos
router.put('/:id', adminMiddleware, validate(updateVehicleSchema), vehicleController.update);
router.delete('/:id', adminMiddleware, vehicleController.remove);

export default router;
