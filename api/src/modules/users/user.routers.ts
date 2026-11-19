import { Router } from 'express';
import * as AuthController from './user.controller';
import { isAdmin } from '../../middlewares/auth.middleware';
import { loginLimiter, loginAccountLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', loginLimiter, loginAccountLimiter, AuthController.login);
router.get('/session', isAdmin, AuthController.session);

export default router;
