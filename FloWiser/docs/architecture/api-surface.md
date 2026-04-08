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
- `POST /ingestion/process` — process a transport envelope through source validation, dedupe, decoding, ordering checks, persistence, rules evaluation, recommendation generation, and alert generation
- `GET /ingestion/dead-letter` — list dead-letter entries produced by ingestion
- `GET /ingestion/dead-letter/:entryId` — inspect a specific dead-letter entry
- `GET /registry/snapshot` — inspect current registry entities and bindings
- registry CRUD and bind/remap/unbind routes
- `GET /quality/metrics` — inspect aggregate telemetry quality metrics
- `POST /quality/re-evaluate/:eventId` — recompute quality for a persisted telemetry event
- `GET /state/devices/:deviceId` — inspect device state, freshness, and connectivity confidence
- `GET /state/sites/:siteId` — inspect site state, freshness, and connectivity confidence
- `GET /state/branches/:branchId` — inspect branch state, freshness, and connectivity confidence
- `GET /alerts` — list active and historical alerts
- `GET /alerts/:alertId` — inspect a specific alert
- `GET /issues` — list issues
- `GET /issues/:issueId` — inspect an issue and its comments
- `POST /issues/:issueId/assign` — assign an issue owner
- `POST /issues/:issueId/acknowledge` — acknowledge an issue
- `POST /issues/:issueId/investigate` — move an issue into investigation
- `POST /issues/:issueId/resolve` — resolve an issue
- `POST /issues/:issueId/close` — close an issue
- `POST /issues/:issueId/comments` — add issue comments
- `GET /field/checklists`, `POST /field/checklists`, `POST /field/checklists/:checklistId/complete`
- `GET /field/tasks`, `POST /field/tasks`, `POST /field/tasks/:taskId/complete`, `POST /field/tasks/:taskId/rollback-note`
- `GET /field/site-visits`, `POST /field/site-visits`
- `GET /rules` — list persisted rule configs
- `GET /rules/:ruleId` — inspect one rule config
- `PATCH /rules/:ruleId` — enable/disable or retune a rule
- `GET /rules/traces` — inspect rule execution traces
- `GET /recommendations` — list recommendations
- `GET /recommendations/top-actions` — list highest-priority active recommendations
- `GET /recommendations/:actionId` — inspect one recommendation
- `POST /recommendations/:actionId/approve` — approve an approval-gated action
- `POST /recommendations/:actionId/reject` — reject an action
- `POST /recommendations/:actionId/resolve` — mark an action resolved after follow-through
- `GET /dashboard/overview` — operator overview KPIs, alerts, recommendations, and branch health summary
- `GET /dashboard/branches` — branch portfolio table
- `GET /dashboard/branches/:branchId` — branch detail experience payload
- `GET /dashboard/sites/:siteId` — site cockpit experience payload
- `GET /dashboard/executive` — executive portfolio summary and opportunities
- `GET /controls/policies` — list control approval policies
- `GET /controls/policies/:policyId` — inspect one control policy
- `PATCH /controls/policies/:policyId` — retune execution guardrails
- `GET /controls/executions` — list execution requests
- `GET /controls/executions/:executionId` — inspect one execution request and its approvals
- `POST /controls/executions` — create a dry-run or execution request for a recommendation
- `POST /controls/executions/:executionId/approvals` — add an execution-specific approval
- `POST /controls/executions/:executionId/complete` — mark a ready execution as executed or failed

## API principles
- resource-oriented routes
- explicit versioning once the first external contract is published
- tenant scope enforced before business logic
- errors returned in a stable envelope
- raw payload inspection available for decoder debugging
- ingestion responses always return a trace id for operator triage
- registry writes must validate tenant, branch, and site ownership before data is accepted
- persistent workflow, rules, recommendation, dashboard, and control routes return `501` until `DATABASE_URL` is configured
