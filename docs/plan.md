# Implementation Plan

Working plan for the ~16h budget. Log shifts in `DECISIONS.md`.

## Phase 0 — Understand before building (~1.5h)

- [x] Run the reference notebook end to end, with a short public-domain book.
- [x] For each of the 5 steps, note: exact endpoint hit, request shape, response shape, whether it's structured JSON output, and context chaining.
- [x] Map each call to its REST equivalent from the Gemini API docs (`gemini-3.6-flash` & `gemini-3.1-flash-image` via `:generateContent`).
- [x] Check the image model's rate limits and handle multi-key pool failovers.
- [x] Write findings into `pipeline/steps/*.step.ts`.

## Phase 1 — Skeleton & harness (~2.5h)

- [x] Repo scaffold: `backend/`, `frontend/`, root `start.sh`, `test.sh`, `docker-compose.yml` (Mongo + Redis).
- [x] `.env.example`, env validation on boot with Zod schema.
- [x] Mongo connection + `User`/`Project` models. Redis connection + lock helper with unit tests for `acquireStepLock`, `releaseStepLock`, `isStepLocked`.
- [x] Express app skeleton: feature-module layout (`auth/`, `projects/`, `pipeline/`, `media/`), health check route.
- [x] Next.js app skeleton: identity screen wired to `/api/auth/session` with Dual-Token auth (15m Access Token + 7d Refresh Token).

## Phase 2 — Projects (~2h)

- [x] `POST /api/projects` (paste or `.txt` upload) + `GET /api/projects` + `GET /api/projects/:id`.
- [x] Book text written to `storage/<id>/book.txt`; Gemini file upload (`cachedContents` API v1beta) uploaded on manuscript import.
- [x] Frontend: Neo-Editorial project list (with empty state) + new project form (paste/upload + validation).

## Phase 3 — Pipeline steps 1–2 (Style, Characters) (~3h)

- [x] `pipeline.service.ts`: in-order enforcement, lock acquire/release, synchronous awaited execution (`runStep`).
- [x] `style.step.ts`, `characters.step.ts` against real Gemini calls.
- [x] Server-side cap enforcement: max 2 adult characters cap enforced and tested.
- [x] Frontend: five-act narrative stepper, style display, character cards, run/retry action button, running-state banner.
- [x] Manually test dedup case: double-click, second tab, refresh mid-call.

## Phase 4 — Pipeline steps 3–5 (Portraits, Chapters, Illustrations) (~3.5h)

- [x] `portraits.step.ts`: one image call per character, per-item incremental database saving exposed to frontend.
- [x] `chapters.step.ts`: cap enforcement at 1 chapter illustration prompt.
- [x] `illustrations.step.ts`: reuses portrait image buffers (`inlineData` parts) for multimodal character visual consistency.
- [x] `media` module: authenticated file-serving route with `?token=` query fallback.
- [x] Frontend: chapter cards, illustration display, live per-item progress count, `onError` fallbacks.

## Phase 5 — Resilience pass (~2h)

- [x] Kill server mid-step; confirm reopening project displays true Mongo state and stuck-step recovery path (`recoverStuckStep`) works without DB edits.
- [x] Confirm failed step is retryable in isolation without touching completed steps.
- [x] Confirm refresh/logout mid-pipeline resumes correctly from saved step states.

## Phase 6 — Tests, docs, polish (~2h)

- [x] Backend tests: 21 tests passing across pipeline ordering, lock helpers, cap enforcement, and auth service.
- [x] Frontend tests: 3 tests passing across stepper and header components.
- [x] Real test suite outputs recorded in `docs/TESTING.md`.
- [x] `README.md`: one-command start/test scripts, prerequisites, env vars, architecture summary.
- [x] `DECISIONS.md`: documented architectural decisions, AI overrides, and trade-offs.
- [x] Neo-Editorial UI polish: Playfair Display + Source Serif 4 + Inter/Geist, dark/light theme toggle, quiet transitions, responsive design.
