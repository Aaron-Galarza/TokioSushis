import { Router } from 'express';
import { getPublicBranch, getPublicBranches } from './branch.controller';

const router = Router();
router.get('/', getPublicBranches);
router.get('/:slug', getPublicBranch);

export default router;
