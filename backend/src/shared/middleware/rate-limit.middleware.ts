import rateLimit from 'express-rate-limit';

// Global rate limiter for all incoming HTTP requests
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Strict rate limiter for Authentication requests
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 session attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

// Strict rate limiter for Gemini Pipeline step triggers
export const pipelineRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 step executions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Pipeline step rate limit exceeded. Max 5 executions per minute.',
  },
});
