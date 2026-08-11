import Redis from 'ioredis';
import { env } from '../config/env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  }
  return redisClient;
}

export async function connectRedis(): Promise<Redis> {
  const client = getRedisClient();
  if (client.status === 'ready' || client.status === 'connecting') return client;
  try {
    await client.connect();
  } catch (err) {
    console.warn('Redis connection failed, continuing with degraded in-memory locks fallback if needed:', err);
  }
  return client;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
