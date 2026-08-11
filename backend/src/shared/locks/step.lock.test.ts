import { describe, it, expect, beforeEach } from 'vitest';
import { acquireStepLock, releaseStepLock, isStepLocked } from './step.lock';

describe('StepLock (Redis / In-memory fallback)', () => {
  const testProjectId = 'test-proj-123';

  beforeEach(async () => {
    await releaseStepLock(testProjectId, 1);
    await releaseStepLock(testProjectId, 2);
  });

  it('should acquire lock for step and prevent duplicate acquisition', async () => {
    const acquired = await acquireStepLock(testProjectId, 1);
    expect(acquired).toBe(true);

    const secondAcquire = await acquireStepLock(testProjectId, 1);
    expect(secondAcquire).toBe(false);
  });

  it('should check if step is locked correctly', async () => {
    await acquireStepLock(testProjectId, 2);
    const locked = await isStepLocked(testProjectId, 2);
    expect(locked).toBe(true);
  });

  it('should release lock allowing re-acquisition', async () => {
    await acquireStepLock(testProjectId, 1);
    await releaseStepLock(testProjectId, 1);
    const reAcquired = await acquireStepLock(testProjectId, 1);
    expect(reAcquired).toBe(true);
  });
});
