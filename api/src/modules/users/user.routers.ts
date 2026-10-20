import { Router } from 'express';
import * as AuthController from './user.controller';
import { loginLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

router.post('/login', loginLimiter, AuthController.login);

export default router;
