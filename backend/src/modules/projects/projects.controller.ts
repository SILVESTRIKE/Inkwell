import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middleware/auth.middleware';
import { ProjectsService } from './projects.service';
import { transformMediaURLs } from '../../shared/utils/media.util';

const projectsService = new ProjectsService();

export class ProjectsController {
  async createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { title, bookText } = req.body;
      const project = await projectsService.createProject(userId, title, bookText);
      res.status(201).json(transformMediaURLs(req, project));
    } catch (err) {
      next(err);
    }
  }

  async listProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projects = await projectsService.getUserProjects(userId);
      res.json(transformMediaURLs(req, projects));
    } catch (err) {
      next(err);
    }
  }

  async getProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      const project = await projectsService.getProjectById(userId, projectId);
      res.json(transformMediaURLs(req, project));
    } catch (err) {
      next(err);
    }
  }

  async checkBook(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const { bookText } = req.body;
      const existingProject = await projectsService.checkExistingBook(userId, bookText);
      if (existingProject) {
        res.json({ exists: true, project: transformMediaURLs(req, existingProject) });
      } else {
        res.json({ exists: false });
      }
    } catch (err) {
      next(err);
    }
  }

  async deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const projectId = req.params.id;
      await projectsService.deleteProject(userId, projectId);
      res.json({ message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}

