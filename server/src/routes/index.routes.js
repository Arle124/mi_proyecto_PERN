import { Router } from 'express';
import userRoutes from './user.routes.js';
import vehicleRoutes from './vehicle.routes.js';
import authRoutes from './auth.routes.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Rutas Públicas
router.use('/auth', authRoutes);

// Rutas Protegidas
router.use('/usuarios', authMiddleware, userRoutes);
router.use('/vehiculos', authMiddleware, vehicleRoutes);

export default router;
