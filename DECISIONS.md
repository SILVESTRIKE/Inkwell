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

## Asynchronous Job Processing via BullMQ Queue & Bull-Board UI

While a synchronous HTTP request was sufficient for initial prototype testing, HTTP connections held open for 10–30s+ risk gateway timeouts under real load. We integrated `BullMQ` backed by Redis to handle background pipeline jobs asynchronously. Clicking "Run Step" enqueues a job (`pipelineQueue.add()`) and responds instantly (`202 Accepted`). A background worker process executes Gemini API calls, uploads files to disk, updates Mongo, and supports automatic exponential retries. A visual admin dashboard is mounted at `/admin/queues` using `@bull-board/express`.

Cost accepted: Adds BullMQ queue management and background worker execution, but eliminates HTTP timeouts and provides job progress visualization.

## Strict Rate Limiting (Global, Auth, and Pipeline)

To protect the backend from API spamming, brute force, and upstream Gemini quota exhaustion, we implemented strict multi-tier rate limiters via `express-rate-limit`:
- **Global Rate Limiter**: 200 requests / 15 mins per IP.
- **Auth Rate Limiter**: 10 session attempts / 15 mins per IP (prevents brute forcing).
- **Pipeline Rate Limiter**: 5 step executions / 1 min per IP (prevents Gemini API spamming).

Cost accepted: Rapid consecutive step triggers beyond 5/min return `429 Too Many Requests`, safeguarding quota.

## AI override #1: Enforcing character and chapter caps server-side

Claude initially placed the 2-character and 1-chapter caps inside the frontend UI slice logic. I overrode this because client-side caps can be bypassed or misconfigured, violating the strict API cost bounds requirement (§03). We moved cap enforcement directly into `characters.step.ts` and `chapters.step.ts` on the backend, truncating any Gemini array response exceeding the limits.

Cost accepted: Extra backend validation layer, but API costs are strictly guaranteed regardless of UI changes.

## AI override #2: Gemini Context Caching over re-sending book text

Claude originally drafted prompts that prepended the full book text string on every step call (Style, Characters, Chapters). I overrode this because sending full book text on every step violates constraint #5 and wastes API tokens. We implemented Gemini's `cachedContents` API to upload the book text once when the project is created and reference `cachedContent` across all subsequent pipeline steps.

Cost accepted: Fallback logic is required if Gemini context caching is unsupported on certain free-tier keys, but token consumption per step is reduced dramatically.

## Structured Logging & Observability Stack (Winston, Loki, Prometheus, Grafana)

We added `winston` structured logging alongside `prom-client` and Grafana/Loki integration (`winston-loki`). In development, Winston outputs colorized logs to console. In production, logs are formatted as structured JSON and piped to Loki on port 3100. Prometheus collects HTTP request duration histograms at `/metrics`, rendered via Grafana on port 3001.

Cost accepted: Additional Docker containers for Grafana, Loki, and Prometheus in `docker-compose.yml`, but provides full production observability.

## Security: HttpOnly Cookies for JWT & Magic Bytes File Validation

We updated session management to issue JWT tokens via `HttpOnly; SameSite=Lax` cookies, preventing client-side JavaScript access and insulating tokens against XSS theft. Additionally, `magic-bytes.util.ts` validates binary headers (`JPEG`, `PNG`, `WEBP`, UTF-8 `.txt`) to ensure uploaded and generated files are genuine format matches.

Cost accepted: Requires `cookie-parser` middleware on the backend and credential header options in frontend requests.

## Gemini model selection

We selected `gemini-2.0-flash` for text and structured JSON extraction due to its high speed and reliable JSON Schema enforcement. For image generation, we selected `imagen-3.0-generate-002` for storybook portrait and scene rendering.

---

## If I had one more day

If I had one more day, I would build real-time Server-Sent Events (SSE) streaming updates between the backend and frontend to eliminate polling, along with an attempt-history drawer per step allowing users to view previous prompts and generated image variations.
