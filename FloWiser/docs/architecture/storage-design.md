# Storage Design

## Phase 1 storage split
- **Postgres / Timescale local dev** for application metadata and migration discipline
- **AWS RDS** target for application relational data
- **AWS Timestream** target for telemetry time-series storage
- **S3** target for raw payload archive
- **SQS DLQ** target for failed ingestion events

## Principle
Use the simplest local developer stack possible while keeping the production architecture direction explicit.
