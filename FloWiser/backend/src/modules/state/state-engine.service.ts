import type {
  BranchStateRecord,
  CurrentStateRepository,
  DeviceStateRecord,
  SiteStateRecord
} from "../storage/current-state.repository.js";

export type FreshnessStatus = "fresh" | "delayed" | "stale" | "offline";

export type EnrichedDeviceState = DeviceStateRecord & {
  freshnessStatus: FreshnessStatus;
  connectivityConfidence: number;
};

export type EnrichedSiteState = SiteStateRecord & {
  freshnessStatus: FreshnessStatus;
  connectivityConfidence: number;
};

export type EnrichedBranchState = BranchStateRecord & {
  freshnessStatus: FreshnessStatus;
  connectivityConfidence: number;
};

const toMillis = (value: string) => new Date(value).getTime();

const calculateFreshness = (isOnline: boolean, lastReceivedAt: string): FreshnessStatus => {
  if (!isOnline) {
    return "offline";
  }

  const ageMs = Date.now() - toMillis(lastReceivedAt);

  if (ageMs <= 5 * 60 * 1000) {
    return "fresh";
  }

  if (ageMs <= 15 * 60 * 1000) {
    return "delayed";
  }

  return "stale";
};

const calculateConnectivityConfidence = (
  freshnessStatus: FreshnessStatus,
  qualityScore: number,
  isOnline: boolean
) => {
  if (!isOnline) {
    return 15;
  }

  if (freshnessStatus === "fresh") {
    return Math.round(qualityScore * 0.9 + 10);
  }

  if (freshnessStatus === "delayed") {
    return Math.round(qualityScore * 0.65);
  }

  return Math.round(qualityScore * 0.4);
};

export class StateEngineService {
  constructor(private readonly repository: CurrentStateRepository) {}

  async getDeviceState(deviceId: string): Promise<EnrichedDeviceState | undefined> {
    const record = await this.repository.getDeviceState(deviceId);

    if (!record) {
      return undefined;
    }

    const freshnessStatus = calculateFreshness(record.isOnline, record.lastReceivedAt);
    const connectivityConfidence = calculateConnectivityConfidence(
      freshnessStatus,
      record.qualityScore,
      record.isOnline
    );

    return {
      ...record,
      freshnessStatus,
      connectivityConfidence
    };
  }

  async getSiteState(siteId: string): Promise<EnrichedSiteState | undefined> {
    const record = await this.repository.getSiteState(siteId);

    if (!record) {
      return undefined;
    }

    const freshnessStatus = calculateFreshness(record.isOnline, record.lastReceivedAt);
    const connectivityConfidence = calculateConnectivityConfidence(
      freshnessStatus,
      record.qualityScore,
      record.isOnline
    );

    return {
      ...record,
      freshnessStatus,
      connectivityConfidence
    };
  }

  async getBranchState(branchId: string): Promise<EnrichedBranchState | undefined> {
    const record = await this.repository.getBranchState(branchId);

    if (!record) {
      return undefined;
    }

    const freshnessStatus = calculateFreshness(record.isOnline, record.lastReceivedAt);
    const connectivityConfidence = calculateConnectivityConfidence(
      freshnessStatus,
      record.qualityScore,
      record.isOnline
    );

    return {
      ...record,
      freshnessStatus,
      connectivityConfidence
    };
  }
}
