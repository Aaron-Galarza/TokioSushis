import { Router } from 'express';
import * as ctrl from './geocoding.controller';
import { geocodingLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.get('/google', geocodingLimiter, ctrl.google);

export default router;
