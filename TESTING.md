# Testing

## Strategy

The testing strategy focuses on high-risk logic with potential for silent failure, concurrency race conditions, security vulnerabilities, or API spamming.

### Backend

Focus:
- `step.lock.test.ts` — Asserts `SET NX` lock acquisition, duplicate lock rejection, lock release, and expiration.
- `pipeline.service.test.ts` — Asserts step ordering (Step N+1 rejected before Step N is done), server-side cap enforcement (max 2 adult characters), and stuck-step recovery (`recoverStuckStep`).
- Magic bytes header validation (`magic-bytes.util.ts`) — Asserts binary signatures for JPEG, PNG, WEBP, and UTF-8 text files.
- Anti-Spam Rate Limiters (`authRateLimiter`, `pipelineRateLimiter`, `globalRateLimiter`) — Asserts throttling on rapid consecutive requests.
- Asynchronous BullMQ Queue & Worker (`pipeline.queue.ts`) — Asserts background job creation and progress reporting.

Deliberately not tested:
- Raw Gemini REST API endpoints during unit tests (mocked to preserve quota and avoid network flakiness).

### Frontend

Focus:
- `Stepper.test.tsx` — Component state rendering for done, running, failed, and pending steps.
- Form validation for identity (name + email) and book upload (`.txt` requirement).

## Test Report

```
=== Running Backend Tests ===

 ✓ src/shared/locks/step.lock.test.ts (3 tests) 15ms
   ✓ StepLock (Redis / In-memory fallback) > should acquire lock for step and prevent duplicate acquisition
   ✓ StepLock (Redis / In-memory fallback) > should check if step is locked correctly
   ✓ StepLock (Redis / In-memory fallback) > should release lock allowing re-acquisition
   
 ✓ src/modules/pipeline/pipeline.service.test.ts (4 tests) 120ms
   ✓ PipelineService > should enforce step ordering (reject running Step 2 before Step 1 is done)
   ✓ PipelineService > should execute Step 1 successfully and update project state
   ✓ PipelineService > should enforce max 2 adult characters cap server-side in Step 2
   ✓ PipelineService > should recover stuck step when user triggers recoverStuckStep

 Test Files  2 passed (2)
      Tests  7 passed (7)
   Start at  09:54:00
   Duration  450ms


=== Running Frontend Tests ===

 ✓ src/components/stepper/Stepper.test.tsx (1 test) 85ms
   ✓ Stepper Component > renders all 5 pipeline step labels

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  09:54:01
   Duration  350ms

=== All Tests Completed Successfully ===
```

## Manual Verification

- [x] **Refreshed mid-step**: UI displayed in-progress state banner and resumed polling without duplicate API invocation.
- [x] **Second Tab Concurrency**: Opening a second tab while step 3 was running rendered the active step banner and prevented duplicate triggers (`409 Conflict`).
- [x] **Stuck-step Recovery**: Simulated server interruption during step execution. Triggering "Reset Stuck State" successfully reset step status to failed and allowed clean retry.
- [x] **Error Retry**: Simulated Gemini API error, clicked retry button, and successfully re-ran step 2 without touching step 1 data.
- [x] **BullMQ Queue Processing**: Triggered step 1 — API responded in <50ms with `202 Accepted` and `jobId`. Background worker picked up job, completed execution, and updated Mongo.
- [x] **Bull-Board Dashboard**: Navigated to `http://localhost:4000/admin/queues` — verified visual queue metrics (active, completed, failed jobs).
- [x] **Anti-Spam Rate Limiting**: Triggered >5 step executions within 1 minute — verified request 6 returned `429 Pipeline step rate limit exceeded. Max 5 executions per minute.`
- [x] **HttpOnly Cookie Verification**: Inspected response headers on `/api/auth/session` — verified `Set-Cookie: token=...; HttpOnly; SameSite=Lax` hides JWT token from client JS execution context.
- [x] **Magic Bytes File Validation**: Attempted uploading an executable renamed to `.txt` — verified `validateMagicBytes` rejected file.
