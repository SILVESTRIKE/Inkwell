# Inkwell

Turns a book's text into character portraits and chapter illustrations using the Gemini API.
Five user-driven steps: Style → Characters → Portraits → Chapters → Illustrations.

> Assessment submission for Gradion — Intern Software Engineer.

## Quick Start

1. Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```

2. Start the stack (Docker containers + Backend + Frontend + BullMQ Worker):
   ```bash
   ./start.sh
   ```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- BullMQ Visual Dashboard: http://localhost:4000/admin/queues
- Prometheus Metrics: http://localhost:4000/metrics
- Grafana Dashboard: http://localhost:3001 (admin / admin)
- Loki Log Ingestion: http://localhost:3100

## Running Tests

Run backend and frontend test suites in one command:
```bash
./test.sh
```

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (for MongoDB, Redis, Prometheus, Loki, Grafana)
- Gemini API Key: https://ai.google.dev/

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Backend server port | `4000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/inkwell` |
| `REDIS_URL` | Redis connection string for step locks & BullMQ | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `change-me-to-a-long-random-string` |
| `GEMINI_API_KEY` | Gemini API Key | Required for real Gemini calls (mocked if empty) |
| `STORAGE_DIR` | Local disk directory for uploads & images | `./storage` |
| `NEXT_PUBLIC_API_URL` | Base URL for Next.js API client | `http://localhost:4000` |
| `LOKI_HOST` | Loki log aggregator host URL (optional) | `http://localhost:3100` |

## Architecture, Security & Asynchronous Queues

- **Backend:** Express with feature-module structure (`auth`, `projects`, `pipeline`, `media`).
- **Asynchronous Queueing (BullMQ):**
  - Steps are enqueued to `pipelineQueue` in Redis via `BullMQ`.
  - Immediate `202 Accepted` response with `jobId`.
  - Background worker (`pipelineWorker`) executes Gemini calls, saves images, and updates Mongo.
  - Visual Admin Dashboard mounted at `http://localhost:4000/admin/queues`.
- **Anti-Spam & Rate Limiting (`express-rate-limit`):**
  - Global limiter: Max 200 req / 15 min per IP.
  - Auth limiter: Max 10 attempts / 15 min per IP.
  - Pipeline step limiter: Max 5 step executions / 1 min per IP to prevent API spamming and quota exhaustion.
- **Security:**
  - JWT tokens issued via `HttpOnly; SameSite=Lax` cookies to prevent XSS session theft.
  - Magic Bytes binary header validation (`magic-bytes.util.ts`) for `.txt`, `JPEG`, `PNG`, and `WEBP` files.
- **Logging & Monitoring Stack:**
  - Structured logging with `winston` and optional Loki transport (`winston-loki`).
  - Prometheus metrics (`prom-client`) exposing runtime and request metrics at `/metrics`.
  - Grafana dashboard service in Docker Compose.
- **Data, Locks & Cleanup:**
  - MongoDB is the durable store for users, projects, and step output.
  - Redis manages short-lived step locks (`lock:project:<id>:step:<n>`) with TTL to guarantee no duplicate Gemini calls across tabs or refreshes.
  - Background cron job (`node-cron`) cleans up storage files older than retention policy.

## Project Structure

```
backend/       Express API, feature-module layout (auth, projects, pipeline, media)
frontend/      Next.js (App Router) web application
storage/       Local directory for uploaded book text and generated images (created at runtime)
docker-compose.yml MongoDB, Redis, Prometheus, Loki, Grafana containers
start.sh       Single script to start containers and dev servers
test.sh        Single script to execute all test suites
DECISIONS.md   Architecture trade-offs, security, BullMQ & AI copilot overrides
TESTING.md     Test strategy and report
CLAUDE.md      Project context rules for AI tools
```
