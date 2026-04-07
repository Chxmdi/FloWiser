# Infrastructure Bootstrap

This directory contains the infrastructure scaffolding for the FloWiser platform foundation.

## What Epic 1 includes

- AWS bootstrap templates for shared foundation resources
- environment directories for `dev` and `staging`
- monitoring dashboard seed JSON
- naming and rollout conventions

## Target shared resources

- object storage for raw event retention
- relational storage for application metadata and migrations
- time-series storage for telemetry
- secrets management
- queues / dead-letter processing
- CloudWatch dashboards and logs

## Important note

These files are intentionally conservative. They are designed to give the team a repeatable starting point without pretending production decisions are final before real pilot requirements are validated.
