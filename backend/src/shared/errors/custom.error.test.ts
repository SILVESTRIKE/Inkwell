import { describe, it, expect } from 'vitest';
import {
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
} from './index';

describe('CustomError Classes', () => {
  it('should format NotFoundError correctly', () => {
    const err = new NotFoundError('Project not found', 'projectId');
    expect(err.statusCode).toBe(404);
    expect(err.serializeErrors()).toEqual([{ message: 'Project not found', field: 'projectId' }]);
  });

  it('should format BadRequestError correctly', () => {
    const err = new BadRequestError('Invalid input', 'email');
    expect(err.statusCode).toBe(400);
    expect(err.serializeErrors()).toEqual([{ message: 'Invalid input', field: 'email' }]);
  });

  it('should format UnauthorizedError correctly', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.serializeErrors()).toEqual([{ message: 'Not authorized' }]);
  });

  it('should format ForbiddenError correctly', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.serializeErrors()).toEqual([{ message: 'Access forbidden' }]);
  });

  it('should format ConflictError correctly', () => {
    const err = new ConflictError('Step already running');
    expect(err.statusCode).toBe(409);
    expect(err.serializeErrors()).toEqual([{ message: 'Step already running' }]);
  });

  it('should format TooManyRequestsError correctly', () => {
    const err = new TooManyRequestsError();
    expect(err.statusCode).toBe(429);
    expect(err.serializeErrors()).toEqual([{ message: 'Too many requests, please try again later' }]);
  });
});
