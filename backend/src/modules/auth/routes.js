import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';
import { login, register } from './controller.js';
import { loginSchema, registerSchema } from './validation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
