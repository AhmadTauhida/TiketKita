import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { getProfile, updateProfile } from './controller.js';
import { updateProfileSchema } from './validation.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

export default router;
