import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/', userController.getUsers);
router.post('/', validate(createUserSchema), userController.createNewUser);
router.put('/:id', validate(updateUserSchema), userController.updateUser);

export default router;

