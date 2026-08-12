import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authRateLimiter } from '../../shared/middleware/rate-limit.middleware';

const router = Router();
const controller = new AuthController();

router.post('/session', authRateLimiter, (req, res, next) => controller.handleSession(req, res, next));
router.post('/refresh', (req, res, next) => controller.handleRefresh(req, res, next));
router.post('/logout', (req, res) => controller.handleLogout(req, res));

export default router;
