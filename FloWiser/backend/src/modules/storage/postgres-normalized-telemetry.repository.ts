import { canonicalTelemetryEventSchema, type CanonicalTelemetryEvent } from "@flowiser/schemas";
import type { Pool } from "pg";
import type { NormalizedTelemetryRepository, TelemetryEventQueryFilters } from "./normalized-telemetry.repository.js";

const mapRow = (row: Record<string, unknown>) =>
  canonicalTelemetryEventSchema.parse({
    eventId: row.event_id,
    rawEventId: row.raw_event_id,
    schemaVersion: row.schema_version,
    receivedAt: row.received_at,
    meterTimestamp: row.meter_timestamp,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    siteId: row.site_id,
    deviceId: row.device_id,
    sourceProtocol: row.source_protocol,
    sourceTopic: row.source_topic,
    decoderId: row.decoder_id,
    decoderVersion: row.decoder_version,
    decoderAuditId: row.decoder_audit_id,
    sequenceNo: row.sequence_no ?? undefined,
    metrics: row.metrics,
    status: row.status,
    quality: row.quality
  });

export class PostgresNormalizedTelemetryRepository implements NormalizedTelemetryRepository {
  constructor(private readonly pool: Pool) {}

  async save(event: CanonicalTelemetryEvent) {
    const query = `
      INSERT INTO normalized_telemetry_events (
        event_id,
        raw_event_id,
        schema_version,
        received_at,
        meter_timestamp,
        tenant_id,
        branch_id,
        site_id,
        device_id,
        source_protocol,
        source_topic,
        decoder_id,
        decoder_version,
        decoder_audit_id,
        sequence_no,
        metrics,
        status,
        quality
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, $18::jsonb
      )
      ON CONFLICT (event_id) DO UPDATE SET
        raw_event_id = EXCLUDED.raw_event_id,
        schema_version = EXCLUDED.schema_version,
        received_at = EXCLUDED.received_at,
        meter_timestamp = EXCLUDED.meter_timestamp,
        tenant_id = EXCLUDED.tenant_id,
        branch_id = EXCLUDED.branch_id,
        site_id = EXCLUDED.site_id,
        device_id = EXCLUDED.device_id,
        source_protocol = EXCLUDED.source_protocol,
        source_topic = EXCLUDED.source_topic,
        decoder_id = EXCLUDED.decoder_id,
        decoder_version = EXCLUDED.decoder_version,
        decoder_audit_id = EXCLUDED.decoder_audit_id,
        sequence_no = EXCLUDED.sequence_no,
        metrics = EXCLUDED.metrics,
        status = EXCLUDED.status,
        quality = EXCLUDED.quality
      RETURNING *;
    `;

    const result = await this.pool.query(query, [
      event.eventId,
      event.rawEventId,
      event.schemaVersion,
      event.receivedAt,
      event.meterTimestamp,
      event.tenantId,
      event.branchId,
      event.siteId,
      event.deviceId,
      event.sourceProtocol,
      event.sourceTopic,
      event.decoderId,
      event.decoderVersion,
      event.decoderAuditId,
      event.sequenceNo ?? null,
      JSON.stringify(event.metrics),
      JSON.stringify(event.status),
      JSON.stringify(event.quality)
    ]);

    return mapRow(result.rows[0] as Record<string, unknown>);
  }

  async findById(eventId: string) {
    const result = await this.pool.query("SELECT * FROM normalized_telemetry_events WHERE event_id = $1 LIMIT 1", [eventId]);
    return result.rowCount ? mapRow(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findByFilters(filters: TelemetryEventQueryFilters) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.eventId) {
      values.push(filters.eventId);
      conditions.push(`event_id = $${values.length}`);
    }

    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }

    if (filters.from) {
      values.push(filters.from);
      conditions.push(`meter_timestamp >= $${values.length}`);
    }

    if (filters.to) {
      values.push(filters.to);
      conditions.push(`meter_timestamp <= $${values.length}`);
    }

    if (filters.qualityStatus) {
      values.push(filters.qualityStatus);
      conditions.push(`quality->>'status' = $${values.length}`);
    }

    if (filters.minQualityScore !== undefined) {
      values.push(filters.minQualityScore);
      conditions.push(`(quality->>'score')::INTEGER >= $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM normalized_telemetry_events ${whereClause} ORDER BY meter_timestamp DESC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapRow(row as Record<string, unknown>));
  }
}
