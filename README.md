# FloWiser Repository

This repository contains the platform foundations and early operational data model for **FloWiser**, a commercial energy optimization platform for multi-site organizations.

## What is in this repo

- `FloWiser/packages/schemas` — shared canonical telemetry schemas
- `FloWiser/frontend` — Next.js operator and executive web app scaffold
- `FloWiser/backend` — TypeScript API, decoder framework, ingestion reliability layer, and registry model
- `FloWiser/infrastructure` — AWS bootstrap and environment scaffolding
- `FloWiser/docs` — engineering, architecture, and scope documentation
- `.github/workflows` — CI, preview/staging, migrations, and release workflows

## Delivery status

### Epic 1
- monorepo workspace and engineering standards
- local development setup with Docker Compose
- CI/CD scaffolding
- database migration runner
- preview/staging workflow hooks
- infrastructure bootstrap templates

### Epic 2
- shared canonical telemetry schema package
- decoder registry with fallback handling
- unit and timestamp normalization helpers
- raw payload archiving with replay lookup route
- first meter adapters and fixtures
- decode-preview API for validating inbound payloads

### Epic 3
- ingestion envelope validation and source-auth checks
- transport and canonical idempotency
- ordering and replay findings
- dead-letter routing and inspection APIs

### Epic 4
- tenant, branch, site, asset, and device registry model
- bind, remap, and unbind lifecycle for device-to-asset mappings
- hierarchy import endpoint for onboarding flows
- persistent schema migration for the registry core tables

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
