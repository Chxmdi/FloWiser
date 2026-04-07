import type { RollupGranularity } from "./rollup-buckets.js";

export type TelemetryRollupRecord = {
  deviceId: string;
  tenantId: string;
  branchId: string;
  siteId: string;
  bucketStart: string;
  sampleCount: number;
  sumKw: number;
  minKw: number;
  maxKw: number;
  lastKw: number;
  firstMeterTimestamp: string;
  lastMeterTimestamp: string;
};

export interface RollupRepository {
  upsert(granularity: RollupGranularity, record: TelemetryRollupRecord): Promise<void>;
}
