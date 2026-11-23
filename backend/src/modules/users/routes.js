import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.js';
import { uploadAvatar, validateAvatar } from '../../middlewares/upload.js';
import { validate } from '../../middlewares/validate.js';
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
} from './controller.js';
import { updateProfileSchema } from './validation.js';

const router = Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.post(
  '/profile/photo',
  authenticate,
  uploadAvatar,
  validateAvatar,
  uploadProfilePhoto,
);

export default router;
