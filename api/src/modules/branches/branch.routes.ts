import { Router } from 'express';
import { getPublicBranch, getPublicBranches, getManagedBranch, updateManagedBranch } from './branch.controller';
import { managerAccess } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateBranchSchema } from './branch.schema';

const router = Router();
router.get('/', getPublicBranches);
router.get('/admin/current', managerAccess, getManagedBranch);
router.put('/admin/current', managerAccess, validate(updateBranchSchema), updateManagedBranch);
router.get('/:slug', getPublicBranch);

export default router;
