# Ingestion Flow and Processing Rules

Epic 5 makes the earlier ingestion work durable.

## Current flow
1. A trusted source sends an ingestion envelope
2. Source authentication is validated
3. Transport idempotency is checked using the transport message id and payload fingerprint
4. The raw payload is archived and decoded into the canonical contract
5. Canonical idempotency is checked using device id, meter timestamp, and sequence number
6. Ordering and replay checks run against the device's last known sequence and meter timestamp
7. The processed raw event and canonical telemetry event are persisted when `DATABASE_URL` is configured
8. Device, site, and branch state projections are updated
9. Telemetry rollups are updated for 1-minute, 5-minute, hourly, and daily buckets
10. Operators can inspect archived raw events and normalized telemetry through API routes

## Reliability checks included now
- duplicate transport detection
- duplicate canonical detection
- sequence gap detection
- out-of-order detection
- late-arrival detection
- replay backlog detection
- dead-letter routing for invalid source auth and decode failures

## Design rule
Never allow a transport-specific payload shape to bypass the canonical event contract before it reaches downstream platform logic.
