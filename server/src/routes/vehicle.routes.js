import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { vehicleSchema, updateVehicleSchema } from '../schemas/vehicle.schema.js';

const router = Router();

router.get('/', vehicleController.getAll);
router.get('/:id', vehicleController.getById);
router.post('/', validate(vehicleSchema), vehicleController.create);
router.put('/:id', validate(updateVehicleSchema), vehicleController.update);
router.delete('/:id', vehicleController.remove);

export default router;
