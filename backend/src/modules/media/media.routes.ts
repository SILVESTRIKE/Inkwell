import { Router } from 'express';
import { MediaController } from './media.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';

const router = Router();
const controller = new MediaController();

router.use(requireAuth as any);

router.get('/:projectId/:filename', (req, res, next) => controller.serveMediaFile(req as any, res, next));

export default router;
