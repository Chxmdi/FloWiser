import type { Asset, Branch, Device, DeviceAssetBinding, Site, Tenant } from "./registry.types.js";

export class InMemoryRegistryStore {
  readonly tenants = new Map<string, Tenant>();
  readonly branches = new Map<string, Branch>();
  readonly sites = new Map<string, Site>();
  readonly assets = new Map<string, Asset>();
  readonly devices = new Map<string, Device>();
  readonly bindings = new Map<string, DeviceAssetBinding>();
}
