import type { Pool } from "pg";
import type {
  BranchStateProjection,
  CurrentStateRepository,
  DeviceStateProjection,
  SiteStateProjection
} from "./current-state.repository.js";

export class PostgresCurrentStateRepository implements CurrentStateRepository {
  constructor(private readonly pool: Pool) {}

  async upsertDeviceState(projection: DeviceStateProjection) {
    await this.pool.query(
      `
        INSERT INTO device_state (
          device_id,
          tenant_id,
          branch_id,
          site_id,
          latest_event_id,
          latest_raw_event_id,
          latest_telemetry_at,
          last_received_at,
          is_online,
          generator_running,
          grid_available,
          health_score,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
        )
        ON CONFLICT (device_id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          branch_id = EXCLUDED.branch_id,
          site_id = EXCLUDED.site_id,
          latest_event_id = EXCLUDED.latest_event_id,
          latest_raw_event_id = EXCLUDED.latest_raw_event_id,
          latest_telemetry_at = EXCLUDED.latest_telemetry_at,
          last_received_at = EXCLUDED.last_received_at,
          is_online = EXCLUDED.is_online,
          generator_running = EXCLUDED.generator_running,
          grid_available = EXCLUDED.grid_available,
          health_score = EXCLUDED.health_score,
          updated_at = NOW();
      `,
      [
        projection.deviceId,
        projection.tenantId,
        projection.branchId,
        projection.siteId,
        projection.latestEventId,
        projection.latestRawEventId,
        projection.latestTelemetryAt,
        projection.lastReceivedAt,
        projection.isOnline,
        projection.generatorRunning ?? null,
        projection.gridAvailable ?? null,
        projection.healthScore
      ]
    );
  }

  async upsertSiteState(projection: SiteStateProjection) {
    await this.pool.query(
      `
        INSERT INTO site_state (
          site_id,
          tenant_id,
          branch_id,
          latest_event_id,
          latest_telemetry_at,
          last_received_at,
          is_online,
          generator_running,
          grid_available,
          health_score,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        ON CONFLICT (site_id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          branch_id = EXCLUDED.branch_id,
          latest_event_id = EXCLUDED.latest_event_id,
          latest_telemetry_at = EXCLUDED.latest_telemetry_at,
          last_received_at = EXCLUDED.last_received_at,
          is_online = EXCLUDED.is_online,
          generator_running = EXCLUDED.generator_running,
          grid_available = EXCLUDED.grid_available,
          health_score = EXCLUDED.health_score,
          updated_at = NOW();
      `,
      [
        projection.siteId,
        projection.tenantId,
        projection.branchId,
        projection.latestEventId,
        projection.latestTelemetryAt,
        projection.lastReceivedAt,
        projection.isOnline,
        projection.generatorRunning ?? null,
        projection.gridAvailable ?? null,
        projection.healthScore
      ]
    );
  }

  async upsertBranchState(projection: BranchStateProjection) {
    await this.pool.query(
      `
        INSERT INTO branch_state (
          branch_id,
          tenant_id,
          latest_event_id,
          latest_telemetry_at,
          last_received_at,
          is_online,
          generator_running,
          grid_available,
          health_score,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
        )
        ON CONFLICT (branch_id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          latest_event_id = EXCLUDED.latest_event_id,
          latest_telemetry_at = EXCLUDED.latest_telemetry_at,
          last_received_at = EXCLUDED.last_received_at,
          is_online = EXCLUDED.is_online,
          generator_running = EXCLUDED.generator_running,
          grid_available = EXCLUDED.grid_available,
          health_score = EXCLUDED.health_score,
          updated_at = NOW();
      `,
      [
        projection.branchId,
        projection.tenantId,
        projection.latestEventId,
        projection.latestTelemetryAt,
        projection.lastReceivedAt,
        projection.isOnline,
        projection.generatorRunning ?? null,
        projection.gridAvailable ?? null,
        projection.healthScore
      ]
    );
  }
}
