import { Router } from 'express';
import * as AuthController from './user.controller';
import { loginLimiter } from '../../middlewares/rateLimiter.middleware';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

router.post('/login', loginLimiter, AuthController.login);
router.post('/accept-invite', loginLimiter, AuthController.acceptInvite);
router.get('/me', authenticate, AuthController.me);

export default router;
