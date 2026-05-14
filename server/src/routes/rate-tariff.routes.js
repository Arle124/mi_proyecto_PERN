import { Router } from 'express';
import * as rateTariffController from '../controllers/rate-tariff.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { rateTariffSchema } from '../schemas/rate-tariff.schema.js';
import { adminMiddleware } from '../middlewares/role.middleware.js';

const router = Router();

// Todos los usuarios autenticados pueden ver tarifas
router.get('/', rateTariffController.getAll);

// Solo el ADMIN puede configurar tarifas
router.post('/', adminMiddleware, validate(rateTariffSchema), rateTariffController.upsert);

export default router;
