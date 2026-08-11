import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import projectsRoutes from './modules/projects/projects.routes';
import pipelineRoutes from './modules/pipeline/pipeline.routes';
import mediaRoutes from './modules/media/media.routes';
import { errorHandler } from './shared/middleware/error.middleware';
import { globalRateLimiter } from './shared/middleware/rate-limit.middleware';

export const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

// Global Rate Limiter to prevent API abuse
app.use(globalRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/projects', pipelineRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Central error handler
app.use(errorHandler);
