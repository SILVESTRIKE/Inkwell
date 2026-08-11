import { Router } from 'express';
import { PipelineController } from './pipeline.controller';
import { requireAuth } from '../../shared/middleware/auth.middleware';
import { pipelineRateLimiter } from '../../shared/middleware/rate-limit.middleware';

const router = Router();
const controller = new PipelineController();

router.use(requireAuth as any);

router.post('/:id/steps/:step/run', pipelineRateLimiter, (req, res, next) => controller.runStep(req as any, res, next));
router.post('/:id/steps/:step/recover', (req, res, next) => controller.recoverStep(req as any, res, next));

export default router;
