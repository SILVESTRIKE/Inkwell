import { Project, IProject } from '../projects/project.model';
import { BadRequestError, NotFoundError, ConflictError } from '../../shared/errors';
import { acquireStepLock, releaseStepLock, isStepLocked } from '../../shared/locks/step.lock';
import { GeminiClient } from '../../shared/gemini/gemini.client';
import { logger } from '../../shared/logger/logger';
import { runStyleStep } from './steps/style.step';
import { runCharactersStep } from './steps/characters.step';
import { runPortraitsStep } from './steps/portraits.step';
import { runChaptersStep } from './steps/chapters.step';
import { runIllustrationsStep } from './steps/illustrations.step';
import { Media } from '../media/media.model';
import { PipelineLog } from './pipeline-log.model';

export class PipelineService {
  private geminiClient = new GeminiClient();

  // Execute step synchronously with Redis SET NX lock protection
  async runStep(
    userId: string,
    projectId: string,
    stepNumber: number,
    options?: { userStyle?: string }
  ): Promise<IProject> {
    const project = await this.validateStepPrerequisites(userId, projectId, stepNumber);

    // Acquire lock to guarantee no duplicate execution across tabs or concurrent requests
    const lockAcquired = await acquireStepLock(projectId, stepNumber);
    if (!lockAcquired) {
      throw new ConflictError(`Step ${stepNumber} is currently running in another request.`);
    }

    const currentStepState = project.stepStates.find(s => s.stepNumber === stepNumber)!;
    currentStepState.status = 'running';
    currentStepState.error = undefined;
    currentStepState.startedAt = new Date();
    project.overallStatus = 'in_progress';
    project.currentStepNumber = stepNumber;
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
        error: err.message || 'Step execution failed',
        durationMs: Date.now() - startTime,
      });

      throw err;
    } finally {
      await releaseStepLock(projectId, stepNumber);
    }
  }

  private async validateStepPrerequisites(
    userId: string,
    projectId: string,
    stepNumber: number
  ): Promise<IProject> {
    if (stepNumber < 1 || stepNumber > 5) {
      throw new BadRequestError('Invalid step number. Must be between 1 and 5.', 'stepNumber');
    }

    const project = await Project.findOne({ _id: projectId, userId, isDeleted: { $ne: true } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    if (stepNumber > 1) {
      const prevStep = project.stepStates.find(s => s.stepNumber === stepNumber - 1);
      if (!prevStep || prevStep.status !== 'done') {
        throw new BadRequestError(`Step ${stepNumber} cannot run before Step ${stepNumber - 1} is completed.`);
      }
    }

    const currentStepState = project.stepStates.find(s => s.stepNumber === stepNumber);
    if (!currentStepState) {
      throw new BadRequestError(`Step state for step ${stepNumber} not found.`);
    }

    if (currentStepState.status === 'running') {
      throw new ConflictError(`Step ${stepNumber} is already in progress.`);
    }

    return project;
  }

  async recoverStuckStep(userId: string, projectId: string, stepNumber: number): Promise<IProject> {
    const project = await Project.findOne({ _id: projectId, userId, isDeleted: { $ne: true } });
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    const stepState = project.stepStates.find(s => s.stepNumber === stepNumber);
    if (!stepState) {
      throw new BadRequestError('Invalid step number', 'stepNumber');
    }

    const isLocked = await isStepLocked(projectId, stepNumber);

    // Staleness Guard: Refuse to recover if step is actively running AND currently locked
    if (stepState.status === 'running' && isLocked) {
      throw new ConflictError(`Step ${stepNumber} is currently running and locked by an active process. Cannot recover an in-flight step.`);
    }

    // Only allow recovery if status is failed, or running with an expired/missing lock
    if (stepState.status !== 'running' && stepState.status !== 'failed') {
      throw new BadRequestError(`Step ${stepNumber} is currently '${stepState.status}' and does not require stuck-state recovery.`);
    }

    await releaseStepLock(projectId, stepNumber);
    stepState.status = 'failed';
    stepState.error = 'Reset by user from stranded/stuck in-progress state';
    await project.save();

    return project;
  }
}
