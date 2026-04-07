# Ingestion Flow and Processing Rules

Epic 2 delivers the telemetry contract layer that sits between raw device payloads and later platform logic.

## Current flow
1. Operator or test harness sends a decode-preview request
2. Raw payload is archived immediately
3. Decoder registry resolves the best adapter
4. Adapter validates the vendor-specific payload
5. Adapter normalizes metrics, timestamps, and status fields
6. Canonical event is validated against the shared schema package
7. Archive record is marked as success or failure
8. Raw event can be fetched again for replay and debugging

## Design rule
Never let raw meter payload shapes leak directly into application code. All downstream systems should depend on the shared canonical event contract.
