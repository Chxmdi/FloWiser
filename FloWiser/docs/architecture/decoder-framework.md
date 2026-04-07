# Decoder Framework

Epic 2 introduces a registry-based decoder layer.

## Responsibilities
- select the correct decoder using a hint or payload shape
- validate raw payloads with decoder-specific schemas
- normalize metrics, timestamps, and status fields
- archive the raw event before parse outcome is known
- mark archive records as success or failure
- expose decoder audit details for debugging

## Included adapters
- `acme-three-phase-v1`
- `satec-pm130-v2`
- `gateway-forwarded-acme-v1`

## Fallback behavior
If no decoder can handle a payload, FloWiser raises an unsupported payload error and records the failure against the archived raw event.

## Replay and debugging
The `GET /raw-events/:rawEventId` route lets engineers inspect the archived raw payload, decoder hint, parse status, and normalized event link after a decode preview call.
