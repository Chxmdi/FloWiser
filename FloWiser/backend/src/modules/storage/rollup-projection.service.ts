import type { CanonicalTelemetryEvent } from "@flowiser/schemas";
import { getBucketStart, type RollupGranularity } from "./rollup-buckets.js";
import type { RollupRepository } from "./rollup.repository.js";

const granularities: RollupGranularity[] = ["1m", "5m", "1h", "1d"];

export class RollupProjectionService {
  constructor(private readonly repository: RollupRepository) {}

  async project(event: CanonicalTelemetryEvent) {
    if (event.metrics.kw === undefined) {
      return;
    }

    for (const granularity of granularities) {
      await this.repository.upsert(granularity, {
        deviceId: event.deviceId,
        tenantId: event.tenantId,
        branchId: event.branchId,
        siteId: event.siteId,
        bucketStart: getBucketStart(event.meterTimestamp, granularity),
        sampleCount: 1,
        sumKw: event.metrics.kw,
        minKw: event.metrics.kw,
        maxKw: event.metrics.kw,
        lastKw: event.metrics.kw,
        firstMeterTimestamp: event.meterTimestamp,
        lastMeterTimestamp: event.meterTimestamp
      });
    }
  }
}
