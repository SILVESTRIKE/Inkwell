import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { PipelineService } from './pipeline.service';
import { ProjectsService } from '../projects/projects.service';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';
import { GeminiClient } from '../../shared/gemini/gemini.client';

describe('PipelineService', { timeout: 15000 }, () => {
  let pipelineService: PipelineService;
  let projectsService: ProjectsService;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    // Clear API keys so unit tests execute instant mock path (<1s duration)
    delete process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEYS;

    // Connect to in-memory / local mongodb test instance
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/inkwell_test';
    try {
      await mongoose.connect(mongoUri);
    } catch {
      // ignore if already connected
    }
    pipelineService = new PipelineService();
    (pipelineService as any).geminiClient = new GeminiClient([]);
    projectsService = new ProjectsService();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});

    const user = await User.create({ email: 'test@example.com', name: 'Test User' });
    userId = user._id.toString();

    const proj = await projectsService.createProject(
      userId,
      'The Wind in the Willows',
      'The Mole had been working very hard all the morning, spring-cleaning his little home...'
    );
    projectId = proj._id.toString();
  });

  it('should enforce step ordering (reject running Step 2 before Step 1 is done)', async () => {
    await expect(pipelineService.runStep(userId, projectId, 2)).rejects.toThrow(
      'Step 2 cannot run before Step 1 is completed'
    );
  });

  it('should execute Step 1 successfully and update project state', async () => {
    const updated = await pipelineService.runStep(userId, projectId, 1, {
      userStyle: 'Pastel Storybook',
    });

    expect(updated.outputs.style?.styleName).toBe('Pastel Storybook');
    const step1State = updated.stepStates.find(s => s.stepNumber === 1);
    expect(step1State?.status).toBe('done');
  });

  it('should enforce max 2 adult characters cap server-side in Step 2', async () => {
    await pipelineService.runStep(userId, projectId, 1);
    const updated = await pipelineService.runStep(userId, projectId, 2);

    expect(updated.outputs.characters).toBeDefined();
    expect(updated.outputs.characters!.length).toBeLessThanOrEqual(2);
  });

  it('should recover stuck step when user triggers recoverStuckStep on an un-locked running step', async () => {
    await pipelineService.runStep(userId, projectId, 1);
    
    // Simulate a stuck step (status running but lock expired/missing)
    await Project.updateOne(
      { _id: projectId, 'stepStates.stepNumber': 2 },
      { $set: { 'stepStates.$.status': 'running' } }
    );

    const recovered = await pipelineService.recoverStuckStep(userId, projectId, 2);
    const step2State = recovered.stepStates.find(s => s.stepNumber === 2);
    expect(step2State?.status).toBe('failed');
    expect(step2State?.error).toContain('Reset by user');
  });
});
