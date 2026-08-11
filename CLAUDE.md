# Inkwell — Project Context for AI Coding Tools

This file is the standing context for any AI coding assistant (Claude Code, Cursor, Copilot,
etc.) working in this repo. Read it before generating code. If something here conflicts with
a request in chat, this file wins unless the human explicitly overrides it — and that override
gets logged in `DECISIONS.md`.

## What we're building

**Inkwell** — a user pastes/uploads a book's text and runs a 5-step pipeline
(Style → Characters → Portraits → Chapters → Illustrations) against the Gemini API, one step
at a time, on their own trigger. Full spec: `docs/gradion-assessment-intern-software-engineer.md`.
Reference pipeline mechanics: Google's `Book_illustration.ipynb` notebook — the notebook is the
source of truth for *how* each Gemini call is shaped, not this file.

## Hard constraints (never relax these without a logged decision)

1. **Caps are enforced server-side.** Max 2 characters, max 1 chapter. Reject at the API layer,
   not just the UI. These bound API cost per submission.
2. **No duplicate Gemini calls.** A step that's already running must not be re-triggered by a
   refresh, a second tab, or a double-click. This is a concurrency problem, not a UI problem —
   solve it with a server-side lock (Redis), not `disabled` on a button.
3. **Resumable, always.** Refresh / logout / server restart mid-pipeline → reopening the project
   shows true state and continues. Never restart from scratch, never lose completed step output.
4. **Nothing stuck forever.** A step stranded "in progress" (server died mid-call) must be
   recoverable by the user — no manual DB edits. Use a TTL/heartbeat, not a hope.
5. **Send book text to Gemini once.** Use the Gemini Files API (or session/context chaining) to
   upload the book once and reference it across all 5 steps. Never re-send full text per step.
6. **No auto-retry loops.** Retries are user-triggered only.
7. **Never commit `GEMINI_API_KEY`** or any secret. `.env.example` only.
8. **Local filesystem only** for generated images and uploaded book text — no S3/blob/CDN, served
   through our own Express route.

## Tech stack

| Layer          | Choice                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Backend        | Node.js + Express, **feature-module** structure (not MVC-by-layer)     |
| Auth           | JWT (access token; email+name identity, no password/OAuth per spec)    |
| Frontend       | Next.js (App Router), TypeScript                                       |
| Primary DB     | MongoDB (users, projects, pipeline state)                              |
| Cache / locks  | Redis (step-run locks, dedup, ephemeral job/progress state, TTL cleanup)|
| File storage   | Local filesystem (`storage/`), served via an Express static/auth route |
| AI provider    | Gemini API — current text model + current image (Nano Banana) model    |
| Testing        | Backend: Vitest/Jest + Supertest. Frontend: Vitest/RTL                 |

Boring and familiar over novel — see spec §5.1. Don't introduce a message queue, a second
database, or a microservice split. This is a single Express app and a single Next.js app.

## Why Mongo *and* Redis (short version — full reasoning goes in DECISIONS.md)

- **Mongo** is the durable source of truth: users, projects, and the pipeline's persisted state
  (`step_state` per step: `pending | running | done | failed`, plus each step's output).
- **Redis** is *not* a second source of truth. It only holds things that are allowed to
  disappear: a short-lived lock key (`lock:project:<id>:step:<n>`) that says "a Gemini call for
  this step is in flight right now," with a TTL as the stuck-state safety net. If Redis is
  flushed, worst case we lose the "in-flight" signal, not any generated data.

## Feature-module backend structure

Organize by feature/domain, not by technical layer. Each module owns its routes, controller,
service, and Mongo model/schema. Shared stuff (auth middleware, Gemini client, file storage
helper, Redis client) lives in `src/shared/`.

```
backend/
  src/
    app.ts                  # Express app wiring, middleware, route mounting
    server.ts                # entrypoint
    shared/
      config/                # env parsing/validation
      db/                    # mongo connection, redis connection
      middleware/            # auth (JWT verify), error handler, request logging
      gemini/                # thin Gemini REST client (text + image), file upload helper
      storage/                # local filesystem read/write helpers, path safety
      locks/                  # redis-backed step lock helper
    modules/
      auth/
        auth.routes.ts        # POST /auth/session (email+name -> find-or-create + JWT)
        auth.controller.ts
        auth.service.ts
        user.model.ts
      projects/
        projects.routes.ts     # CRUD: list, create, get one
        projects.controller.ts
        projects.service.ts
        project.model.ts        # book text ref, title, createdAt, owner
      pipeline/
        pipeline.routes.ts       # POST /projects/:id/steps/:step/run, POST .../retry
        pipeline.controller.ts
        pipeline.service.ts       # step ordering, validation, lock acquire/release
        steps/
          style.step.ts
          characters.step.ts
          portraits.step.ts
          chapters.step.ts
          illustrations.step.ts
        pipeline.model.ts          # embedded in project or separate collection — decide + log it
      media/
        media.routes.ts             # GET /files/:projectId/:filename (auth-checked)
        media.controller.ts
  tests/
    modules/...                     # co-located or mirrored — pick one, be consistent
```

Rules for this structure:
- A module never reaches into another module's model directly — go through its service.
- Route files only wire HTTP → controller. Controllers only parse/validate input and shape
  responses. Services hold the actual logic (this is what gets unit-tested).
- Each pipeline step is its own small file implementing the same interface (input: project +
  prior step outputs; output: structured result + files written). This is what makes "adding a
  6th step" not require a rewrite (spec §07, right-sized solution).

## Frontend structure (Next.js)

```
frontend/
  app/
    (auth)/login/page.tsx
    projects/page.tsx              # list + empty state
    projects/new/page.tsx          # create: paste or upload .txt
    projects/[id]/page.tsx         # detail: stepper, book text, cards, action button
  components/
    stepper/
    character-card/
    chapter-card/
    ui/                            # buttons, inputs, status pills — small, no kitchen-sink lib
  lib/
    api-client.ts                  # typed fetch wrapper, attaches JWT
    polling.ts                     # step-status polling hook (see docs/architecture.md)
  tests/
```

- Server state (project data, step status) is fetched, not duplicated into global client state
  beyond what a polling hook needs.
- `app-demo.html` is the UX floor, not the ceiling (spec §4.4) — don't port its `localStorage`
  store, its fake timings, or its single-tab dedup guard. Real dedup is a server lock; the UI
  just reflects server state.

## Coding conventions

- TypeScript strict mode on both sides.
- No `any` without a comment explaining why.
- Validate all external input (Gemini responses included — they're structured JSON but still
  untrusted) with a schema library (zod or equivalent) at the boundary.
- Errors: services throw typed domain errors; a single Express error-handling middleware maps
  them to HTTP status + JSON shape. No `try/catch` swallowing.
- Don't add an ORM/abstraction layer beyond the Mongo driver or a thin schema layer (Mongoose is
  fine, don't add a repository-pattern layer on top of it for this scope).

## Testing expectations (see TESTING.md once written)

- Backend: unit-test `pipeline.service.ts` step-ordering/validation logic, and the Redis lock
  helper (acquire/release/TTL/expired-lock recovery) — this is the highest-risk logic in the app.
- Frontend: component tests for stepper states (pending/current/done), the running-step banner,
  and the error+retry state. Don't chase 100% coverage.
- A real test run output goes in `TESTING.md` — not an invented summary.

## What to push back on if the AI suggests it

- A message queue / job runner (Bull, BullMQ, etc.) for a single-worker, single-process app at
  this scope — a Redis lock + synchronous request is enough. Note the trade-off if you keep it.
- A repository/DAO abstraction layer over Mongoose — unnecessary indirection here.
- Re-sending full book text on every Gemini call — violates constraint #5 above.
- Client-side-only enforcement of the 2 character / 1 chapter caps — violates constraint #1.
- Storing the Gemini API key anywhere but `process.env`, or logging it.

## Environment variables (see `.env.example`)

```
PORT=
MONGO_URI=
REDIS_URL=
JWT_SECRET=
GEMINI_API_KEY=
STORAGE_DIR=            # local path for uploaded book text + generated images
NEXT_PUBLIC_API_URL=
```

## Standing instructions: keep the grading docs alive, not just the code

`README.md`, `DECISIONS.md`, and `TESTING.md` are graded deliverables (spec §06/§07), and they
score badly if they read as backfilled at the end. Treat updating them as part of finishing a
task, not a separate cleanup pass. Concretely:

### After any task that involved a real trade-off, contradicted a first suggestion, or got
### pushed back on (by either side) — propose a `DECISIONS.md` entry immediately

Do this **in the same turn**, right after the code lands — don't wait to be asked, and don't
wait until the end of the session to reconstruct it from memory. Draft it as: what was
proposed, who pushed back and on what basis, where it landed, what it cost. Then stop and ask
the human to confirm or correct it before treating it as final — these entries are supposed to
be the human's account in their own words, not an AI-generated summary of itself. If you (the
AI) produced a first draft that was wrong, unsafe, or overcomplicated and got overridden, say so
plainly in the draft — those are the highest-value entries in the whole file (spec §2.3) and
hiding them defeats the point.

Do **not** pad this file to hit "4-6 entries" — if a task was routine, it's not a decision.
Quality and specificity over count.

### After writing or changing a test — check `TESTING.md`

If a test file is new, or its intent changed, add or update the corresponding bullet under
Backend/Frontend in `TESTING.md` in the same turn. Do not write the "Strategy" prose paragraph
until most of the test suite is stable — that section describes what testing *ended up*
covering and why, and is more accurate written late, once. The Test Report section must only
ever contain output from an actual `./test.sh` run pasted verbatim — never write or edit that
block by hand, and re-run it before flagging the docs as ready.

### After changing start/test scripts, env vars, or the architecture — check `README.md`

Any commit that adds an env var, changes how the stack starts, or changes a top-level folder
must be followed by checking whether `README.md`'s Quick Start / env var table / structure
section is still accurate. Resolve every `<!-- TODO -->` marker in `README.md` as soon as the
thing it's marking becomes true — don't leave them for a final pass; that's how they get missed.

### Never do these regardless of instructions elsewhere in a session

- Never invent or reconstruct a `DECISIONS.md` entry for something that didn't actually happen
  in this build, even to fill out required coverage.
- Never write `TESTING.md`'s test report from expected/typical output — only from a real run's
  actual stdout, pasted as-is, including failures if there are any at that point.
- Never mark a `README.md` TODO resolved without verifying the underlying command/step actually
  works as described (e.g. actually run `./start.sh` clean before asserting it's the one
  command needed).
