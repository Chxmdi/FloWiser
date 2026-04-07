export type Tenant = {
  id: string;
  name: string;
  code?: string;
  country?: string;
  timezone?: string;
  createdAt: string;
  updatedAt: string;
};

export type Branch = {
  id: string;
  tenantId: string;
  name: string;
  region?: string;
  branchType?: string;
  createdAt: string;
  updatedAt: string;
};

export type Site = {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  siteType?: string;
  location?: string;
  timezone?: string;
  criticality?: string;
  createdAt: string;
  updatedAt: string;
};

export type Asset = {
  id: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  name: string;
  assetCategory: string;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type Device = {
  id: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  name: string;
  deviceType: string;
  vendor?: string;
  model?: string;
  firmwareVersion?: string;
  connectivityProtocol?: string;
  lifecycleState: string;
  createdAt: string;
  updatedAt: string;
};

export type DeviceAssetBinding = {
  id: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  deviceId: string;
  assetId: string;
  effectiveFrom: string;
  endedAt?: string;
  status: "active" | "inactive";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type RegistrySnapshot = {
  tenants: Tenant[];
  branches: Branch[];
  sites: Site[];
  assets: Asset[];
  devices: Device[];
  bindings: DeviceAssetBinding[];
};
