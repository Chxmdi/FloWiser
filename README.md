# FloWiser Repository

This repository contains the **Epic 1 platform foundation** for **FloWiser**, a commercial energy optimization platform for multi-site organizations.

## What is in this repo

- `FloWiser/frontend` — Next.js operator and executive web app scaffold
- `FloWiser/backend` — TypeScript API and ingestion service scaffold
- `FloWiser/infrastructure` — AWS bootstrap and environment scaffolding
- `FloWiser/docs` — engineering, architecture, and scope documentation
- `.github/workflows` — CI, preview/staging, migrations, and release workflows

## Current delivery status

Epic 1 is implemented as a working repository foundation for Sprint 1:

- monorepo workspace and engineering standards
- local development setup with Docker Compose
- CI/CD scaffolding
- database migration runner
- preview/staging workflow hooks
- infrastructure bootstrap templates
- architecture and operating conventions

## Important note

The current application source lives under the `FloWiser/` directory because the repo was originally scaffolded that way. The top-level workspace scripts are already wired to that structure, so you can work from the repo root without moving folders again.

## Quick start

```bash
cp FloWiser/.env.example FloWiser/.env
cp FloWiser/backend/.env.example FloWiser/backend/.env
cp FloWiser/frontend/.env.example FloWiser/frontend/.env

docker compose up -d
npm install
npm run dev
```

## Primary commands

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run migrations:run --workspace @flowiser/backend
```
