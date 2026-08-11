import { Project, IProject } from './project.model';
import { AppError } from '../../shared/middleware/error.middleware';
import { saveProjectFile } from '../../shared/storage/file.storage';
import { GeminiClient } from '../../shared/gemini/gemini.client';

export class ProjectsService {
  private geminiClient = new GeminiClient();

  async createProject(userId: string, title: string, bookText: string): Promise<IProject> {
    if (!title || title.trim().length === 0) {
      throw new AppError(400, 'Project title is required');
    }
    if (!bookText || bookText.trim().length === 0) {
      throw new AppError(400, 'Book text is required');
    }

    const project = new Project({
      userId,
      title: title.trim(),
      bookText: bookText.trim(),
      overallStatus: 'draft',
      currentStepNumber: 1,
      stepStates: [
        { stepNumber: 1, stepName: 'style', status: 'pending' },
        { stepNumber: 2, stepName: 'characters', status: 'pending' },
        { stepNumber: 3, stepName: 'portraits', status: 'pending' },
        { stepNumber: 4, stepName: 'chapters', status: 'pending' },
        { stepNumber: 5, stepName: 'illustrations', status: 'pending' },
      ],
      outputs: {},
    });

    await project.save();

    // Store book text on local disk
    await saveProjectFile(project._id.toString(), 'book.txt', bookText);

    // Cache content with Gemini API once (Constraint #5)
    try {
      const cachedName = await this.geminiClient.uploadOrCacheBookText(bookText);
      if (cachedName) {
        project.cachedContentName = cachedName;
        await project.save();
      }
    } catch (err) {
      console.warn('Gemini context caching warning:', err);
    }

    return project;
  }

  async getUserProjects(userId: string): Promise<IProject[]> {
    return await Project.find({ userId }).sort({ createdAt: -1 });
  }

  async getProjectById(userId: string, projectId: string): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
      throw new AppError(404, 'Project not found');
    }
    return project;
  }
}
