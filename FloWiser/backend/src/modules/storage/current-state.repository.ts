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
  qualityStatus: "unknown" | "good" | "suspicious" | "bad";
  qualityScore: number;
  qualityFlagsCount: number;
  openIssueCount: number;
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
  qualityStatus: "unknown" | "good" | "suspicious" | "bad";
  qualityScore: number;
  qualityFlagsCount: number;
  openIssueCount: number;
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
  qualityStatus: "unknown" | "good" | "suspicious" | "bad";
  qualityScore: number;
  qualityFlagsCount: number;
  openIssueCount: number;
};

export type DeviceStateRecord = DeviceStateProjection & {
  updatedAt: string;
};

export type SiteStateRecord = SiteStateProjection & {
  updatedAt: string;
};

export type BranchStateRecord = BranchStateProjection & {
  updatedAt: string;
};

export interface CurrentStateRepository {
  upsertDeviceState(projection: DeviceStateProjection): Promise<void>;
  upsertSiteState(projection: SiteStateProjection): Promise<void>;
  upsertBranchState(projection: BranchStateProjection): Promise<void>;
  getDeviceState(deviceId: string): Promise<DeviceStateRecord | undefined>;
  getSiteState(siteId: string): Promise<SiteStateRecord | undefined>;
  getBranchState(branchId: string): Promise<BranchStateRecord | undefined>;
}
