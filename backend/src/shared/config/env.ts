import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config(); // fallback to process.env

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().default('mongodb://localhost:27017/inkwell'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('development-jwt-secret-key-12345'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEYS: z.string().optional().default(''),
  STORAGE_DIR: z.string().default('./uploads'),
  LOCK_TTL_SECONDS: z.coerce.number().default(60),
  MAX_CHARACTERS: z.coerce.number().default(2),
  MAX_CHAPTERS: z.coerce.number().default(1),
});

const parsedEnv = envSchema.parse(process.env);

if (process.env.NODE_ENV === 'test' && (!process.env.MONGO_URI || parsedEnv.MONGO_URI.endsWith('/inkwell'))) {
  parsedEnv.MONGO_URI = 'mongodb://localhost:27017/inkwell_test';
}

export const getGeminiApiKeys = (): string[] => {
  const keysSet = new Set<string>();

  if (parsedEnv.GEMINI_API_KEYS) {
    parsedEnv.GEMINI_API_KEYS.split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .forEach((k) => keysSet.add(k));
  }

  if (parsedEnv.GEMINI_API_KEY && parsedEnv.GEMINI_API_KEY.trim()) {
    parsedEnv.GEMINI_API_KEY.split(',')
      .map((k) => k.trim())
      .filter((k) => k.length > 0)
      .forEach((k) => keysSet.add(k));
  }

  // Also check individual environment variables GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key && key.trim()) {
      keysSet.add(key.trim());
    }
  }

  return Array.from(keysSet);
};

export const env = parsedEnv;
