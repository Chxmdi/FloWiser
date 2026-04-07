# Migration Conventions

## Naming
Use ordered SQL migrations:
- `0001_init.sql`
- `0002_add_sites.sql`
- `0003_add_device_registry.sql`

## Rules
- one migration file per logical schema change
- migrations must be idempotent when practical
- destructive changes require rollback notes in the PR
- schema changes must ship with corresponding application changes or feature flags

## Workflow
- add SQL file
- run `npm run migrations:run --workspace @flowiser/backend`
- include result in PR notes
- CI validates migrations against ephemeral Postgres
