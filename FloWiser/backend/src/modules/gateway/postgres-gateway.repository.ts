import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { GatewayAgent, GatewayDispatchReceipt } from "./gateway.types.js";

const mapAgent = (row: Record<string, unknown>): GatewayAgent => ({
  agentId: row.agent_id as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  displayName: row.display_name as string,
  sharedKey: row.shared_key as string,
  supportedActionTypes: (row.supported_action_types as string[]) ?? [],
  isActive: Boolean(row.is_active),
  lastSeenAt: (row.last_seen_at as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapReceipt = (row: Record<string, unknown>): GatewayDispatchReceipt => ({
  receiptId: row.receipt_id as string,
  dispatchId: row.dispatch_id as string,
  agentId: row.agent_id as string,
  eventType: row.event_type as string,
  status: row.status as string,
  detail: (row.detail as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string
});

export class PostgresGatewayRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaults(defaults: GatewayAgent[]) {
    for (const agent of defaults) {
      await this.pool.query(
        `
          INSERT INTO gateway_agents (
            agent_id, tenant_id, branch_id, site_id, device_id, display_name, shared_key,
            supported_action_types, is_active, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8::jsonb, $9, NOW(), NOW()
          ) ON CONFLICT (agent_id) DO NOTHING;
        `,
        [
          agent.agentId,
          agent.tenantId,
          agent.branchId,
          agent.siteId,
          agent.deviceId ?? null,
          agent.displayName,
          agent.sharedKey,
          JSON.stringify(agent.supportedActionTypes),
          agent.isActive
        ]
      );
    }
  }

  async listAgents(filters: { tenantId?: string; siteId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.tenantId) {
      values.push(filters.tenantId);
      conditions.push(`tenant_id = $${values.length}`);
    }
    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM gateway_agents ${whereClause} ORDER BY site_id, display_name LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapAgent(row as Record<string, unknown>));
  }

  async getAgent(agentId: string) {
    const result = await this.pool.query("SELECT * FROM gateway_agents WHERE agent_id = $1 LIMIT 1", [agentId]);
    return result.rowCount ? mapAgent(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async authenticateAgent(agentId: string, sharedKey: string) {
    const result = await this.pool.query(
      "SELECT * FROM gateway_agents WHERE agent_id = $1 AND shared_key = $2 AND is_active = TRUE LIMIT 1",
      [agentId, sharedKey]
    );
    return result.rowCount ? mapAgent(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async heartbeat(agentId: string) {
    const result = await this.pool.query(
      `UPDATE gateway_agents SET last_seen_at = NOW(), updated_at = NOW() WHERE agent_id = $1 RETURNING *`,
      [agentId]
    );
    return result.rowCount ? mapAgent(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async claimPendingDispatchesForAgent(agent: GatewayAgent, limit = 20) {
    const result = await this.pool.query(
      `
        WITH candidates AS (
          SELECT dispatch_id
          FROM command_dispatches
          WHERE dispatch_status IN ('sent', 'retry_scheduled')
            AND tenant_id = $1
            AND site_id = $2
            AND ($3::text IS NULL OR device_id = $3)
            AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
          ORDER BY COALESCE(next_attempt_at, requested_at) ASC
          LIMIT $4
        )
        UPDATE command_dispatches dispatch
        SET attempt_count = dispatch.attempt_count + 1,
            dispatch_status = 'sent',
            next_attempt_at = NULL,
            dispatched_at = NOW(),
            updated_at = NOW()
        WHERE dispatch.dispatch_id IN (SELECT dispatch_id FROM candidates)
        RETURNING dispatch.*;
      `,
      [agent.tenantId, agent.siteId, agent.deviceId ?? null, limit]
    );
    return result.rows as Record<string, unknown>[];
  }

  async getDispatch(dispatchId: string) {
    const result = await this.pool.query("SELECT * FROM command_dispatches WHERE dispatch_id = $1 LIMIT 1", [dispatchId]);
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  async updateDispatchResult(dispatchId: string, status: string, resultSummary: string) {
    const result = await this.pool.query(
      `
        UPDATE command_dispatches
        SET dispatch_status = $2,
            result_summary = $3,
            last_error = CASE WHEN $2 = 'failed' THEN $3 ELSE NULL END,
            completed_at = NOW(),
            updated_at = NOW()
        WHERE dispatch_id = $1
        RETURNING *;
      `,
      [dispatchId, status, resultSummary]
    );
    return result.rows[0] as Record<string, unknown> | undefined;
  }

  async createReceipt(input: { dispatchId: string; agentId: string; eventType: string; status: string; detail: Record<string, unknown> }) {
    const result = await this.pool.query(
      `
        INSERT INTO gateway_dispatch_receipts (
          receipt_id, dispatch_id, agent_id, event_type, status, detail, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6::jsonb, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.dispatchId, input.agentId, input.eventType, input.status, JSON.stringify(input.detail)]
    );
    return mapReceipt(result.rows[0] as Record<string, unknown>);
  }

  async listReceipts(dispatchId: string) {
    const result = await this.pool.query(
      `SELECT * FROM gateway_dispatch_receipts WHERE dispatch_id = $1 ORDER BY created_at DESC`,
      [dispatchId]
    );
    return result.rows.map((row) => mapReceipt(row as Record<string, unknown>));
  }

  async getPendingDispatchCountsBySite(siteIds?: string[]) {
    const result = await this.pool.query(
      `
        SELECT site_id, COUNT(*)::INTEGER AS pending_count
        FROM command_dispatches
        WHERE dispatch_status IN ('sent', 'retry_scheduled')
          AND ($1::text[] IS NULL OR site_id = ANY($1))
        GROUP BY site_id;
      `,
      [siteIds?.length ? siteIds : null]
    );
    return Object.fromEntries(result.rows.map((row) => [row.site_id as string, Number(row.pending_count)]));
  }
}
