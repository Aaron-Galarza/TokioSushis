import { Router } from 'express';
import { getAnalyticsReport } from './analytics.controller';
import { managerAccess } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', managerAccess, getAnalyticsReport);

export default router;
