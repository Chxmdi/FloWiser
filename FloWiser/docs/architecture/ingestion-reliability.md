# Ingestion Reliability Layer

Epic 3 introduces the operational safeguards that stop FloWiser from treating every inbound event as equally trustworthy.

## Included services
- source-auth validation
- transport idempotency service
- canonical idempotency service
- ordering state tracker
- dead-letter service
- ingestion consumer orchestration service

## Why this matters
Commercial telemetry systems regularly encounter:
- duplicate transport delivery
- replay after reconnect
- stale payloads
- out-of-order sequences
- unsupported payloads
- sources that appear valid but are not authenticated correctly

## What the current implementation does
The first version is intentionally simple and in-memory so the behavior is visible and testable before persistent storage and worker queues are introduced in later epics.

## What comes later
- persistent idempotency storage
- queue consumer concurrency controls
- explicit retry policy for transient downstream failures
- dead-letter reprocessing workflow
- richer backlog replay suppression for alerting
