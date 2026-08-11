import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env';
import { logger } from '../logger/logger';

export async function runStorageCleanup(): Promise<void> {
  logger.info('=== [CRON] Starting storage cleanup job ===');
  try {
    const storagePath = path.resolve(env.STORAGE_DIR);
    const projects = await fs.readdir(storagePath).catch(() => []);

    const now = Date.now();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    for (const projDir of projects) {
      const projPath = path.join(storagePath, projDir);
      const stat = await fs.stat(projPath).catch(() => null);

      if (stat && stat.isDirectory()) {
        const files = await fs.readdir(projPath).catch(() => []);
        for (const file of files) {
          const filePath = path.join(projPath, file);
          const fileStat = await fs.stat(filePath).catch(() => null);
          if (fileStat && now - fileStat.mtimeMs > maxAgeMs) {
            await fs.unlink(filePath).catch(err => logger.warn(`Cleanup failed for ${filePath}: ${err}`));
            logger.info(`[CRON] Cleaned up old file: ${filePath}`);
          }
        }
      }
    }
  } catch (err) {
    logger.error('[CRON] Storage cleanup failed:', err);
  } finally {
    logger.info('=== [CRON] Storage cleanup completed ===');
  }
}

export function startCleanupCron(): void {
  // Run every day at 02:00 AM
  cron.schedule('0 2 * * *', () => {
    runStorageCleanup();
  });
  logger.info('[CRON] Scheduled daily storage cleanup at 02:00 AM');
}
