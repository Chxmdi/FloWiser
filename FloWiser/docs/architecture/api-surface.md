# API Surface

FloWiser keeps the early API deliberately thin and developer-friendly.

## Current routes
- `GET /` — foundation alive message
- `GET /health` — health payload for CI and platform checks
- `GET /telemetry/decoders` — list supported decoder adapters
- `GET /telemetry/events` — query persisted normalized telemetry events by event id, device id, time range, and quality filters
- `POST /telemetry/decode-preview` — validate, normalize, and quality-check a raw telemetry payload
- `GET /raw-events/:rawEventId` — inspect an archived raw payload and parse outcome
- `GET /raw-events` — query persisted raw events by device id and time range
- `POST /ingestion/process` — process a transport envelope through source validation, dedupe, decoding, ordering checks, and persistence
- `GET /ingestion/dead-letter` — list dead-letter entries produced by ingestion
- `GET /ingestion/dead-letter/:entryId` — inspect a specific dead-letter entry
- `GET /registry/snapshot` — inspect current registry entities and bindings
- registry CRUD and bind/remap/unbind routes
- `GET /quality/metrics` — inspect aggregate telemetry quality metrics
- `POST /quality/re-evaluate/:eventId` — recompute quality for a persisted telemetry event
- `GET /state/devices/:deviceId` — inspect device state, freshness, and connectivity confidence
- `GET /state/sites/:siteId` — inspect site state, freshness, and connectivity confidence
- `GET /state/branches/:branchId` — inspect branch state, freshness, and connectivity confidence

## API principles
- resource-oriented routes
- explicit versioning once the first external contract is published
- tenant scope enforced before business logic
- errors returned in a stable envelope
- raw payload inspection available for decoder debugging
- ingestion responses always return a trace id for operator triage
- registry writes must validate tenant, branch, and site ownership before data is accepted
- persistent query routes return `501` until `DATABASE_URL` is configured
