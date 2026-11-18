import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { cancelBooking, createBooking, getBooking, listBookings } from './controller.js';
import { createBookingSchema, listBookingsQuerySchema } from './validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validate(createBookingSchema), createBooking);
router.get('/', validate(listBookingsQuerySchema, 'query'), listBookings);
router.get('/:id', getBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
