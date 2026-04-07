# Storage Design

## Production storage split
- **Postgres / Timescale local dev** for application metadata and migration discipline
- **AWS RDS** target for application relational data
- **AWS Timestream** target for future large-scale telemetry time-series storage
- **S3** target for cold raw payload archive
- **SQS DLQ** target for failed ingestion events

## Epic 5 implementation in repo
The current backend now persists the following when `DATABASE_URL` is configured:
- raw event archive records
- normalized telemetry events
- device state projections
- site state projections
- branch state projections
- telemetry rollups for 1-minute, 5-minute, hourly, and daily buckets

## Epic 6 trust layer
The backend now also computes and persists:
- quality status
- quality score
- quality flag count
- state freshness derived from last-received timestamps
- connectivity confidence derived from freshness and quality

## Current trade-off
The persistence layer is intentionally implemented against Postgres first so the projection logic is testable and easy to debug. Timestream and S3 remain the target production direction for heavier scale and colder archive tiers.

## Principle
Use the simplest local developer stack possible while keeping the production architecture direction explicit.
