import { app } from './app';
import { env } from './shared/config/env';
import { connectMongo } from './shared/db/mongo';
import { connectRedis } from './shared/db/redis';
import { ensureStorageDir } from './shared/storage/file.storage';
import { logger } from './shared/logger/logger';

async function bootstrap() {
  await ensureStorageDir();
  await connectMongo();
  await connectRedis();

  app.listen(env.PORT, () => {
    logger.info(`Book Illustration Studio Backend listening on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
