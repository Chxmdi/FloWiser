import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { BrokerMessageRecord } from "./broker.types.js";
import type { GatewayAgent } from "../gateway/gateway.types.js";

const mapMessage = (row: Record<string, unknown>): BrokerMessageRecord => ({
  messageId: row.message_id as string,
  topic: row.topic as string,
  routingKey: row.routing_key as string,
  dispatchId: row.dispatch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  payload: (row.payload as Record<string, unknown>) ?? {},
  status: row.status as BrokerMessageRecord["status"],
  claimCount: Number(row.claim_count ?? 0),
  publishedAt: row.published_at as string,
  claimedAt: (row.claimed_at as string | null) ?? undefined,
  ackedAt: (row.acked_at as string | null) ?? undefined,
  deadLetteredAt: (row.dead_lettered_at as string | null) ?? undefined,
  lastError: (row.last_error as string | null) ?? undefined
});

export class PostgresBrokerRepository {
  constructor(private readonly pool: Pool) {}

  async createMessage(input: {
    topic: string;
    routingKey: string;
    dispatchId: string;
    siteId: string;
    deviceId?: string;
    payload: Record<string, unknown>;
    status?: BrokerMessageRecord["status"];
  }) {
    const result = await this.pool.query(
      `
        INSERT INTO broker_messages (
          message_id, topic, routing_key, dispatch_id, site_id, device_id, payload, status,
          claim_count, published_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8,
          0, NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.topic,
        input.routingKey,
        input.dispatchId,
        input.siteId,
        input.deviceId ?? null,
        JSON.stringify(input.payload),
        input.status ?? "pending"
      ]
    );
    return mapMessage(result.rows[0] as Record<string, unknown>);
  }

  async listMessages(filters: { topic?: string; status?: string; siteId?: string; dispatchId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.topic) {
      values.push(filters.topic);
      conditions.push(`topic = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.dispatchId) {
      values.push(filters.dispatchId);
      conditions.push(`dispatch_id = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM broker_messages ${whereClause} ORDER BY published_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapMessage(row as Record<string, unknown>));
  }

  async getMessage(messageId: string) {
    const result = await this.pool.query("SELECT * FROM broker_messages WHERE message_id = $1 LIMIT 1", [messageId]);
    return result.rowCount ? mapMessage(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async claimMessagesForAgent(agent: GatewayAgent, topic: string, limit = 20) {
    const result = await this.pool.query(
      `
        WITH candidates AS (
          SELECT message.message_id
          FROM broker_messages message
          JOIN command_dispatches dispatch ON dispatch.dispatch_id = message.dispatch_id
          WHERE message.topic = $1
            AND message.status = 'pending'
            AND message.site_id = $2
            AND ($3::text IS NULL OR message.device_id = $3)
            AND dispatch.dispatch_status IN ('sent', 'retry_scheduled')
          ORDER BY message.published_at ASC
          LIMIT $4
        )
        UPDATE broker_messages message
        SET status = 'claimed',
            claim_count = message.claim_count + 1,
            claimed_at = NOW()
        WHERE message.message_id IN (SELECT message_id FROM candidates)
        RETURNING message.*;
      `,
      [topic, agent.siteId, agent.deviceId ?? null, limit]
    );
    return result.rows.map((row) => mapMessage(row as Record<string, unknown>));
  }

  async ackByDispatch(dispatchId: string) {
    const result = await this.pool.query(
      `
        UPDATE broker_messages
        SET status = 'acked',
            acked_at = NOW(),
            last_error = NULL
        WHERE dispatch_id = $1 AND status IN ('pending', 'claimed')
        RETURNING *;
      `,
      [dispatchId]
    );
    return result.rows.map((row) => mapMessage(row as Record<string, unknown>));
  }

  async deadLetterByDispatch(dispatchId: string, reason: string) {
    const result = await this.pool.query(
      `
        UPDATE broker_messages
        SET status = 'dead_lettered',
            dead_lettered_at = NOW(),
            last_error = $2
        WHERE dispatch_id = $1 AND status IN ('pending', 'claimed')
        RETURNING *;
      `,
      [dispatchId, reason]
    );
    return result.rows.map((row) => mapMessage(row as Record<string, unknown>));
  }

  async countByStatus() {
    const result = await this.pool.query(
      `SELECT status, COUNT(*)::INTEGER AS total FROM broker_messages GROUP BY status`
    );
    return Object.fromEntries(result.rows.map((row) => [row.status as string, Number(row.total)]));
  }
}
