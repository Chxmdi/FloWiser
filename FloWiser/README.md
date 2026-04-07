# FloWiser Application Workspace

FloWiser is a commercial energy optimization platform for multi-site operators. This workspace contains the application code, infrastructure bootstrap assets, and engineering documentation required for **Epic 1: Platform Foundations & DevEx**.

## Workspace layout

```text
FloWiser/
  backend/          TypeScript API and ingestion scaffold
  frontend/         Next.js web application scaffold
  infrastructure/   AWS bootstrap templates and environment notes
  docs/             Architecture, product, and engineering standards
  scripts/          Local startup and seed helpers
```

## Sprint 1 outcomes covered here

- repository structure and local development conventions
- environment variable strategy
- Docker-based local dependencies
- build, lint, test, and typecheck pipelines
- migration runner and CI validation
- preview / staging deployment workflow hooks
- infrastructure bootstrap documentation and templates
- engineering standards for versioning, logging, errors, and done criteria

## Local startup

1. Copy environment files
2. Start local dependencies with Docker Compose from the repo root
3. Install workspace dependencies
4. Run frontend and backend together

```bash
cp FloWiser/.env.example FloWiser/.env
cp FloWiser/backend/.env.example FloWiser/backend/.env
cp FloWiser/frontend/.env.example FloWiser/frontend/.env
docker compose up -d
npm install
npm run dev
```

## Key scripts

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run migrations:run --workspace @flowiser/backend
```

## Engineering conventions

See:
- `docs/engineering/branching-and-commits.md`
- `docs/engineering/local-development.md`
- `docs/engineering/api-versioning.md`
- `docs/engineering/event-schema-versioning.md`
- `docs/engineering/migration-conventions.md`
- `docs/engineering/logging-and-errors.md`
- `docs/engineering/definition-of-done.md`
