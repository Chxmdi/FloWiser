# Core Domain Model

FloWiser models energy operations in this hierarchy:

`Tenant -> Branch -> Site -> Asset -> Device`

## Definitions
- **Tenant**: the customer organization
- **Branch**: an operating business unit
- **Site**: a physical location
- **Asset**: equipment or circuit being monitored
- **Device**: meter, gateway, sensor, or controller providing telemetry
- **DeviceAssetBinding**: the time-bound mapping between a device and the asset it is currently attached to

## Why this matters
Every telemetry event must eventually resolve to a tenant, branch, site, and device context so later epics can compute state, issues, and optimization actions.

## Epic 4 additions
The registry model now supports:
- explicit tenant, branch, site, asset, and device creation
- hierarchy validation across all create flows
- time-bound bind, remap, and unbind operations
- bulk hierarchy import for onboarding workflows
