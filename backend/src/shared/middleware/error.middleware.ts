import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError';
import { logger } from '../logger/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof CustomError) {
    logger.warn(`[CustomError ${err.statusCode}] ${err.message}`);
    res.status(err.statusCode).json({
      errors: err.serializeErrors(),
      error: err.message,
    });
    return;
  }

  logger.error('[Unhandled Error]', err);
  res.status(500).json({
    errors: [{ message: err.message || 'Internal Server Error' }],
    error: err.message || 'Internal Server Error',
  });
}
