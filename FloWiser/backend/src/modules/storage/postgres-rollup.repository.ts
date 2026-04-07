import type { Pool } from "pg";
import type { RollupGranularity } from "./rollup-buckets.js";
import type { RollupRepository, TelemetryRollupRecord } from "./rollup.repository.js";

const tableMap: Record<RollupGranularity, string> = {
  "1m": "telemetry_rollup_1m",
  "5m": "telemetry_rollup_5m",
  "1h": "telemetry_rollup_1h",
  "1d": "telemetry_rollup_1d"
};

export class PostgresRollupRepository implements RollupRepository {
  constructor(private readonly pool: Pool) {}

  async upsert(granularity: RollupGranularity, record: TelemetryRollupRecord) {
    const tableName = tableMap[granularity];
    const query = `
      INSERT INTO ${tableName} (
        device_id,
        tenant_id,
        branch_id,
        site_id,
        bucket_start,
        sample_count,
        sum_kw,
        min_kw,
        max_kw,
        last_kw,
        first_meter_timestamp,
        last_meter_timestamp,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
      )
      ON CONFLICT (device_id, bucket_start) DO UPDATE SET
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id,
        site_id = EXCLUDED.site_id,
        sample_count = ${tableName}.sample_count + EXCLUDED.sample_count,
        sum_kw = ${tableName}.sum_kw + EXCLUDED.sum_kw,
        min_kw = LEAST(${tableName}.min_kw, EXCLUDED.min_kw),
        max_kw = GREATEST(${tableName}.max_kw, EXCLUDED.max_kw),
        last_kw = EXCLUDED.last_kw,
        first_meter_timestamp = LEAST(${tableName}.first_meter_timestamp, EXCLUDED.first_meter_timestamp),
        last_meter_timestamp = GREATEST(${tableName}.last_meter_timestamp, EXCLUDED.last_meter_timestamp),
        updated_at = NOW();
    `;

    await this.pool.query(query, [
      record.deviceId,
      record.tenantId,
      record.branchId,
      record.siteId,
      record.bucketStart,
      record.sampleCount,
      record.sumKw,
      record.minKw,
      record.maxKw,
      record.lastKw,
      record.firstMeterTimestamp,
      record.lastMeterTimestamp
    ]);
  }
}
