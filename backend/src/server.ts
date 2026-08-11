import { app } from './app';
import { env } from './shared/config/env';
import { connectMongo } from './shared/db/mongo';
import { connectRedis } from './shared/db/redis';
import { ensureStorageDir } from './shared/storage/file.storage';
import { logger } from './shared/logger/logger';
import { startCleanupCron } from './shared/jobs/cleanup.job';
import { startPipelineWorker } from './shared/queue/pipeline.queue';

async function bootstrap() {
  await ensureStorageDir();
  await connectMongo();
  await connectRedis();

  startCleanupCron();
  startPipelineWorker();

  app.listen(env.PORT, () => {
    logger.info(`Book Illustration Studio Backend listening on http://localhost:${env.PORT}`);
    logger.info(`BullMQ Visual Dashboard available at http://localhost:${env.PORT}/admin/queues`);
    logger.info(`Prometheus Metrics available at http://localhost:${env.PORT}/metrics`);
  });
}

bootstrap().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
