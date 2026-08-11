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
  STORAGE_DIR: z.string().default('./storage'),
  LOCK_TTL_SECONDS: z.coerce.number().default(60),
});

export const env = envSchema.parse(process.env);
