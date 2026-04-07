# Canonical Event Contract

Epic 2 establishes one internal telemetry contract for all downstream processing.

## Purpose
Raw meter payloads vary by vendor and protocol. Downstream services should not depend on those raw shapes directly.

## Canonical event fields
- event id
- raw event id
- schema version
- received timestamp
- meter timestamp
- tenant id
- branch id
- site id
- device id
- source protocol
- source topic
- decoder id and decoder version
- optional sequence number
- canonical metrics object
- status object
- quality placeholder object

## Canonical metric names
- `kw`
- `kwhTotal`
- `voltageL1`
- `voltageL2`
- `voltageL3`
- `currentL1`
- `currentL2`
- `currentL3`
- `frequency`
- `powerFactor`

## Quality placeholder design
Epic 2 only seeds the quality object with a neutral default. Later epics will compute flags and scores from telemetry-quality rules.
