import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { overview } from './owner.controller';

const router = Router();
router.get('/overview', authenticate, authorize('owner'), overview);
export default router;
