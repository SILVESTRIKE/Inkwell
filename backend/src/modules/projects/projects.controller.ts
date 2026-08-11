import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { ProjectsService } from './projects.service';

const projectsService = new ProjectsService();

export class ProjectsController {
  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title, bookText } = req.body;
      const project = await projectsService.createProject(userId, title, bookText);
      res.status(201).json(project);
    } catch (err) {
      next(err);
    }
  }

  async listProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projects = await projectsService.getUserProjects(userId);
      res.json(projects);
    } catch (err) {
      next(err);
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      const project = await projectsService.getProjectById(userId, projectId);
      res.json(project);
    } catch (err) {
      next(err);
    }
  }
}
