# Registry and Binding Workflows

Epic 4 introduces the first real operational model for customer hierarchy and equipment registry.

## Supported workflows
1. Create tenant
2. Create one or more branches for that tenant
3. Create sites under each branch
4. Register assets and devices at the site level
5. Bind a device to an asset
6. Remap a device to a new asset while preserving the old binding history
7. Unbind a device when it is retired or moved
8. Import a hierarchy payload in bulk during onboarding

## Validation rules
- a branch must belong to an existing tenant
- a site must belong to an existing branch and matching tenant
- an asset must belong to an existing site and matching branch/tenant
- a device must belong to an existing site and matching branch/tenant
- a device and asset can only be bound if they share the same tenant, branch, and site
- only one active binding is allowed per device
- only one active binding is allowed per asset

## Why time-bound bindings matter
Devices move in the field. If the product only stores the latest asset mapping, it loses the operational history needed to explain data changes, commissioning mistakes, and later analytics drift.
