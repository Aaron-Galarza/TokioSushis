import { Router } from 'express';
import { getAnalyticsReport } from './analytics.controller';
import { isAdmin } from '../../middlewares/auth.middleware'; 

const router = Router();

router.get('/',isAdmin, getAnalyticsReport);

export default router;