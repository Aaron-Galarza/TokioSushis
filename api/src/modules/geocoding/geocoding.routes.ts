import { Router } from 'express';
import * as ctrl from './geocoding.controller';
import { geocodingLimiter } from '../../middlewares/rateLimiter.middleware';
import { resolvePublicBranch } from '../../middlewares/branch.middleware';

const router = Router();

router.get('/google', geocodingLimiter, resolvePublicBranch, ctrl.google);

export default router;
