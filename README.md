# FloWiser Repository

This repository contains the platform foundations and early operational data modules for **FloWiser**, a commercial energy optimization platform for multi-site organizations.

## What is in this repo

- `FloWiser/packages/schemas` — shared canonical telemetry schemas
- `FloWiser/frontend` — Next.js operator and executive web app scaffold
- `FloWiser/backend` — TypeScript API, decoder framework, ingestion reliability layer, registry model, durable storage projections, trust/state engine, and workflow core
- `FloWiser/infrastructure` — AWS bootstrap and environment scaffolding
- `FloWiser/docs` — engineering, architecture, and scope documentation
- `.github/workflows` — CI, preview/staging, migrations, and release workflows

## Current delivery status

This repo contains the first seven foundation epics of the delivery plan.

### Epic 1
- monorepo workspace and engineering standards
- local development setup with Docker Compose
- CI/CD scaffolding
- migration runner and release hooks

### Epic 2
- canonical telemetry schema
- decoder registry and normalization framework
- raw event archive interface
- first meter and gateway adapters

### Epic 3
- ingestion envelope validation
- source auth validation
- idempotency and ordering checks
- replay and dead-letter handling

### Epic 4
- tenant / branch / site / asset / device registry model
- binding, remap, and unbind workflows
- hierarchy import endpoint for onboarding flows
- persistent schema migration for the registry core tables

### Epic 5
- persistent raw-event archive and normalized telemetry event store
- current-state projections for device, site, and branch views
- rollup tables and projection service for 1-minute, 5-minute, hourly, and daily telemetry buckets
- query routes for persisted raw events and normalized telemetry events

### Epic 6
- telemetry quality evaluation rules and metrics
- state freshness and connectivity-confidence engine
- quality reevaluation endpoint
- device, site, and branch state inspection APIs

### Epic 7
- alert generation and deduplication
- issue lifecycle, comments, and assignment
- notification log generation for email and in-app flows
- field checklists, field tasks, rollback notes, and site visit logs

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
