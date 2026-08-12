import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // fallback to current working directory .env

// Enforce that ALL environment variables MUST be provided via .env (no hardcoded default fallbacks in code)
const envSchema = z.object({
  PORT: z.string().min(1, 'PORT must be provided in .env'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  MONGO_URI: z.string().min(1, 'MONGO_URI must be provided in .env'),
  MONGO_URI_TEST: z.string().min(1, 'MONGO_URI_TEST must be provided in .env'),
  REDIS_URL: z.string().min(1, 'REDIS_URL must be provided in .env'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET must be provided in .env'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET must be provided in .env'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_API_KEYS: z.string().optional(),
  STORAGE_DIR: z.string().min(1, 'STORAGE_DIR must be provided in .env'),
  LOCK_TTL_SECONDS: z.coerce.number(),
  MAX_CHARACTERS: z.coerce.number(),
  MAX_CHAPTERS: z.coerce.number(),
});

const parsedEnv = envSchema.parse(process.env);

if (process.env.NODE_ENV === 'test' && (!process.env.MONGO_URI || parsedEnv.MONGO_URI.endsWith('/inkwell'))) {
  parsedEnv.MONGO_URI = parsedEnv.MONGO_URI_TEST;
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
