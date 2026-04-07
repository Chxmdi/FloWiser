import { randomUUID } from "node:crypto";
import {
  assetCreateSchema,
  bindingCreateSchema,
  bindingRemapSchema,
  bindingUnbindSchema,
  branchCreateSchema,
  deviceCreateSchema,
  registryImportSchema,
  siteCreateSchema,
  tenantCreateSchema,
  type AssetCreateInput,
  type BindingCreateInput,
  type BindingRemapInput,
  type BindingUnbindInput,
  type BranchCreateInput,
  type DeviceCreateInput,
  type RegistryImportInput,
  type SiteCreateInput,
  type TenantCreateInput
} from "./registry.schemas.js";
import { RegistryError } from "./errors.js";
import { InMemoryRegistryStore } from "./in-memory-registry.store.js";
import type { Asset, Branch, Device, DeviceAssetBinding, RegistrySnapshot, Site, Tenant } from "./registry.types.js";

const now = () => new Date().toISOString();

export class RegistryService {
  constructor(private readonly store: InMemoryRegistryStore) {}

  private getTenantOrThrow(tenantId: string): Tenant {
    const tenant = this.store.tenants.get(tenantId);
    if (!tenant) {
      throw new RegistryError(`Tenant ${tenantId} was not found.`, 404);
    }
    return tenant;
  }

  private getBranchOrThrow(branchId: string): Branch {
    const branch = this.store.branches.get(branchId);
    if (!branch) {
      throw new RegistryError(`Branch ${branchId} was not found.`, 404);
    }
    return branch;
  }

  private getSiteOrThrow(siteId: string): Site {
    const site = this.store.sites.get(siteId);
    if (!site) {
      throw new RegistryError(`Site ${siteId} was not found.`, 404);
    }
    return site;
  }

  private getAssetOrThrow(assetId: string): Asset {
    const asset = this.store.assets.get(assetId);
    if (!asset) {
      throw new RegistryError(`Asset ${assetId} was not found.`, 404);
    }
    return asset;
  }

  private getDeviceOrThrow(deviceId: string): Device {
    const device = this.store.devices.get(deviceId);
    if (!device) {
      throw new RegistryError(`Device ${deviceId} was not found.`, 404);
    }
    return device;
  }

  private getBindingOrThrow(bindingId: string): DeviceAssetBinding {
    const binding = this.store.bindings.get(bindingId);
    if (!binding) {
      throw new RegistryError(`Binding ${bindingId} was not found.`, 404);
    }
    return binding;
  }

  createTenant(input: TenantCreateInput) {
    const parsed = tenantCreateSchema.parse(input);
    const id = parsed.id ?? randomUUID();

    if (this.store.tenants.has(id)) {
      throw new RegistryError(`Tenant ${id} already exists.`, 409);
    }

    const timestamp = now();
    const tenant: Tenant = { ...parsed, id, createdAt: timestamp, updatedAt: timestamp };
    this.store.tenants.set(id, tenant);
    return tenant;
  }

  listTenants() {
    return [...this.store.tenants.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  createBranch(input: BranchCreateInput) {
    const parsed = branchCreateSchema.parse(input);
    this.getTenantOrThrow(parsed.tenantId);
    const id = parsed.id ?? randomUUID();

    if (this.store.branches.has(id)) {
      throw new RegistryError(`Branch ${id} already exists.`, 409);
    }

    const timestamp = now();
    const branch: Branch = { ...parsed, id, createdAt: timestamp, updatedAt: timestamp };
    this.store.branches.set(id, branch);
    return branch;
  }

  listBranches(filter?: { tenantId?: string }) {
    return [...this.store.branches.values()].filter((branch) =>
      filter?.tenantId ? branch.tenantId === filter.tenantId : true
    );
  }

  createSite(input: SiteCreateInput) {
    const parsed = siteCreateSchema.parse(input);
    this.getTenantOrThrow(parsed.tenantId);
    const branch = this.getBranchOrThrow(parsed.branchId);

    if (branch.tenantId !== parsed.tenantId) {
      throw new RegistryError("Site tenantId does not match branch tenantId.", 409);
    }

    const id = parsed.id ?? randomUUID();
    if (this.store.sites.has(id)) {
      throw new RegistryError(`Site ${id} already exists.`, 409);
    }

    const timestamp = now();
    const site: Site = { ...parsed, id, createdAt: timestamp, updatedAt: timestamp };
    this.store.sites.set(id, site);
    return site;
  }

  listSites(filter?: { tenantId?: string; branchId?: string }) {
    return [...this.store.sites.values()].filter((site) =>
      (filter?.tenantId ? site.tenantId === filter.tenantId : true) &&
      (filter?.branchId ? site.branchId === filter.branchId : true)
    );
  }

  createAsset(input: AssetCreateInput) {
    const parsed = assetCreateSchema.parse(input);
    this.getTenantOrThrow(parsed.tenantId);
    const branch = this.getBranchOrThrow(parsed.branchId);
    const site = this.getSiteOrThrow(parsed.siteId);

    if (branch.tenantId !== parsed.tenantId || site.tenantId !== parsed.tenantId || site.branchId !== parsed.branchId) {
      throw new RegistryError("Asset hierarchy is inconsistent with tenant/branch/site ownership.", 409);
    }

    const id = parsed.id ?? randomUUID();
    if (this.store.assets.has(id)) {
      throw new RegistryError(`Asset ${id} already exists.`, 409);
    }

    const timestamp = now();
    const asset: Asset = { ...parsed, id, createdAt: timestamp, updatedAt: timestamp };
    this.store.assets.set(id, asset);
    return asset;
  }

  listAssets(filter?: { tenantId?: string; branchId?: string; siteId?: string }) {
    return [...this.store.assets.values()].filter((asset) =>
      (filter?.tenantId ? asset.tenantId === filter.tenantId : true) &&
      (filter?.branchId ? asset.branchId === filter.branchId : true) &&
      (filter?.siteId ? asset.siteId === filter.siteId : true)
    );
  }

  createDevice(input: DeviceCreateInput) {
    const parsed = deviceCreateSchema.parse(input);
    this.getTenantOrThrow(parsed.tenantId);
    const branch = this.getBranchOrThrow(parsed.branchId);
    const site = this.getSiteOrThrow(parsed.siteId);

    if (branch.tenantId !== parsed.tenantId || site.tenantId !== parsed.tenantId || site.branchId !== parsed.branchId) {
      throw new RegistryError("Device hierarchy is inconsistent with tenant/branch/site ownership.", 409);
    }

    const id = parsed.id ?? randomUUID();
    if (this.store.devices.has(id)) {
      throw new RegistryError(`Device ${id} already exists.`, 409);
    }

    const timestamp = now();
    const device: Device = { ...parsed, id, createdAt: timestamp, updatedAt: timestamp };
    this.store.devices.set(id, device);
    return device;
  }

  listDevices(filter?: { tenantId?: string; branchId?: string; siteId?: string }) {
    return [...this.store.devices.values()].filter((device) =>
      (filter?.tenantId ? device.tenantId === filter.tenantId : true) &&
      (filter?.branchId ? device.branchId === filter.branchId : true) &&
      (filter?.siteId ? device.siteId === filter.siteId : true)
    );
  }

  listBindings(filter?: { tenantId?: string; branchId?: string; siteId?: string; deviceId?: string; activeOnly?: boolean }) {
    return [...this.store.bindings.values()].filter((binding) =>
      (filter?.tenantId ? binding.tenantId === filter.tenantId : true) &&
      (filter?.branchId ? binding.branchId === filter.branchId : true) &&
      (filter?.siteId ? binding.siteId === filter.siteId : true) &&
      (filter?.deviceId ? binding.deviceId === filter.deviceId : true) &&
      (filter?.activeOnly ? binding.status === "active" : true)
    );
  }

  bindDeviceToAsset(input: BindingCreateInput) {
    const parsed = bindingCreateSchema.parse(input);
    const device = this.getDeviceOrThrow(parsed.deviceId);
    const asset = this.getAssetOrThrow(parsed.assetId);

    if (device.tenantId !== asset.tenantId || device.branchId !== asset.branchId || device.siteId !== asset.siteId) {
      throw new RegistryError("Device and asset must belong to the same tenant, branch, and site.", 409);
    }

    const activeDeviceBinding = this.listBindings({ deviceId: device.id, activeOnly: true })[0];
    if (activeDeviceBinding) {
      throw new RegistryError(`Device ${device.id} already has an active asset binding.`, 409);
    }

    const activeAssetBinding = this.listBindings({ siteId: asset.siteId, activeOnly: true }).find((binding) => binding.assetId === asset.id);
    if (activeAssetBinding) {
      throw new RegistryError(`Asset ${asset.id} already has an active device binding.`, 409);
    }

    const timestamp = now();
    const binding: DeviceAssetBinding = {
      id: randomUUID(),
      tenantId: device.tenantId,
      branchId: device.branchId,
      siteId: device.siteId,
      deviceId: device.id,
      assetId: asset.id,
      effectiveFrom: parsed.effectiveFrom ?? timestamp,
      status: "active",
      notes: parsed.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    this.store.bindings.set(binding.id, binding);
    return binding;
  }

  remapBinding(bindingId: string, input: BindingRemapInput) {
    const parsed = bindingRemapSchema.parse(input);
    const currentBinding = this.getBindingOrThrow(bindingId);

    if (currentBinding.status !== "active") {
      throw new RegistryError(`Binding ${bindingId} is not active and cannot be remapped.`, 409);
    }

    const endingTimestamp = parsed.effectiveFrom ?? now();
    this.store.bindings.set(bindingId, {
      ...currentBinding,
      endedAt: endingTimestamp,
      status: "inactive",
      updatedAt: endingTimestamp,
      notes: parsed.notes ?? currentBinding.notes
    });

    return this.bindDeviceToAsset({
      deviceId: currentBinding.deviceId,
      assetId: parsed.assetId,
      effectiveFrom: endingTimestamp,
      notes: parsed.notes
    });
  }

  unbindBinding(bindingId: string, input?: BindingUnbindInput) {
    const parsed = bindingUnbindSchema.parse(input ?? {});
    const currentBinding = this.getBindingOrThrow(bindingId);

    if (currentBinding.status !== "active") {
      throw new RegistryError(`Binding ${bindingId} is already inactive.`, 409);
    }

    const endedAt = parsed.endedAt ?? now();
    const updated: DeviceAssetBinding = {
      ...currentBinding,
      endedAt,
      status: "inactive",
      updatedAt: endedAt,
      notes: parsed.notes ?? currentBinding.notes
    };

    this.store.bindings.set(bindingId, updated);
    return updated;
  }

  importHierarchy(input: RegistryImportInput) {
    const parsed = registryImportSchema.parse(input);
    return {
      tenants: parsed.tenants.map((entry) => this.createTenant(entry)),
      branches: parsed.branches.map((entry) => this.createBranch(entry)),
      sites: parsed.sites.map((entry) => this.createSite(entry)),
      assets: parsed.assets.map((entry) => this.createAsset(entry)),
      devices: parsed.devices.map((entry) => this.createDevice(entry))
    };
  }

  snapshot(): RegistrySnapshot {
    return {
      tenants: this.listTenants(),
      branches: this.listBranches(),
      sites: this.listSites(),
      assets: this.listAssets(),
      devices: this.listDevices(),
      bindings: this.listBindings()
    };
  }
}
