import { Router } from 'express';
import userRoutes from './user.routes.js';

const router = Router();

router.use('/usuarios', userRoutes);

export default router;
