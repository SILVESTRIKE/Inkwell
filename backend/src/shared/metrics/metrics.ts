import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Collect default Node.js runtime metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({ prefix: 'book_studio_' });

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'book_studio_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestDurationMicroseconds.observe(
      { method: req.method, route, code: res.statusCode },
      duration
    );
  });
  next();
}

export async function metricsHandler(req: Request, res: Response): Promise<void> {
  res.setHeader('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
}
