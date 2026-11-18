import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { createPayment, getPayment } from './controller.js';
import { createPaymentSchema } from './validation.js';

const router = Router();

router.use(authenticate);

router.post('/:bookingId', validate(createPaymentSchema), createPayment);
router.get('/:bookingId', getPayment);

export default router;
