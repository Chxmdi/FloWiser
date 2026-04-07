# MQTT Topic and Payload Design

## Topic shape
`tenant/{tenantId}/site/{siteId}/device/{deviceId}/telemetry`

## Why this shape
- keeps tenant isolation visible
- lets platform operators route by site and device
- stays readable during debugging
- avoids hidden context in payload-only processing

## Payload baseline
Every inbound telemetry payload should eventually normalize to:
- event id
- tenant id
- site id
- device id
- source timestamp
- received timestamp
- metrics object
- status object
- schema version
