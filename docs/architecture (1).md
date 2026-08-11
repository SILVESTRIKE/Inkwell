# Architecture — Inkwell

Companion to `CLAUDE.md`. This version reflects the **actual implementation** (reviewed via
repomix export) plus the fixes agreed and in progress per the task list in `docs/plan.md` —
not the pre-code draft this file started as. Treat this as the current source of truth;
correct it again if implementation drifts further, and note any real divergence in
`DECISIONS.md` rather than editing this file silently.

## 1. System overview (target state, post-cleanup)

```
┌─────────────┐        HTTP/JSON (JWT cookie)     ┌──────────────────┐
│  Next.js FE  │ ───────────────────────────────▶ │   Express API    │
│ (App Router) │ ◀─────────────────────────────── │  (feature modules)│
└─────────────┘         polling (3s)               └──────────────────┘
                                                        │        │      │
                                              ┌─────────┘        │      └────────┐
                                              ▼                  ▼               ▼
                                        ┌──────────┐      ┌──────────┐   ┌─────────────┐
                                        │ MongoDB   │      │  Redis    │   │ Local disk   │
                                        │ (source   │      │ (step     │   │ (book text,  │
                                        │  of truth)│      │  locks)   │   │  images)     │
                                        └──────────┘      └──────────┘   └─────────────┘
                                                                                ▲
                                                                                │
                                                                        ┌───────┴───────┐
                                                                        │  Gemini API    │
                                                                        │ text + Nano    │
                                                                        │ Banana image   │
                                                                        └────────────────┘
```

**BullMQ, Prometheus, Grafana, Loki, and the node-cron cleanup job are cut** (task list #6-8) —
a single Express process handles a step run synchronously, protected by a Redis lock. No
queue, no worker process, no observability stack. This is the "boring, right-sized" choice the
brief asks for; if BullMQ is kept instead, that call and its cost belongs in `DECISIONS.md`
before submission, not here.

## 2. Data model (MongoDB, as implemented)

### `users` (`user.model.ts`)
Email + name identity, no password field, per spec §4.1.

### `projects` (`project.model.ts`)
```
{
  _id, userId (ref User), title, bookText,          // full text stored in Mongo directly
  cachedContentName,                                  // Gemini cachedContents handle, set once
  isDeleted, createdAt, updatedAt,
  overallStatus: 'draft' | 'in_progress' | 'done',    // derived summary pill
  currentStepNumber,
  stepStates: [                                       // five independent per-step statuses —
    { stepNumber, stepName, status: 'pending'|'running'|'done'|'failed', error, startedAt, completedAt }
  ],
  outputs: {
    style: { styleName, description, userStyle },
    characters: [ { id, name, description, imagePrompt, portraitFilename } ],
    chapters:   [ { id, chapterTitle, description, illustrationPrompt, illustrationFilename } ],
  }
}
```

This is the same five-independent-statuses model from the original design and the one
`DECISIONS.md` already documents correctly (single enum can't express "step 3 done, step 4
running"). No change needed here — this part was built right.

**Known deviation from the original plan, not yet fixed:** `bookText` is stored in full inside
the Mongo document *and* written to disk (`saveProjectFile` in `projects.service.ts`). The
original architecture called for disk-only with just a path reference in Mongo. Low priority —
not on the task list — but worth a one-line note in `DECISIONS.md` if left as-is, since it's a
real (if minor) departure from documented intent.

### `pipeline-log` (`pipeline-log.model.ts`)
Append-only audit trail: one document per step execution attempt (`projectId`, `stepNumber`,
`stepName`, `status`, `rawOutput` or `error`, `durationMs`). Not in the original design — a
reasonable addition on top of it, since it gives you the raw Gemini output history for free
without polluting the `projects` document. Keep it.

### `media` (`media.model.ts`)
One document per generated image (`name`, `mediaPath`, `type`, `creatorId`, `projectId`,
`description`), created alongside the portrait/illustration write in `pipeline.service.ts`.
Also a reasonable addition beyond the original plan — gives a queryable media index without
having to walk the filesystem.

## 3. File storage layout (as implemented)

```
storage/                          (env: STORAGE_DIR)
  <projectId>/
    book.txt
    portrait_<characterId>.jpg
    illustration_<chapterId>.jpg
```

Served through `GET /api/media/files/*` (`media.controller.ts`), which resolves the path via
`getProjectFilePath` and streams the file. Auth on this route currently accepts a `?token=`
query param fallback alongside the cookie/bearer path, specifically so `<img src>` tags can load
authenticated images without extra client wiring — documented in `DECISIONS.md` and a reasonable
trade-off, kept as-is.

One thing to double check once the Gemini model fix (task #1) lands: `media.controller.ts`
currently sniffs the first 100 bytes of a file for `<svg` to decide whether to serve it as
`image/svg+xml` instead of the stored content-type. That sniffing exists specifically to render
the old mock-mode SVG placeholder cleanly — once the silent-fallback removal (task #3) means
mock images only ever appear in an explicit, visible mock mode, revisit whether this sniffing is
still needed or can be simplified.

## 4. Pipeline execution & concurrency (target state, post-cleanup)

```
POST /api/projects/:id/steps/:step/run
  1. validateStepPrerequisites — step is next-in-order, not already running/done.
  2. acquireStepLock(projectId, step) — Redis SET key NX EX <LOCK_TTL_SECONDS>.
     Falls back to an in-memory Map if Redis is unreachable (step.lock.ts) — a reasonable
     single-instance safety net, not a substitute for Redis in normal operation.
     - fails → 409 Conflict, current status returned. UI reads this as "already running."
     - succeeds → proceed.
  3. Mongo: stepStates[step].status = 'running', startedAt = now.
  4. executeStepDirect() runs synchronously in this same request:
     calls the relevant steps/*.step.ts, which calls GeminiClient, writes files to disk,
     creates Media docs for images, writes a PipelineLog entry.
  5. On success: status = 'done', completedAt = now, response returned.
  6. On real failure (Gemini throws, not silently swallowed — task #3): status = 'failed',
     error message stored, response returned as an error the frontend surfaces.
  7. finally: releaseStepLock — always runs, success or failure.
```

This collapses `enqueueStep` + `pipelineQueue.add()` + the separate worker back into a single
synchronous call to what's currently `executeStepDirect` — that function already contains all
the real logic; removing the queue is a matter of calling it directly from the controller
instead of routing through BullMQ, not a rewrite. See `docs/plan.md` task #6.

### Stuck-step recovery — the fix that's actually needed (task #4)

Current `recoverStuckStep` unconditionally releases the lock and marks the step `'failed'`,
with no check on whether the step is genuinely stranded (lock expired, Mongo still says
`'running'`) versus actually in flight right now. Target behavior:

```
POST /api/projects/:id/steps/:step/recover
  - Only proceed if: stepState.status === 'running' AND isStepLocked(...) === false
    (i.e. Mongo thinks it's running, but the lock is gone — the actual stranded signal)
    OR stepState.status === 'failed' (already safe to retry).
  - Otherwise: reject with 409 — the step is genuinely still in flight, don't touch it.
```

This is the one-sentence fix that makes the recovery flow match what `DECISIONS.md` already
claims it does.

## 5. Gemini integration (target state, post-fix)

### Model selection — corrected (task #1)
- **Text**: `gemini-3.6-flash` via `generateContent` — unchanged, this was already correct and
  current.
- **Image**: `gemini-3.1-flash-image` (Nano Banana 2) via `generateContent`, **not**
  `imagen-4.0-generate-001` via `:predict`. Imagen was retired June 24, 2026; every image call
  against it was failing and silently returning a placeholder. Nano Banana models carry real
  free-tier quota, unlike the discontinued Imagen line — this fix is very likely also the fix
  for the "zero quota" problem, not just a compliance fix.

### Context reuse — already correct, keep as-is
`uploadOrCacheBookText` creates a Gemini `cachedContents` entry once per project
(`projects.service.ts`, on creation), stored as `project.cachedContentName`, and every text
step (`style`, `characters`, `chapters`) passes it as `requestBody.cachedContent`. This is a
legitimate implementation of "send the book once" (spec constraint #5) — no change needed.

### Character consistency — currently missing, needs building (task #2)
`illustrations.step.ts` builds a `charDescs` text array and passes it as
`characterDescriptions` into `generateImage`, but `GeminiClient.generateImage` never reads that
field — no portrait bytes are actually sent. Target: read the saved portrait file(s) for the
characters appearing in a chapter, and pass the image bytes into the Nano Banana call alongside
the illustration prompt, so the model is doing image-conditioned generation, not text-only
description. This is what actually satisfies "reusing the portraits so characters stay
consistent" (spec §03) — the model fix alone doesn't get you there.

### Error handling — currently broken, needs removing (task #3)
`generateText` and `generateImage` currently catch *any* non-2xx response or thrown error and
silently return a mock/placeholder result. Target: only mock when `apiKeys.length === 0`
(genuinely no key configured, an explicit and visible mode) — every other failure (429, 5xx,
malformed response) should throw, so `pipeline.service.ts`'s existing catch block can correctly
mark the step `failed` and the frontend's retry UI actually gets exercised. This is the single
highest-leverage fix on the list — it's also what makes the failure/retry testing in
`TESTING.md` meaningful instead of theoretical.

## 6. API surface (as implemented)

```
POST   /api/auth/session                    { email, name } -> { token, user } (+ httpOnly cookie)

GET    /api/projects
POST   /api/projects                         { title, bookText }
GET    /api/projects/:id

POST   /api/projects/:id/steps/:step/run     { userStyle? }   -> currently 202 via queue;
                                                                   target: synchronous 200/4xx
POST   /api/projects/:id/steps/:step/recover                  -> target: lock-staleness-checked

GET    /api/media/files/*                    -> streamed image/text, auth via cookie/bearer/query token
```

`:step` is `1..5` (`style | characters | portraits | chapters | illustrations`). Caps (2
characters, 1 chapter) are enforced server-side in `characters.step.ts`/`chapters.step.ts` via
`env.MAX_CHARACTERS`/`env.MAX_CHAPTERS` — already correct, this was built right the first time.

## 7. Frontend state & polling (as implemented)

`app/projects/[id]/page.tsx` polls `GET /api/projects/:id` every 3s while any step is
`'running'`, matching the original design. One thing worth simplifying during the frontend
refactor (`docs/plan.md` task #9): `currentStepNumber` is currently derived as
`runningStep || selectedStep || nextPendingStep` — three separately-tracked pieces of state with
unclear precedence. Worth collapsing to the minimum state actually needed (most likely: derive
"which step is active" purely from `project.stepStates` plus an optional user-selected
step-to-view, rather than three separate local state variables trying to agree with each other).

Per-item portrait/illustration progress (spec §4.4) isn't yet incremental — `portraits.step.ts`
generates all characters' portraits in a loop before returning. Improving this doesn't need a
queue: save the project to Mongo after each portrait completes (not just once at the end of the
loop), and the existing 3s poll will naturally surface "1 of 2 portraits done" without any new
infrastructure.

## 8. Auth (as implemented — correct, no changes needed)

JWT issued on `/api/auth/session`, set as an `httpOnly; sameSite=lax` cookie
(`auth.controller.ts`), verified by `auth.middleware.ts` on every module route. Matches the
original design and is a reasonable, low-cost choice for this scope.

## 9. What changed from the original draft of this document

| Original assumption | Reality | Resolution |
|---|---|---|
| Gemini Files API for book upload | `cachedContents` API instead | Equivalent "send once" intent — fine, no change needed |
| Book text on disk only, path in Mongo | Stored in both | Documented as a known minor deviation, not on the fix list |
| No queue, synchronous only | BullMQ was added | Being cut back to synchronous per task #6 |
| N/A | `PipelineLog`, `Media` collections added | Reasonable additions beyond the original plan, kept |
| N/A | Prometheus/Grafana/Loki/cron added | Being cut, not required by the brief |

## 10. Explicit non-goals (unchanged from original, per spec §03/§08)

- Veo animation, Lyria music, TTS narration, audiobook mixing.
- Any hosted/public deployment.
- Rate-limiting infrastructure beyond the 2/1 caps (the tiered rate limiters currently in
  `rate-limit.middleware.ts` go beyond what's required — not on the cut list, but worth noting
  in `DECISIONS.md` as a deliberate beyond-spec addition if kept).
- Multi-instance horizontal scaling.
