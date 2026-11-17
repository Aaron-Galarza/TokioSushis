import { Router } from 'express';
import { authenticate, authorize } from '../../middlewares/auth.middleware';
import { overview } from './owner.controller';
import { management, createBranch, updateBranch, createStaff, updateStaff, renewInvite } from './owner.management';

const router = Router();
router.get('/overview', authenticate, authorize('owner'), overview);
router.get('/management', authenticate, authorize('owner'), management);
router.post('/branches', authenticate, authorize('owner'), createBranch);
router.put('/branches/:id', authenticate, authorize('owner'), updateBranch);
router.post('/staff', authenticate, authorize('owner'), createStaff);
router.patch('/staff/:id', authenticate, authorize('owner'), updateStaff);
router.post('/staff/:id/invite', authenticate, authorize('owner'), renewInvite);
export default router;
