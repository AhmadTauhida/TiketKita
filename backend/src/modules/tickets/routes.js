import { Router } from 'express';

import { authenticate } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { getTicket, listTickets } from './controller.js';
import { listTicketsQuerySchema } from './validation.js';

const router = Router();

router.use(authenticate);

router.get('/', validate(listTicketsQuerySchema, 'query'), listTickets);
router.get('/:id', getTicket);

export default router;
