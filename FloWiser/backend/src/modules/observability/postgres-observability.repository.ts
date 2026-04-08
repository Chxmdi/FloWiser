import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { ServiceHealthSnapshotRecord } from "./observability.types.js";

const mapSnapshot = (row: Record<string, unknown>): ServiceHealthSnapshotRecord => ({
  snapshotId: row.snapshot_id as string,
  capturedBy: row.captured_by as string,
  gatewayOnlineCount: Number(row.gateway_online_count ?? 0),
  gatewayStaleCount: Number(row.gateway_stale_count ?? 0),
  gatewayOfflineCount: Number(row.gateway_offline_count ?? 0),
  gatewayNeverSeenCount: Number(row.gateway_never_seen_count ?? 0),
  pendingDispatchCount: Number(row.pending_dispatch_count ?? 0),
  retryScheduledCount: Number(row.retry_scheduled_count ?? 0),
  deadLetterCount: Number(row.dead_letter_count ?? 0),
  openIncidentCount: Number(row.open_incident_count ?? 0),
  brokerPendingCount: Number(row.broker_pending_count ?? 0),
  brokerClaimedCount: Number(row.broker_claimed_count ?? 0),
  brokerDeadLetteredCount: Number(row.broker_dead_lettered_count ?? 0),
  createdAt: row.created_at as string
});

export class PostgresObservabilityRepository {
  constructor(private readonly pool: Pool) {}

  async createSnapshot(input: Omit<ServiceHealthSnapshotRecord, "snapshotId" | "createdAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO service_health_snapshots (
          snapshot_id, captured_by, gateway_online_count, gateway_stale_count, gateway_offline_count,
          gateway_never_seen_count, pending_dispatch_count, retry_scheduled_count, dead_letter_count,
          open_incident_count, broker_pending_count, broker_claimed_count, broker_dead_lettered_count, created_at
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.capturedBy,
        input.gatewayOnlineCount,
        input.gatewayStaleCount,
        input.gatewayOfflineCount,
        input.gatewayNeverSeenCount,
        input.pendingDispatchCount,
        input.retryScheduledCount,
        input.deadLetterCount,
        input.openIncidentCount,
        input.brokerPendingCount,
        input.brokerClaimedCount,
        input.brokerDeadLetteredCount
      ]
    );
    return mapSnapshot(result.rows[0] as Record<string, unknown>);
  }

  async listSnapshots(limit = 100) {
    const result = await this.pool.query(
      `SELECT * FROM service_health_snapshots ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => mapSnapshot(row as Record<string, unknown>));
  }

  async getLatestSnapshot() {
    const result = await this.pool.query(
      `SELECT * FROM service_health_snapshots ORDER BY created_at DESC LIMIT 1`
    );
    return result.rowCount ? mapSnapshot(result.rows[0] as Record<string, unknown>) : undefined;
  }
}
