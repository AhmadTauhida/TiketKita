import { Router } from 'express';

import authRoutes from '../modules/auth/routes.js';
import bookingRoutes from '../modules/bookings/routes.js';
import categoryRoutes from '../modules/categories/routes.js';
import eventRoutes from '../modules/events/routes.js';
import userRoutes from '../modules/users/routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);

export default router;
