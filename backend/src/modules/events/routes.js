import { Router } from 'express';

import { validate } from '../../middlewares/validate.js';
import { getEventDetail, listEvents, listFeaturedEvents } from './controller.js';
import { listEventsQuerySchema } from './validation.js';

const router = Router();

router.get('/featured', listFeaturedEvents);
router.get('/', validate(listEventsQuerySchema, 'query'), listEvents);
router.get('/:id', getEventDetail);

export default router;
