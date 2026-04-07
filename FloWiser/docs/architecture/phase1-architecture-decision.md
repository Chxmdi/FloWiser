# Phase 1 Architecture Decision

## Decision
Use a monorepo with a separate backend service, frontend app, shared root tooling, and infrastructure bootstrap templates.

## Why
- one CI/CD entry point
- easier shared standards
- easier incremental delivery
- simpler onboarding for a small founding team
- less risk of repo sprawl during early execution

## Trade-off
The repo currently keeps the app under `FloWiser/` inside the repository root. That is acceptable for now because the workspace scripts are wired to it. We can flatten later only if it improves delivery enough to justify the churn.
