import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { PipelineService } from './pipeline.service';
import { transformMediaURLs } from '../../shared/utils/media.util';

const pipelineService = new PipelineService();

export class PipelineController {
  async runStep(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      const stepNumber = parseInt(req.params.step, 10);
      const { userStyle } = req.body || {};

      const project = await pipelineService.runStep(userId, projectId, stepNumber, { userStyle });
      res.status(200).json({
        message: `Step ${stepNumber} completed successfully`,
        jobId: `step-${stepNumber}-${Date.now()}`,
        project: transformMediaURLs(req, project),
      });
    } catch (err) {
      next(err);
    }
  }

  async recoverStep(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      const stepNumber = parseInt(req.params.step, 10);

      const project = await pipelineService.recoverStuckStep(userId, projectId, stepNumber);
      res.json(transformMediaURLs(req, project));
    } catch (err) {
      next(err);
    }
  }
}
