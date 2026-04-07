# API Surface

Phase 1 keeps the API deliberately thin.

## Initial routes
- `GET /` — foundation alive message
- `GET /health` — health payload for CI and platform checks

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
