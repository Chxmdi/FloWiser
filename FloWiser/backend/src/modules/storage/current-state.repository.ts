export type DeviceStateProjection = {
  deviceId: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  latestEventId: string;
  latestRawEventId: string;
  latestTelemetryAt: string;
  lastReceivedAt: string;
  isOnline: boolean;
  generatorRunning?: boolean;
  gridAvailable?: boolean;
  healthScore: number;
};

export type SiteStateProjection = {
  siteId: string;
  tenantId: string;
  branchId: string;
  latestEventId: string;
  latestTelemetryAt: string;
  lastReceivedAt: string;
  isOnline: boolean;
  generatorRunning?: boolean;
  gridAvailable?: boolean;
  healthScore: number;
};

export type BranchStateProjection = {
  branchId: string;
  tenantId: string;
  latestEventId: string;
  latestTelemetryAt: string;
  lastReceivedAt: string;
  isOnline: boolean;
  generatorRunning?: boolean;
  gridAvailable?: boolean;
  healthScore: number;
};

export interface CurrentStateRepository {
  upsertDeviceState(projection: DeviceStateProjection): Promise<void>;
  upsertSiteState(projection: SiteStateProjection): Promise<void>;
  upsertBranchState(projection: BranchStateProjection): Promise<void>;
}
