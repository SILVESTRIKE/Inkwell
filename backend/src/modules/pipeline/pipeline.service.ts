import { IProject } from '../projects/project.model';
import { Project } from '../projects/project.model';
import { GeminiClient } from '../../shared/gemini/gemini.client';
import { acquireStepLock, releaseStepLock, isStepLocked } from '../../shared/locks/step.lock';
import { NotFoundError, BadRequestError, ConflictError } from '../../shared/errors';
import { runStyleStep } from './steps/style.step';
import { runCharactersStep } from './steps/characters.step';
import { runPortraitsStep } from './steps/portraits.step';
import { runChaptersStep } from './steps/chapters.step';
import { runIllustrationsStep } from './steps/illustrations.step';
import { Media } from '../media/media.model';
import { PipelineLog } from './pipeline-log.model';

export class PipelineService {
  private geminiClient: GeminiClient;

  constructor(geminiClient?: GeminiClient) {
    this.geminiClient = geminiClient || new GeminiClient();
  }

  async runStep(
    userId: string,
    projectId: string,
    stepNumber: number,
    options: { userStyle?: string } = {}
  ): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, userId, isDeleted: false });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Step ordering verification
    if (stepNumber === 2) {
      const step1 = project.stepStates.find(s => s.stepNumber === 1);
      if (!step1 || step1.status !== 'done') {
        throw new BadRequestError('Step 2 (Characters) requires Step 1 (Style) to be completed');
      }
    } else if (stepNumber === 3) {
      const step2 = project.stepStates.find(s => s.stepNumber === 2);
      if (!step2 || step2.status !== 'done') {
        throw new BadRequestError('Step 3 (Portraits) requires Step 2 (Characters) to be completed');
      }
    } else if (stepNumber === 4) {
      const step1 = project.stepStates.find(s => s.stepNumber === 1);
      const step2 = project.stepStates.find(s => s.stepNumber === 2);
      if (!step1 || step1.status !== 'done' || !step2 || step2.status !== 'done') {
        throw new BadRequestError('Step 4 (Chapters) requires Step 1 (Style) and Step 2 (Characters) to be completed');
      }
    } else if (stepNumber === 5) {
      const step3 = project.stepStates.find(s => s.stepNumber === 3);
      const step4 = project.stepStates.find(s => s.stepNumber === 4);
      if (!step3 || step3.status !== 'done' || !step4 || step4.status !== 'done') {
        throw new BadRequestError('Step 5 (Illustrations) requires both Step 3 (Portraits) and Step 4 (Chapters) to be completed');
      }
    }

    const lockAcquired = await acquireStepLock(projectId, stepNumber);
    if (!lockAcquired) {
      throw new ConflictError(`Step ${stepNumber} is already currently running by another request`);
    }

    const currentStepState = project.stepStates.find(s => s.stepNumber === stepNumber);
    if (!currentStepState) {
      throw new BadRequestError(`Invalid step number ${stepNumber}`);
    }

    currentStepState.status = 'running';
    currentStepState.startedAt = new Date();
    currentStepState.error = undefined;
    project.overallStatus = 'in_progress';
    await project.save();

    const stepNames = ['style', 'characters', 'portraits', 'chapters', 'illustrations'];
    const stepName = stepNames[stepNumber - 1] || `step-${stepNumber}`;
    const startTime = Date.now();

    try {
      let stepResult: any = null;
      switch (stepNumber) {
        case 1: {
          const styleOutput = await runStyleStep(project, this.geminiClient, options);
          project.outputs.style = styleOutput;
          project.markModified('outputs.style');
          stepResult = styleOutput;
          break;
        }
        case 2: {
          const charsOutput = await runCharactersStep(project, this.geminiClient);
          project.outputs.characters = charsOutput;
          project.markModified('outputs.characters');
          stepResult = charsOutput;
          break;
        }
        case 3: {
          const portraitsOutput = await runPortraitsStep(project, this.geminiClient);
          project.outputs.characters = portraitsOutput;
          project.markModified('outputs.characters');
          stepResult = portraitsOutput;

          // Record generated character portraits into Media collection
          for (const char of portraitsOutput) {
            if (char.portraitFilename) {
              await Media.create({
                name: `${char.name} Portrait`,
                mediaPath: `/api/media/files/${projectId}/${char.portraitFilename}`,
                type: 'image/png',
                creatorId: userId,
                projectId,
                description: char.imagePrompt,
              });
            }
          }
          break;
        }
        case 4: {
          const chaptersOutput = await runChaptersStep(project, this.geminiClient);
          project.outputs.chapters = chaptersOutput;
          project.markModified('outputs.chapters');
          stepResult = chaptersOutput;
          break;
        }
        case 5: {
          const illustrationsOutput = await runIllustrationsStep(project, this.geminiClient);
          project.outputs.chapters = illustrationsOutput;
          project.markModified('outputs.chapters');
          stepResult = illustrationsOutput;

          // Record generated chapter illustrations into Media collection
          for (const chap of illustrationsOutput) {
            if (chap.illustrationFilename) {
              await Media.create({
                name: `${chap.chapterTitle} Illustration`,
                mediaPath: `/api/media/files/${projectId}/${chap.illustrationFilename}`,
                type: 'image/png',
                creatorId: userId,
                projectId,
                description: chap.illustrationPrompt,
              });
            }
          }
          break;
        }
      }

      currentStepState.status = 'done';
      currentStepState.completedAt = new Date();
      
      if (this.geminiClient.lastQuotaNotice) {
        currentStepState.error = this.geminiClient.lastQuotaNotice;
      } else {
        currentStepState.error = undefined;
      }

      if (stepNumber === 5) {
        project.overallStatus = 'done';
      }

      await project.save();

      // Log execution audit trace to PipelineLog collection
      await PipelineLog.create({
        projectId,
        userId,
        stepNumber,
        stepName,
        status: 'done',
        rawOutput: stepResult,
        durationMs: Date.now() - startTime,
      });

      return project;
    } catch (err: any) {
      currentStepState.status = 'failed';
      currentStepState.error = err.message || 'Step execution failed';
      await project.save();

      await PipelineLog.create({
        projectId,
        userId,
        stepNumber,
        stepName,
        status: 'failed',
        error: err.message,
        durationMs: Date.now() - startTime,
      });

      throw err;
    } finally {
      await releaseStepLock(projectId, stepNumber);
    }
  }

  async recoverStuckStep(userId: string, projectId: string, stepNumber: number): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, userId, isDeleted: false });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const currentStepState = project.stepStates.find(s => s.stepNumber === stepNumber);
    if (!currentStepState) {
      throw new BadRequestError(`Invalid step number ${stepNumber}`);
    }

    const activeLock = await isStepLocked(projectId, stepNumber);
    if (activeLock) {
      throw new ConflictError(`Step ${stepNumber} is actively running with an active Redis lock. Reset aborted.`);
    }

    currentStepState.status = 'failed';
    currentStepState.error = 'Reset by user (stuck step recovery)';
    await project.save();

    await releaseStepLock(projectId, stepNumber);
    return project;
  }
}
