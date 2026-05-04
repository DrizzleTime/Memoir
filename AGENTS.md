# Repository Guidelines

## Project Structure & Module Organization
`src/app` holds App Router pages, layouts, and `/api` route handlers. `src/components` contains reusable feature and UI components, with base primitives under `src/components/ui`. `src/lib` stores shared helpers such as auth, Prisma access, markdown rendering, and validation. `prisma/schema.prisma` defines the data model, while `src/generated/prisma` is generated output and should not be edited manually. Static assets live in `public/`, and one-off migration utilities live in `scripts/`.

## Build, Test, and Development Commands
`bun install` installs dependencies. `bun dev` starts the local server on `http://localhost:3000`. `bun run build` creates a production build and catches many App Router or environment issues early. `bun run lint` runs the repository ESLint rules. `bunx prisma db push` syncs schema changes to the local database, and `bunx prisma generate` regenerates the Prisma client after model updates.

## Coding Style & Naming Conventions
Use TypeScript with strict mode and follow the formatting already present in the touched file; `bun run lint` is the final check. Use `PascalCase` for React components such as `CommentForm.tsx`, `camelCase` for functions and variables, and lowercase route segment names under `src/app`. Prefer the `@/` path alias over deep relative imports. Keep generated Prisma files unchanged unless the source schema changes.

## Testing Guidelines
There is no dedicated automated test suite yet. Treat `bun run lint` as the minimum quality gate and manually verify affected flows before merging. Changes touching articles, comments, admin pages, uploads, or Prisma schema should include a short regression checklist in the pull request. If automated tests are introduced later, place them near the feature or in a local `__tests__/` directory and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines
Recent history mostly follows short Conventional Commit messages, commonly `feat: 中文描述`. Keep that pattern for new commits, for example `fix: 修复评论筛选`. Pull requests should summarize scope, list schema or `.env` changes, link related issues, and include screenshots for UI changes. This repository builds Docker images through `.github/workflows/docker.yml`, so ensure the branch still builds before requesting review.

## Configuration & Deployment Notes
Required environment variables include `DATABASE_URL`, `JWT_SECRET`, and `SITE_URL`. `SITE_URL` must be valid in production because it is used for canonical URLs, Open Graph metadata, sitemap generation, `robots.txt`, and feed output.
