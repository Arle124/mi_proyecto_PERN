import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.put('/perfil', authMiddleware, authController.updateProfile);

export default router;

