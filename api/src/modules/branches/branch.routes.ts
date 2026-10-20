import { Router } from 'express';
import { getPublicBranch } from './branch.controller';

const router = Router();
router.get('/:slug', getPublicBranch);

export default router;
