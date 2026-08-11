import { getRedisClient } from '../db/redis';
import { env } from '../config/env';

const inMemoryLocks = new Map<string, number>();

export async function acquireStepLock(projectId: string, stepNumber: number): Promise<boolean> {
  const lockKey = `lock:project:${projectId}:step:${stepNumber}`;
  const ttl = env.LOCK_TTL_SECONDS;

  try {
    const redis = getRedisClient();
    const result = await redis.set(lockKey, 'locked', 'EX', ttl, 'NX');
    if (result === 'OK') return true;
    return false;
  } catch (err) {
    // Fallback to in-memory lock if Redis is unavailable
    const now = Date.now();
    const existingExpiry = inMemoryLocks.get(lockKey);
    if (existingExpiry && existingExpiry > now) {
      return false;
    }
    inMemoryLocks.set(lockKey, now + ttl * 1000);
    return true;
  }
}

export async function releaseStepLock(projectId: string, stepNumber: number): Promise<void> {
  const lockKey = `lock:project:${projectId}:step:${stepNumber}`;
  try {
    const redis = getRedisClient();
    await redis.del(lockKey);
  } catch {
    inMemoryLocks.delete(lockKey);
  }
}

export async function isStepLocked(projectId: string, stepNumber: number): Promise<boolean> {
  const lockKey = `lock:project:${projectId}:step:${stepNumber}`;
  try {
    const redis = getRedisClient();
    const exists = await redis.exists(lockKey);
    return exists === 1;
  } catch {
    const now = Date.now();
    const existingExpiry = inMemoryLocks.get(lockKey);
    return Boolean(existingExpiry && existingExpiry > now);
  }
}
