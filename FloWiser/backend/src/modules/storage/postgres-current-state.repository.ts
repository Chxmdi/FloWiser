import type { Pool } from "pg";
import type {
  BranchStateProjection,
  BranchStateRecord,
  CurrentStateRepository,
  DeviceStateProjection,
  DeviceStateRecord,
  SiteStateProjection,
  SiteStateRecord
} from "./current-state.repository.js";

const mapDevice = (row: Record<string, unknown>): DeviceStateRecord => ({
  deviceId: row.device_id as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  latestEventId: row.latest_event_id as string,
  latestRawEventId: row.latest_raw_event_id as string,
  latestTelemetryAt: row.latest_telemetry_at as string,
  lastReceivedAt: row.last_received_at as string,
  isOnline: row.is_online as boolean,
  generatorRunning: (row.generator_running as boolean | null) ?? undefined,
  gridAvailable: (row.grid_available as boolean | null) ?? undefined,
  healthScore: row.health_score as number,
  qualityStatus: row.quality_status as DeviceStateRecord["qualityStatus"],
  qualityScore: row.quality_score as number,
  qualityFlagsCount: row.quality_flags_count as number,
  openIssueCount: row.open_issue_count as number,
  updatedAt: row.updated_at as string
});

const mapSite = (row: Record<string, unknown>): SiteStateRecord => ({
  siteId: row.site_id as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  latestEventId: row.latest_event_id as string,
  latestTelemetryAt: row.latest_telemetry_at as string,
  lastReceivedAt: row.last_received_at as string,
  isOnline: row.is_online as boolean,
  generatorRunning: (row.generator_running as boolean | null) ?? undefined,
  gridAvailable: (row.grid_available as boolean | null) ?? undefined,
  healthScore: row.health_score as number,
  qualityStatus: row.quality_status as SiteStateRecord["qualityStatus"],
  qualityScore: row.quality_score as number,
  qualityFlagsCount: row.quality_flags_count as number,
  openIssueCount: row.open_issue_count as number,
  updatedAt: row.updated_at as string
});

const mapBranch = (row: Record<string, unknown>): BranchStateRecord => ({
  branchId: row.branch_id as string,
  tenantId: row.tenant_id as string,
  latestEventId: row.latest_event_id as string,
  latestTelemetryAt: row.latest_telemetry_at as string,
  lastReceivedAt: row.last_received_at as string,
  isOnline: row.is_online as boolean,
  generatorRunning: (row.generator_running as boolean | null) ?? undefined,
  gridAvailable: (row.grid_available as boolean | null) ?? undefined,
  healthScore: row.health_score as number,
  qualityStatus: row.quality_status as BranchStateRecord["qualityStatus"],
  qualityScore: row.quality_score as number,
  qualityFlagsCount: row.quality_flags_count as number,
  openIssueCount: row.open_issue_count as number,
  updatedAt: row.updated_at as string
});

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
          quality_status,
          quality_score,
          quality_flags_count,
          open_issue_count,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW()
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
          quality_status = EXCLUDED.quality_status,
          quality_score = EXCLUDED.quality_score,
          quality_flags_count = EXCLUDED.quality_flags_count,
          open_issue_count = EXCLUDED.open_issue_count,
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
        projection.healthScore,
        projection.qualityStatus,
        projection.qualityScore,
        projection.qualityFlagsCount,
        projection.openIssueCount
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
          quality_status,
          quality_score,
          quality_flags_count,
          open_issue_count,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
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
          quality_status = EXCLUDED.quality_status,
          quality_score = EXCLUDED.quality_score,
          quality_flags_count = EXCLUDED.quality_flags_count,
          open_issue_count = EXCLUDED.open_issue_count,
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
        projection.healthScore,
        projection.qualityStatus,
        projection.qualityScore,
        projection.qualityFlagsCount,
        projection.openIssueCount
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
          quality_status,
          quality_score,
          quality_flags_count,
          open_issue_count,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW()
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
          quality_status = EXCLUDED.quality_status,
          quality_score = EXCLUDED.quality_score,
          quality_flags_count = EXCLUDED.quality_flags_count,
          open_issue_count = EXCLUDED.open_issue_count,
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
        projection.healthScore,
        projection.qualityStatus,
        projection.qualityScore,
        projection.qualityFlagsCount,
        projection.openIssueCount
      ]
    );
  }

  async getDeviceState(deviceId: string) {
    const result = await this.pool.query("SELECT * FROM device_state WHERE device_id = $1 LIMIT 1", [deviceId]);
    return result.rowCount ? mapDevice(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async getSiteState(siteId: string) {
    const result = await this.pool.query("SELECT * FROM site_state WHERE site_id = $1 LIMIT 1", [siteId]);
    return result.rowCount ? mapSite(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async getBranchState(branchId: string) {
    const result = await this.pool.query("SELECT * FROM branch_state WHERE branch_id = $1 LIMIT 1", [branchId]);
    return result.rowCount ? mapBranch(result.rows[0] as Record<string, unknown>) : undefined;
  }
}
