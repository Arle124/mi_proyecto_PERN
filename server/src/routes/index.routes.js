import { Router } from 'express';
import userRoutes from './user.routes.js';
import vehicleRoutes from './vehicle.routes.js';

const router = Router();

router.use('/usuarios', userRoutes);
router.use('/vehiculos', vehicleRoutes);

export default router;
