# Ingestion Flow and Processing Rules

## Phase 1 intent
We are not fully implementing ingestion in Epic 1. We are preparing the repo so ingestion can be added without restructuring the platform later.

## Target flow
1. Meter or gateway publishes telemetry
2. Ingestion service receives payload
3. Decoder normalizes payload
4. Event is validated and enriched with site context
5. Raw payload is archived
6. Normalized telemetry is persisted
7. State and metric engines consume the normalized stream

## Design rule
Never let raw meter payload shapes leak directly into application code. All downstream systems should depend on a canonical event contract.
