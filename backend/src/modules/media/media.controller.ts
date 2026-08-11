import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { ProjectsService } from '../projects/projects.service';
import { getProjectFilePath } from '../../shared/storage/file.storage';
import fs from 'fs';

const projectsService = new ProjectsService();

export class MediaController {
  async serveMediaFile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId, filename } = req.params as { projectId?: string; filename?: string };
      const wildcardPath = (req.params as any)[0];
      const relativeOrFileName = wildcardPath || (projectId && filename ? `${projectId}/${filename}` : filename);

      if (!relativeOrFileName) {
        res.status(400).json({ error: 'Invalid file path request' });
        return;
      }

      const filePath = getProjectFilePath(projectId || '', relativeOrFileName);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Detect SVG placeholder content in .jpg/.png files so mock mode renders cleanly in browser
      const fileBuffer = fs.readFileSync(filePath);
      const isSvg = fileBuffer.toString('utf-8', 0, 100).includes('<svg');
      if (isSvg) {
        res.setHeader('Content-Type', 'image/svg+xml');
        res.send(fileBuffer);
        return;
      }

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}
