import { Router } from 'express';
import * as tripController from '../controllers/trip.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { tripSchema, updateTripSchema } from '../schemas/trip.schema.js';
import { adminMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', tripController.getAll);
router.get('/:id', tripController.getById);
router.post('/', validate(tripSchema), tripController.create);
router.put('/:id', validate(updateTripSchema), tripController.update);

// Solo el ADMIN puede eliminar viajes (según política de auditoría)
router.delete('/:id', adminMiddleware, tripController.remove);

export default router;
