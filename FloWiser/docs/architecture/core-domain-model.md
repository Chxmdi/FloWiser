# Core Domain Model

FloWiser models energy operations in this hierarchy:

`Tenant -> Branch -> Site -> Asset -> Device`

## Definitions
- **Tenant**: the customer organization
- **Branch**: an operating business unit
- **Site**: a physical location
- **Asset**: equipment or circuit being monitored
- **Device**: meter, gateway, sensor, or controller providing telemetry

## Why this matters
Every telemetry event must eventually resolve to a tenant, branch, site, and device context so later epics can compute state, issues, and optimization actions.
