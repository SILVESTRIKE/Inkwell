# Testing Strategy & Automated Test Suite Report

This document outlines the testing strategy, test coverage, and automated test execution output for the Inkwell repository.

---

## Strategy

### Backend
- **Domain Errors & Custom Classes**: Unit test custom error serialization (`CustomError`, `BadRequestError`, `NotFoundError`, `ConflictError`).
- **Concurrency Locks**: Unit test Redis `SET NX` locks (`acquireStepLock`, `releaseStepLock`, `isStepLocked`, TTL expiration, and fallback memory locks).
- **Media Utilities**: Unit test media URL transformation (`transformMediaURLs`), path prefix unwrapping, and token authentication formatting.
- **Auth Service**: Unit test session creation, user find-or-create logic, and JWT signing.
- **Pipeline Service**: Unit test step ordering prerequisites, max character/chapter cap enforcement, step state transitions (`pending | running | done | failed`), stuck-step recovery staleness checks, and direct background execution.

### Frontend
- **Stepper Component**: Unit test component state rendering for `done`, `running`, `failed`, and `pending` steps.
- **Header Component**: Unit test user identity display, theme toggle, and logout actions.

---

## Test Report

```
=== Running Backend Tests ===

 ✓ src/shared/utils/media.util.test.ts (3 tests) 7ms
 ✓ src/shared/errors/custom.error.test.ts (6 tests) 9ms
 ✓ src/shared/locks/step.lock.test.ts (3 tests) 54ms
 ✓ src/modules/auth/auth.service.test.ts (5 tests) 183ms
 ✓ src/modules/pipeline/pipeline.service.test.ts (4 tests) 1888ms

 Test Files  5 passed (5)
      Tests  21 passed (21)
   Start at  20:37:21
   Duration  3.06s (transform 437ms, setup 0ms, import 2.01s, tests 2.14s, environment 1ms)

=== Running Frontend Tests ===

 ✓ src/components/stepper/Stepper.test.tsx (1 test) 84ms
 ✓ src/components/layout/Header.test.tsx (2 tests) 84ms

 Test Files  2 passed (2)
      Tests  3 passed (3)
   Start at  20:37:37
   Duration  2.69s (transform 361ms, setup 800ms, import 1.08s, tests 168ms, environment 2.63s)

=== All Tests Completed Successfully ===
```

---

## Manual Verification Checklist

- [x] **Refreshed mid-step**: UI displayed in-progress state banner and resumed polling without duplicate API invocation.
- [x] **Second Tab Concurrency**: Opening a second tab while step 3 was running rendered the active step banner and prevented duplicate triggers (`409 Conflict`).
- [x] **Stuck-step Recovery**: Simulated server interruption during step execution. Triggering "Reset Stuck State" successfully verified step lock status, reset step status to failed, and allowed clean retry.
- [x] **Error Retry**: Simulated Gemini API error, clicked retry button, and successfully re-ran step 2 without touching step 1 data.
- [x] **Synchronous Step Execution**: Triggered step 1 — API held the request open, executed `runStep` synchronously, and returned `200 OK` with the completed project state. No queue, no `202 Accepted`, no background dispatch.
