import type { Pool } from "pg";
import type { RawEventArchiveRecord } from "../decoders/decoder.types.js";
import type { PersistentRawEventStoreRepository, RawEventQueryFilters } from "./raw-event-store.repository.js";

const mapRow = (row: Record<string, unknown>): RawEventArchiveRecord => ({
  rawEventId: row.raw_event_id as string,
  protocol: row.protocol as RawEventArchiveRecord["protocol"],
  topic: row.topic as string,
  decoderHint: (row.decoder_hint as RawEventArchiveRecord["decoderHint"]) ?? undefined,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: row.device_id as string,
  archivedAt: row.archived_at as string,
  retentionUntil: row.retention_until as string,
  parseStatus: row.parse_status as RawEventArchiveRecord["parseStatus"],
  parseError: (row.parse_error as string | null) ?? undefined,
  normalizedEventId: (row.normalized_event_id as string | null) ?? undefined,
  decoderId: (row.decoder_id as string | null) ?? undefined,
  rawPayload: row.raw_payload
});

export class PostgresRawEventStoreRepository implements PersistentRawEventStoreRepository {
  constructor(private readonly pool: Pool) {}

  async save(record: RawEventArchiveRecord) {
    const query = `
      INSERT INTO raw_event_archive (
        raw_event_id,
        protocol,
        topic,
        decoder_hint,
        tenant_id,
        branch_id,
        site_id,
        device_id,
        archived_at,
        retention_until,
        parse_status,
        parse_error,
        normalized_event_id,
        decoder_id,
        raw_payload,
        updated_at
      ) VALUES (
        $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, NOW()
      )
      ON CONFLICT (raw_event_id) DO UPDATE SET
        protocol = EXCLUDED.protocol,
        topic = EXCLUDED.topic,
        decoder_hint = EXCLUDED.decoder_hint,
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id,
        site_id = EXCLUDED.site_id,
        device_id = EXCLUDED.device_id,
        archived_at = EXCLUDED.archived_at,
        retention_until = EXCLUDED.retention_until,
        parse_status = EXCLUDED.parse_status,
        parse_error = EXCLUDED.parse_error,
        normalized_event_id = EXCLUDED.normalized_event_id,
        decoder_id = EXCLUDED.decoder_id,
        raw_payload = EXCLUDED.raw_payload,
        updated_at = NOW()
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      record.rawEventId,
      record.protocol,
      record.topic,
      JSON.stringify(record.decoderHint ?? null),
      record.tenantId,
      record.branchId,
      record.siteId,
      record.deviceId,
      record.archivedAt,
      record.retentionUntil,
      record.parseStatus,
      record.parseError ?? null,
      record.normalizedEventId ?? null,
      record.decoderId ?? null,
      JSON.stringify(record.rawPayload)
    ]);

    return mapRow(result.rows[0] as Record<string, unknown>);
  }

  async findById(rawEventId: string) {
    const result = await this.pool.query("SELECT * FROM raw_event_archive WHERE raw_event_id = $1 LIMIT 1", [rawEventId]);
    return result.rowCount ? mapRow(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findByFilters(filters: RawEventQueryFilters) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.rawEventId) {
      values.push(filters.rawEventId);
      conditions.push(`raw_event_id = $${values.length}`);
    }

    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }

    if (filters.from) {
      values.push(filters.from);
      conditions.push(`archived_at >= $${values.length}`);
    }

    if (filters.to) {
      values.push(filters.to);
      conditions.push(`archived_at <= $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM raw_event_archive ${whereClause} ORDER BY archived_at DESC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapRow(row as Record<string, unknown>));
  }
}
