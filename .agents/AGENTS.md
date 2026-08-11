# Git Branching & Conventional Commit Rules

Follow these rules for git commit formatting, branch naming, and backend architecture conventions across all workspaces.

---

## 1. Conventional Commits Standard

Format: `<type>(<scope>): <subject>`

### Types:
- `feat`: New feature addition
- `fix`: Bug fix
- `docs`: Documentation updates only
- `style`: Formatting, missing semi colons, white spaces (no code logic change)
- `refactor`: Code refactoring (no feature addition or bug fix)
- `test`: Adding or updating tests
- `chore`: Build tasks, package configs, script maintenance

### Scope (Optional):
Module or component name (e.g., `auth`, `projects`, `pipeline`, `ui`, `api`).

### Subject Rules:
- Short description (<= 50 characters)
- Use imperative mood in present tense (e.g., `add feature`, not `added feature`)
- Do NOT capitalize the first letter
- Do NOT end with a period

---

## 2. Commit Body (Optional)
- Separate subject from body with a blank line.
- Wrap lines at ~72 characters.
- Focus on explaining *why* the change was made, not just *what*.

---

## 3. Branch Naming Convention

Format: `<type>/<short-description>`

Replace spaces with `-`, colons with `/`.

Examples:
- `feat/auth-jwt-refresh`
- `feat/auth-schema`
- `fix/pipeline-lock-ttl`

---

## 4. Backend Schema & Controller Rules

- **Database Schemas**: Always ensure all Mongoose/Prisma schemas include automatic timestamps (`createdAt`, `updatedAt`) and a soft-delete field (`isDeleted?: boolean`).
- **Controller Layer**: Controllers MUST NOT contain business logic. Controllers must only handle parsing/validating HTTP requests, passing arguments to domain services, and returning HTTP responses.

---

## 5. Feature-Isolated Branching & Integration Workflow

1. **Feature Isolation**: Develop every new feature or refactor on its own dedicated feature branch (e.g. `feat/<short-description>` or `fix/<short-description>`), branched off `dev` or `main`.
2. **Atomic Commits & Remote Push**: After finishing a feature, run build/tests, commit changes using Conventional Commits, and push the branch to remote (`git push origin <branch-name>`).
3. **Integration into `dev` Branch**: Merge completed feature branches into the `dev` integration branch (`git checkout dev && git merge <branch-name>`), then push `dev` to remote (`git push origin dev`).

