import { Router } from 'express';
import * as driverController from '../controllers/driver.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { driverSchema, updateDriverSchema } from '../schemas/driver.schema.js';
import { adminMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

router.get('/', driverController.getAll);
router.get('/:id', driverController.getById);
router.post('/', validate(driverSchema), driverController.create);

// Solo el ADMIN puede editar o eliminar conductores
router.put('/:id', adminMiddleware, validate(updateDriverSchema), driverController.update);
router.delete('/:id', adminMiddleware, driverController.remove);

export default router;
