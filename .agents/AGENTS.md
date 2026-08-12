# Inkwell — Project Rules & Agent Instructions

This document is the workspace customization root (`.agents/AGENTS.md`) for AI agent assistance across the Inkwell repository.

---

## 1. Core Project Hard Constraints

1. **Server-Side Cap Enforcement**: Adult characters max 2 (`env.MAX_CHARACTERS`), chapter illustrations max 1 (`env.MAX_CHAPTERS`). Always enforce at the API/pipeline layer.
2. **Concurrency Locks**: Never allow duplicate Gemini calls for the same step in-flight. Enforce via Redis `SET NX` locks with 60s TTL (`lock:project:<id>:step:<n>`).
3. **Resumable State**: Projects persist step outputs and step status (`pending | running | done | failed`) in MongoDB (`Project.stepStates`). Server restart or refresh mid-pipeline displays current state and polling resumes cleanly.
4. **Stuck-State Recovery**: `recoverStuckStep` verifies lock staleness/running status before releasing locks to prevent stomping in-flight steps.
5. **Context Caching**: Upload book text once using Gemini `cachedContents` API v1beta and reuse `cachedContentName` across text extraction steps.
6. **No Auto-Retry Loops**: Gemini API retries are 100% user-triggered (§4.3). Never auto-retry in background loops.
7. **Explicit Error Propagation**: Never swallow real Gemini API errors with silent mock fallbacks. Failures must throw directly so step status transitions to `'failed'`, enabling user retries.
8. **Multimodal Character Consistency**: Pass Step 3 portrait `.jpg` binary buffers into `illustrations.step.ts` as `inlineData` image parts to `gemini-3.1-flash-image` (Nano Banana) alongside scene prompts.
9. **Media Storage**: Store uploaded book text and generated images in date-structured paths (`uploads/images/YYYY/MM/<projectId>_<filename>`) served via `/api/media/files/...` with JWT query auth (`?token=...`).
10. **Incremental Image Persistence**: Save image filenames to MongoDB immediately after generating each individual character portrait / chapter illustration to avoid data loss and enable live per-item UI progress (§4.4).
11. **Dual-Token Authentication**: Issue 15-minute Access Token + 7-day Refresh Token in HttpOnly cookie (`sameSite=lax`), supporting automatic silent token refresh on 401 `TOKEN_EXPIRED`.
12. **Neo-Editorial UI Architecture**: Neo-Editorial visual system (Playfair Display + Source Serif 4 + Inter/Geist), five-act narrative stepper (`01 — STYLE` to `05 — ILLUSTRATIONS`), paper-like 4px radii, and exact specified dark/light palettes.

---

## 2. Tech Stack & Architecture

- **Backend**: Node.js, Express (Feature-module layout: `auth/`, `projects/`, `pipeline/`, `media/`)
- **Frontend**: Next.js (App Router, TypeScript), Tailwind CSS (Neo-Editorial / Dark Academia theme tokens)
- **Database**: MongoDB (Mongoose) for durable state; Redis for `SET NX` step-locks.
- **AI Provider**: Google Gemini API (`gemini-3.6-flash` for text, `gemini-3.1-flash-image` via `generateContent` for images).
- **Testing**: Vitest for backend & frontend component tests.

---

## 3. Coding Conventions

- **TypeScript Strict Mode**: Explicit typing across backend and frontend. No unhandled `any`.
- **Validation**: Schema validation with `Zod` at boundary endpoints.
- **Error Handling**: Domain error classes (`BadRequestError`, `NotFoundError`, `ConflictError`) mapped via central Express `errorHandler` middleware.
- **Documentation Deliverables**:
  - [`docs/architecture.md`](file:///docs/architecture.md): System architecture and data flow.
  - [`docs/DECISIONS.md`](file:///docs/DECISIONS.md): Key decisions, AI overrides, and trade-offs.
  - [`docs/TESTING.md`](file:///docs/TESTING.md): Testing strategy and execution results.
  - [`docs/design-tokens.md`](file:///docs/design-tokens.md): Neo-Editorial / Dark Academia UI design tokens.
  - [`docs/plan.md`](file:///docs/plan.md): Task list and phase deliverables.
  - [`README.md`](file:///README.md): Quick start and overview.

---

## 4. Git Branching & Conventional Commit Rules

Format: `<type>(<scope>): <subject>`

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (no feature/fix change)
- `docs`: Documentation updates only
- `style`: Formatting changes (no logic change)
- `test`: Adding or updating tests
- `chore`: Build/script maintenance

### Branch Naming:
- `feat/<short-description>`
- `fix/<short-description>`
- Develop on dedicated feature branches, then merge into `dev` or `main`.
