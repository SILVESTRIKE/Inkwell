# Inkwell

Turns a book's text into character portraits and chapter illustrations using the Gemini API.
Five user-driven steps: Style → Characters → Portraits → Chapters → Illustrations.

> Assessment submission for Gradion — Intern Software Engineer.

## Quick Start

1. Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```

2. Start the stack (MongoDB + Redis + Backend + Frontend):
   ```bash
   ./start.sh
   ```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Running Tests

Run backend and frontend test suites in one command:
```bash
./test.sh
```

## Prerequisites

- Node.js (v18+)
- Docker & Docker Compose (for MongoDB and Redis)
- Gemini API Key: https://ai.google.dev/

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Backend server port | `4000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/inkwell` |
| `REDIS_URL` | Redis connection string for step locks | `redis://localhost:6379` |
| `JWT_SECRET` | Secret key for JWT signing | `change-me-to-a-long-random-string` |
| `GEMINI_API_KEY` | Gemini API Key | Required for real Gemini calls (mocked if empty) |
| `STORAGE_DIR` | Local disk directory for uploads & images | `./uploads` |
| `MAX_CHARACTERS` | Max adult main characters cap | `2` |
| `MAX_CHAPTERS` | Max chapter illustrations cap | `1` |
| `NEXT_PUBLIC_API_URL` | Base URL for Next.js API client | `http://localhost:4000` |

## Architecture, Concurrency & Security

- **Backend:** Express with feature-module structure (`auth`, `projects`, `pipeline`, `media`).
- **Direct Async Processing:**
  - Clicking "Run Step" responds immediately with `202 Accepted`.
  - Non-blocking background task executes Gemini API calls, saves images, and updates Mongo.
  - Retries are 100% user-triggered (§4.3 requirement).
- **Concurrency & Concurrency Locks:**
  - Redis manages short-lived step locks (`lock:project:<id>:step:<n>`) with TTL to guarantee no duplicate Gemini calls across tabs or refreshes (`409 Conflict`).
- **Security & Media Storage:**
  - JWT tokens issued via `HttpOnly; SameSite=Lax` cookies to prevent XSS session theft.
  - Magic Bytes binary header validation (`magic-bytes.util.ts`) for `.txt`, `JPEG`, `PNG`, and `WEBP` files.
  - Media files are stored in date-structured subdirectories (`uploads/images/YYYY/MM/`) served via auth-protected endpoints (`/api/media/files/...`) with JWT query token auth (`?token=...`).

## Project Structure

```
backend/       Express API, feature-module layout (auth, projects, pipeline, media)
frontend/      Next.js (App Router) web application
uploads/       Local directory for uploaded book text and generated images (created at runtime)
docs/          Documentation deliverables (architecture.md, DECISIONS.md, TESTING.md, design-tokens.md, plan.md)
.agents/       Workspace customization rules and AI instructions (AGENTS.md)
docker-compose.yml MongoDB and Redis containers
start.sh       Single script to start containers and dev servers
test.sh        Single script to execute all test suites
```
