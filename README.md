# FloWiser Repository

This repository contains the platform foundations and early operational data modules for **FloWiser**, a commercial energy optimization platform for multi-site organizations.

## What is in this repo

- `FloWiser/packages/schemas` — shared canonical telemetry schemas
- `FloWiser/frontend` — Next.js operator, executive, and admin web app scaffold
- `FloWiser/backend` — TypeScript API, decoder framework, ingestion reliability layer, registry model, durable storage projections, trust/state engine, workflow core, rules engine, recommendation engine, experience APIs, guarded controls execution layer, command/simulation layer, tenant access hardening, verification/ROI reporting, real gateway delivery contracts, field measurement verification, and operational resilience workflows
- `FloWiser/infrastructure` — AWS bootstrap and environment scaffolding
- `FloWiser/docs` — engineering, architecture, and scope documentation
- `.github/workflows` — CI, preview/staging, migrations, and release workflows

## Current delivery status

This repo contains the first sixteen foundation epics of the delivery plan.

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

### Epic 8
- persisted rules configuration
- rule execution traces
- initial waste, generator, telemetry, and equipment rules
- rule-management backend routes
- minimal admin rule-management UI

### Epic 9
- root-cause classification from matched rule traces
- persisted recommendations and approval workflows
- top-action ranking and recommendation query routes
- admin recommendation inspection UI

### Epic 10
- dashboard and experience APIs for operator and executive views
- branch and site detail endpoints built from live backend state
- frontend overview, branch, site, alert, and executive pages tied to backend data with safe fallbacks

### Epic 11
- control approval policies
- execution-specific approvals and action execution requests
- guardrail evaluation before action completion
- execution logs and control-management routes
- admin controls inspection UI

### Epic 12
- command templates for guarded execution actions
- command planning and simulation routes
- simulated gateway dispatches and manual playbook dispatch logs
- admin command inspection UI

### Epic 13
- tenant memberships and role-based protected routes
- scope-aware access checks for tenant, branch, and site identifiers
- audit log generation for protected routes
- membership and audit inspection APIs
- admin access inspection UI

### Epic 14
- verification snapshots for realized-vs-expected savings
- overview, executive, site, and per-action reporting APIs
- ROI, payback, and capture-rate reporting derived from execution evidence
- admin reporting inspection UI

### Epic 15
- gateway agent contracts for heartbeat, dispatch pickup, and result submission
- queued command dispatches for real gateway pickup instead of immediate synthetic completion
- field measurement verification inputs for energy and diesel before/after values
- reporting preference for field M&amp;V when measured values exist
- admin gateway and field verification inspection UI

### Epic 16
- retry scheduling and dead-letter handling for gateway dispatches
- transport timeout sweep and manual retry operations
- gateway health and pending-dispatch visibility
- operational incident tracking for delivery failures
- admin operations inspection UI

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
