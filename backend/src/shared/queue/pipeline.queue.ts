import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../logger/logger';
import { PipelineService } from '../../modules/pipeline/pipeline.service';

const redisUrl = new URL(env.REDIS_URL);
export const redisOptions = {
  host: redisUrl.hostname || 'localhost',
  port: parseInt(redisUrl.port || '6379', 10),
  password: redisUrl.password || undefined,
};

export interface PipelineJobData {
  userId: string;
  projectId: string;
  stepNumber: number;
  userStyle?: string;
}

export const pipelineQueue = new Queue<PipelineJobData>('pipeline-steps', {
  connection: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

let pipelineWorker: Worker<PipelineJobData> | null = null;

export function startPipelineWorker(): Worker<PipelineJobData> {
  if (pipelineWorker) return pipelineWorker;

  const pipelineService = new PipelineService();

  pipelineWorker = new Worker<PipelineJobData>(
    'pipeline-steps',
    async (job: Job<PipelineJobData>) => {
      const { userId, projectId, stepNumber, userStyle } = job.data;
      logger.info(`[BullMQ Worker] Processing Job ${job.id} - Step ${stepNumber} for Project ${projectId}`);

      await job.updateProgress(10);

      // Execute actual Gemini pipeline step logic
      const result = await pipelineService.executeStepDirect(userId, projectId, stepNumber, { userStyle });

      await job.updateProgress(100);
      logger.info(`[BullMQ Worker] Job ${job.id} completed successfully for Step ${stepNumber}`);
      return result;
    },
    {
      connection: redisOptions,
      concurrency: 2,
    }
  );

  pipelineWorker.on('failed', (job, err) => {
    logger.error(`[BullMQ Worker] Job ${job?.id} failed: ${err.message}`);
  });

  logger.info('[BullMQ Worker] Initialized and listening for pipeline jobs');
  return pipelineWorker;
}
