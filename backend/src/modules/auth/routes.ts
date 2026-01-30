import { Router } from 'express';
import { login, register, refreshToken, logout, me } from './controller';
import { authenticate } from '../../shared/middleware/auth';
import { authRateLimiter } from '../../shared/middleware/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);

export default router;
