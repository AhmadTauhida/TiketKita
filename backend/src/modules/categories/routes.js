import { Router } from 'express';

import { listCategories } from './controller.js';

const router = Router();

router.get('/', listCategories);

export default router;
