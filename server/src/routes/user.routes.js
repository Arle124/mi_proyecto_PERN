import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/', userController.getUsers);
router.post('/', validate(createUserSchema), userController.createNewUser);

export default router;

