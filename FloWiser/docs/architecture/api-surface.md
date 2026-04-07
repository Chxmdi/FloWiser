# API Surface

FloWiser keeps the early API deliberately thin and developer-friendly.

## Current routes
- `GET /` — foundation alive message
- `GET /health` — health payload for CI and platform checks
- `GET /telemetry/decoders` — list supported decoder adapters
- `POST /telemetry/decode-preview` — validate and normalize a raw telemetry payload
- `GET /raw-events/:rawEventId` — inspect an archived raw payload and parse outcome
- `POST /ingestion/process` — process a transport envelope through source validation, dedupe, decoding, and ordering checks
- `GET /ingestion/dead-letter` — list dead-letter entries produced by ingestion
- `GET /ingestion/dead-letter/:entryId` — inspect a specific dead-letter entry

## Near-term route map
- `GET /branches`
- `GET /branches/:branchId`
- `GET /sites/:siteId`
- `GET /alerts`
- `POST /devices/register`

## API principles
- resource-oriented routes
- explicit versioning when the first external contract is published
- tenant scope enforced before business logic
- errors returned in a stable envelope
- raw payload inspection available for decoder debugging
- ingestion responses always return a trace id for operator triage
