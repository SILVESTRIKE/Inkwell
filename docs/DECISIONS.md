# Decisions

Decisions only — not a worklog. Git history covers when things happened; this covers *why*, who proposed what, who pushed back, and what it cost.

---

## Stack and storage: Mongo + Redis over single DB or raw JSON files

The brief explicitly allowed JSON files on disk for storage. Claude originally suggested a pure JSON file approach with in-memory locks. I pushed back because raw JSON files incur race conditions when multiple steps or tabs write concurrently. A hand-rolled file lock per project is fragile. We settled on MongoDB as the durable source of truth for users, projects, and step state, paired with Redis for atomic step locks (`SET NX` with TTL).

Cost accepted: Two background services (MongoDB + Redis) instead of zero, but we get atomic concurrency safety and instant resume upon server restarts.

## Modeling pipeline progress: Per-step state array alongside overall status

Claude initially proposed a single `status` enum (`draft | in_progress | done`) on the project object. I pushed back because a single status field cannot express "Step 2 is completed while Step 3 is currently running and Step 4 is pending". We split the model into an `overallStatus` pill alongside a `stepStates` array containing per-step statuses (`pending | running | done | failed`).

Cost accepted: Required keeping the derived `overallStatus` in sync as step 5 completes, but mid-pipeline refreshes and page reloads can now render the exact state of every step independently.

## Stopping duplicate execution on refresh / second tab / double-click

Claude proposed button-disabled attributes in the frontend to prevent double-clicks. I pushed back because client-side guards do not prevent duplicate API requests from a second tab or page refresh. We implemented a server-side lock in Redis (`lock:project:<id>:step:<n>`) with a 60-second TTL. If a step request arrives while the lock exists, the backend rejects it with `409 Conflict`.

Cost accepted: If the server crashes hard mid-call, the lock stays in Redis for up to 60 seconds before expiring, but users are provided a "Reset Stuck State" affordance to clear it manually if needed.

## Direct Synchronous Execution (`runStep`) over BullMQ or Background Fire-and-Forget

An initial attempt to remove BullMQ landed on a hand-rolled `setImmediate()` fire-and-forget background call with `202 Accepted`. During code review, we identified that fire-and-forget provided no client completion guarantees and risked detached execution. We refactored to direct awaited execution (`runStep`), where the backend awaits the step result, saves state, releases the lock, and returns HTTP `200 OK` with the completed project.

Cost accepted: The HTTP response waits for the single step to finish, but API execution is 100% deterministic, completion is guaranteed before response return, and BullMQ/Observability queue complexity is completely eliminated.

## Strict Rate Limiting (Global, Auth, and Pipeline)

To protect the backend from API spamming, brute force, and upstream Gemini quota exhaustion, we implemented strict multi-tier rate limiters via `express-rate-limit`:
- **Global Rate Limiter**: 200 requests / 15 mins per IP.
- **Auth Rate Limiter**: 10 session attempts / 15 mins per IP (prevents brute forcing).
- **Pipeline Rate Limiter**: 5 step executions / 1 min per IP (prevents Gemini API spamming).

Cost accepted: Rapid consecutive step triggers beyond 5/min return `429 Too Many Requests`, safeguarding quota.

## AI override #1: Enforcing character and chapter caps server-side

Claude initially placed the 2-character and 1-chapter caps inside the frontend UI slice logic. I overrode this because client-side caps can be bypassed or misconfigured, violating the strict API cost bounds requirement (§03). We moved cap enforcement directly into `characters.step.ts` and `chapters.step.ts` on the backend via `env.MAX_CHARACTERS` and `env.MAX_CHAPTERS`.

Cost accepted: Extra backend validation layer, but API costs are strictly guaranteed regardless of UI changes.

## AI override #2: Gemini Context Caching over re-sending book text

Claude originally drafted prompts that prepended the full book text string on every step call (Style, Characters, Chapters). I overrode this because sending full book text on every step violates constraint #5 and wastes API tokens. We implemented Gemini's `cachedContents` API to upload the book text once when the project is created and reference `cachedContent` across all subsequent pipeline steps.

Cost accepted: Fallback logic is required if Gemini context caching is unsupported on certain free-tier keys, but token consumption per step is reduced dramatically.

## Security: HttpOnly Cookies for JWT & Magic Bytes File Validation

We updated session management to issue JWT tokens via `HttpOnly; SameSite=Lax` cookies, preventing client-side JavaScript access and insulating tokens against XSS theft. Additionally, `magic-bytes.util.ts` validates binary headers (`JPEG`, `PNG`, `WEBP`, UTF-8 `.txt`) to ensure uploaded and generated files are genuine format matches.

Cost accepted: Requires `cookie-parser` middleware on the backend and credential header options in frontend requests.

## Custom Domain Error Hierarchy (`CustomError`)

Claude originally caught exceptions with generic `AppError` and inline HTTP status codes. We refactored to an explicit custom error hierarchy (`CustomError` base class with `NotFoundError`, `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`, `TooManyRequestsError`). This provides uniform `{ errors: [{ message, field }] }` error serialization across all endpoints.

Cost accepted: Additional class boilerplate files, but API error outputs are strictly structured and predictable for frontend consumption.

## Gemini Multi-API Key Load Balancing & Rate-Limit Failover

To prevent single API key quota exhaustion and `429 Too Many Requests` bottlenecks when running image generation pipeline steps, we updated `GeminiClient` to support a pool of multiple Gemini API keys (`GEMINI_API_KEYS=key1,key2,key3`). Requests are distributed using a round-robin algorithm. If any single key encounters a 429 rate limit or quota error, `GeminiClient` automatically fails over to the next key in the pool.

Cost accepted: Requires managing multiple API keys in environment config, but guarantees high availability and avoids pipeline stalls during heavy load.

## Date-Structured Media Storage Hierarchy (`uploads/images/YYYY/MM`) & Query-Token Auth

Claude initially saved files to flat project directories (`storage/:projectId/:filename`). I overrode this to implement a date-structured storage hierarchy (`uploads/images/YYYY/MM/<projectId>_<filename>`) matching `.gitignore` rules co-located with DB relative paths. To allow HTML `<img>` tags to render authenticated media files cleanly without dropping 401s, we updated `requireAuth` to accept `?token=<jwt_token>` as a query parameter fallback.

Cost accepted: Requires wildcard path resolution (`/api/media/files/*`) and URL prefix transformation in `media.util.ts`, but prevents single-folder disk bloat and cleanly handles browser image authentication.

## AI Override #3: Eliminating Silent Error Swallowing & Fixing Discontinued Imagen Models

Initial image integration used `imagen-4.0-generate-001` via `:predict`, which turned out to be discontinued — every call was silently falling back to a placeholder, which meant real quota, real failures, and the retry UI were never actually being exercised. I caught this by reviewing the client's error handling directly.

We corrected this by:
1. **Switching to Nano Banana**: Updated `imageModel` to `gemini-3.1-flash-image` invoked via `generateContent`, which natively supports inline image generation.
2. **Removing Blanket Fallbacks**: Removed catch-all error swallowing in `GeminiClient` so live API errors throw directly, allowing `pipeline.service.ts` to transition step state to `'failed'` and enable user-triggered manual retries (§4.3).
3. **Multimodal Character Consistency**: Updated `illustrations.step.ts` to read Step 3 portrait `.jpg` files from disk and feed their binary buffers as `inlineData` parts into `gemini-3.1-flash-image` alongside the prompt, ensuring character visual consistency across chapter scene illustrations (§03).

Cost accepted: Step failures are explicitly exposed to the user and prompt payloads include image bytes, but real Gemini failures correctly trigger the resilience workflow.

## Stale Lock Recovery Guard

We updated `recoverStuckStep` to verify whether a step is actively locked (`isStepLocked`) or in a `running`/`failed` state before allowing manual state clearing, preventing race conditions between background execution and manual resets.

---

## UI/UX Aesthetic: Neo-Editorial / Dark Academia layout over generic SaaS dashboard

Initial UI prototypes used standard SaaS component layouts (slate/indigo colors, rounded pill badges, equal 3-column card grids, numbered status circles). While functional, this felt like a generic AI dashboard rather than a literary application. 

We redesigned the frontend using a **Neo-Editorial Layout** inspired by contemporary publishing houses and dark academia ("black ink, old library, candlelight"):
- **Five-Act Narrative Stepper**: Replaced step circles with a narrative chapter progression (`01 — STYLE`, `02 — CHARACTERS`, `03 — PORTRAITS`, `04 — CHAPTERS`, `05 — ILLUSTRATIONS`).
- **Typography Stack**: `Playfair Display` for display headings, `Source Serif 4` for book content, and `Inter` for micro UI labels (`text-[11px] uppercase tracking-[0.14em]`).
- **Dual Palettes**: Default **Dark Academia** (`#141311` obsidian, `#1D1B18` charcoal, `#E8E0D2` paper text, `#B65335` oxide rust) with a toggleable **Literary Editorial Light Theme** (`#F5F0E7` paper, `#EDE6D8` raised, `#29231F` warm ink, `#A94E2D` rust accent).
- **Shape & Motion Discipline**: 4px paper card borders, 3px input radii, zero pill buttons, 150-200ms quiet ease transitions.

---

## Strict Total-Order Linear Pipeline Execution (Option A)

The assessment specification (§4.3) requires: *"User-driven, in order. Each step needs an explicit user action. A step cannot run before the previous ones have succeeded"*. 

We evaluated two architectural patterns:
- **Option A (Strict Total Order)**: Step N strictly requires Step N-1 to be completed (`'done'`). Step 4 (Chapters) requires Step 3 (Portraits).
- **Option B (Selective Dependency Graph)**: Allowing Step 4 (Chapters text analysis) to run while Step 3 (Portraits image generation) sits failed.

We chose **Option A (Strict Total Order)** because:
1. **Spec Compliance**: §4.3 specifies a strict linear sequence, not a complex DAG. The 5-act stepper UI (`01` → `02` → `03` → `04` → `05`) is inherently a total-order linear progress bar.
2. **Constraint Bottleneck Realities**: Step 5 (Illustrations) requires both Step 3 (Portraits) and Step 4 (Chapters). Branching around Step 3 only delays the image quota ceiling by one step, while introducing unnecessary state machine complexity.
3. **Simplicity & Safety**: Eliminates illegal state combinations and keeps prerequisite checking predictable across backend and frontend.

Cost accepted: If Step 3 encounters an image rate limit (429), the user must wait out the rate limit and retry Step 3 before proceeding to Step 4.

---

## Development Mode Mock Image Fallback for Quota Resilience

To allow full end-to-end flow testing of the 5-act pipeline without getting blocked by Gemini free-tier image API rate limits (15 RPM / tight daily ceilings), we updated `GeminiClient.generateImage`:
- **In Development Mode (`NODE_ENV === 'development'`)**: If all Gemini API keys hit a `429` rate limit or quota ceiling during development testing, `GeminiClient` logs a warning (`[GeminiClient] Image API 429 rate-limited in development environment. Using mock image buffer...`) and returns a mock SVG image buffer. This allows full 5-act pipeline flow testing from Step 1 to Step 5 without stalling developer iteration.
- **In Production Mode (`NODE_ENV === 'production'`)**: Live Gemini API errors throw directly so step state transitions to `'failed'` and triggers explicit user-driven retries (§4.3 hard constraint).

Cost accepted: Developers see mock image placeholders during heavy 429 quota exhaustion in development, but production error propagation and user retry controls remain 100% strict.

---

## Architectural Trade-Off Matrix

| Decision Area | Choice Implemented | Alternative Considered | Trade-Off / Reason |
|---|---|---|---|
| **Architecture Layout** | **Feature-Module** (`auth/`, `projects/`, `pipeline/`, `media/`) | Layered MVC (`controllers/`, `models/`, `routes/`) | Keeps domain logic co-located per feature. Scalable for adding future pipeline steps without touching global folders. |
| **Pipeline Execution** | **Direct Awaited Execution (`runStep`)** | BullMQ / Fire-and-forget `setImmediate` | An attempt to remove BullMQ landed on a hand-rolled `setImmediate` fire-and-forget instead of true synchronous execution — caught during review and fixed by awaiting `runStep()` directly to guarantee completion before returning HTTP 200. Trimmed BullMQ, Prometheus, Grafana, Loki, node-cron, and dashboard files to remove unnecessary scope. |
| **Concurrency Lock** | **Redis (`SET NX` with 60s TTL)** | Client-side button disabling | Enforces lock at API level across page refreshes, multiple tabs, and concurrent double-clicks. |
| **Context Management** | **Gemini Context Caching** | Re-sending full text per call | Drastically reduces API token consumption per pipeline step; requires fallback if caching is unavailable on free-tier keys. |
| **Error Handling** | **Domain Error Hierarchy (`CustomError`)** | Generic `AppError(status, msg)` | Ensures standardized error JSON payloads (`{ errors: [...] }`) with field-level reporting across all routes. |
| **Database Storage** | **MongoDB + Mongoose** | Raw JSON files on disk | Provides ACID compliance, schema validation, index performance, and avoids file-system race conditions under concurrent writes. |
| **Media Directory Layout** | **Date-Structured (`uploads/images/YYYY/MM/`)** | Flat project directory (`storage/:id/`) | Prevents single-folder disk bloat; requires wildcard route matching and URL path prefix transformation. |
| **Image Authentication** | **Query Token (`?token=...`) + Cookie / Bearer** | Pure Bearer header only | Enables standard browser `<img>` tags to render authenticated media without 401 Unauthorized errors. |


## If I had one more day

If I had one more day, I would build real-time Server-Sent Events (SSE) streaming updates between the backend and frontend to eliminate polling, along with an attempt-history drawer per step allowing users to view previous prompts and generated image variations.
