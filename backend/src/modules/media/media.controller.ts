import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { ProjectsService } from '../projects/projects.service';
import { getProjectFilePath } from '../../shared/storage/file.storage';
import fs from 'fs';

const projectsService = new ProjectsService();

export class MediaController {
  async serveMediaFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { projectId, filename } = req.params;

      // Verify project ownership before serving file
      await projectsService.getProjectById(userId, projectId);

      const filePath = getProjectFilePath(projectId, filename);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}
