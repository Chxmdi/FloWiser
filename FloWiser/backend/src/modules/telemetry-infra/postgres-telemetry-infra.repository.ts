import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  AlertEventRecord,
  AlertPolicyRecord,
  InfraProfile,
  InfraProfileUpdateInput,
  LogEntryRecord,
  MetricPointRecord,
  TraceSpanRecord
} from "./telemetry-infra.types.js";

const toNumber = (value: unknown) => Number(value ?? 0);

const mapProfile = (row: Record<string, unknown>): InfraProfile => ({
  profileId: row.profile_id as string,
  profileType: row.profile_type as string,
  displayName: row.display_name as string,
  connectionMode: row.connection_mode as string,
  config: (row.config as Record<string, unknown>) ?? {},
  healthStatus: row.health_status as string,
  enabled: Boolean(row.enabled),
  lastCheckedAt: (row.last_checked_at as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapMetric = (row: Record<string, unknown>): MetricPointRecord => ({
  metricId: row.metric_id as string,
  metricKey: row.metric_key as string,
  labels: (row.labels as Record<string, unknown>) ?? {},
  value: toNumber(row.metric_value),
  unit: row.unit as string,
  source: row.source as string,
  capturedAt: row.captured_at as string,
  createdAt: row.created_at as string
});

const mapLog = (row: Record<string, unknown>): LogEntryRecord => ({
  logId: row.log_id as string,
  severity: row.severity as string,
  source: row.source as string,
  message: row.message as string,
  context: (row.context as Record<string, unknown>) ?? {},
  capturedAt: row.captured_at as string,
  createdAt: row.created_at as string
});

const mapSpan = (row: Record<string, unknown>): TraceSpanRecord => ({
  spanId: row.span_id as string,
  traceId: row.trace_id as string,
  parentSpanId: (row.parent_span_id as string | null) ?? undefined,
  spanName: row.span_name as string,
  source: row.source as string,
  status: row.status as string,
  attributes: (row.attributes as Record<string, unknown>) ?? {},
  startedAt: row.started_at as string,
  endedAt: row.ended_at as string,
  createdAt: row.created_at as string
});

const mapPolicy = (row: Record<string, unknown>): AlertPolicyRecord => ({
  policyId: row.policy_id as string,
  name: row.name as string,
  description: row.description as string,
  signalKey: row.signal_key as string,
  comparator: row.comparator as string,
  threshold: toNumber(row.threshold),
  severity: row.severity as string,
  enabled: Boolean(row.enabled),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapEvent = (row: Record<string, unknown>): AlertEventRecord => ({
  alertEventId: row.alert_event_id as string,
  policyId: row.policy_id as string,
  severity: row.severity as string,
  status: row.status as string,
  title: row.title as string,
  summary: row.summary as string,
  payload: (row.payload as Record<string, unknown>) ?? {},
  triggeredAt: row.triggered_at as string,
  acknowledgedAt: (row.acknowledged_at as string | null) ?? undefined,
  resolvedAt: (row.resolved_at as string | null) ?? undefined
});

export class PostgresTelemetryInfraRepository {
  constructor(private readonly pool: Pool) {}

  async ensureProfiles(defaults: InfraProfile[]) {
    for (const profile of defaults) {
      await this.pool.query(
        `
          INSERT INTO external_infra_profiles (
            profile_id, profile_type, display_name, connection_mode, config, health_status, enabled, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5::jsonb, $6, $7, NOW(), NOW()
          ) ON CONFLICT (profile_id) DO NOTHING;
        `,
        [
          profile.profileId,
          profile.profileType,
          profile.displayName,
          profile.connectionMode,
          JSON.stringify(profile.config),
          profile.healthStatus,
          profile.enabled
        ]
      );
    }
  }

  async ensureAlertPolicies(defaults: Omit<AlertPolicyRecord, "createdAt" | "updatedAt">[]) {
    for (const policy of defaults) {
      await this.pool.query(
        `
          INSERT INTO observability_alert_policies (
            policy_id, name, description, signal_key, comparator, threshold, severity, enabled, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
          ) ON CONFLICT (policy_id) DO NOTHING;
        `,
        [
          policy.policyId,
          policy.name,
          policy.description,
          policy.signalKey,
          policy.comparator,
          policy.threshold,
          policy.severity,
          policy.enabled
        ]
      );
    }
  }

  async listProfiles() {
    const result = await this.pool.query(`SELECT * FROM external_infra_profiles ORDER BY profile_type, display_name`);
    return result.rows.map((row) => mapProfile(row as Record<string, unknown>));
  }

  async getProfile(profileId: string) {
    const result = await this.pool.query(`SELECT * FROM external_infra_profiles WHERE profile_id = $1 LIMIT 1`, [profileId]);
    return result.rowCount ? mapProfile(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updateProfile(profileId: string, patch: InfraProfileUpdateInput & { healthStatus?: string; lastCheckedAt?: string }) {
    const current = await this.getProfile(profileId);
    if (!current) {
      return undefined;
    }

    const next = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE external_infra_profiles
        SET display_name = $2,
            connection_mode = $3,
            config = $4::jsonb,
            health_status = $5,
            enabled = $6,
            last_checked_at = $7,
            updated_at = NOW()
        WHERE profile_id = $1
        RETURNING *;
      `,
      [
        profileId,
        next.displayName,
        next.connectionMode,
        JSON.stringify(next.config),
        next.healthStatus,
        next.enabled,
        next.lastCheckedAt ?? null
      ]
    );
    return mapProfile(result.rows[0] as Record<string, unknown>);
  }

  async createMetricPoint(input: Omit<MetricPointRecord, "metricId" | "createdAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO telemetry_metric_points (
          metric_id, metric_key, labels, metric_value, unit, source, captured_at, created_at
        ) VALUES (
          $1, $2, $3::jsonb, $4, $5, $6, $7, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.metricKey, JSON.stringify(input.labels), input.value, input.unit, input.source, input.capturedAt]
    );
    return mapMetric(result.rows[0] as Record<string, unknown>);
  }

  async listMetricPoints(filters: { metricKey?: string; source?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.metricKey) {
      values.push(filters.metricKey);
      conditions.push(`metric_key = $${values.length}`);
    }
    if (filters.source) {
      values.push(filters.source);
      conditions.push(`source = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM telemetry_metric_points ${whereClause} ORDER BY captured_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapMetric(row as Record<string, unknown>));
  }

  async createLogEntry(input: Omit<LogEntryRecord, "logId" | "createdAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO telemetry_log_entries (
          log_id, severity, source, message, context, captured_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.severity, input.source, input.message, JSON.stringify(input.context), input.capturedAt]
    );
    return mapLog(result.rows[0] as Record<string, unknown>);
  }

  async listLogEntries(filters: { severity?: string; source?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.severity) {
      values.push(filters.severity);
      conditions.push(`severity = $${values.length}`);
    }
    if (filters.source) {
      values.push(filters.source);
      conditions.push(`source = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM telemetry_log_entries ${whereClause} ORDER BY captured_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapLog(row as Record<string, unknown>));
  }

  async createTraceSpan(input: Omit<TraceSpanRecord, "spanId" | "createdAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO trace_spans (
          span_id, trace_id, parent_span_id, span_name, source, status, attributes, started_at, ended_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.traceId, input.parentSpanId ?? null, input.spanName, input.source, input.status, JSON.stringify(input.attributes), input.startedAt, input.endedAt]
    );
    return mapSpan(result.rows[0] as Record<string, unknown>);
  }

  async listTraceSpans(filters: { traceId?: string; source?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.traceId) {
      values.push(filters.traceId);
      conditions.push(`trace_id = $${values.length}`);
    }
    if (filters.source) {
      values.push(filters.source);
      conditions.push(`source = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM trace_spans ${whereClause} ORDER BY started_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapSpan(row as Record<string, unknown>));
  }

  async listAlertPolicies() {
    const result = await this.pool.query(`SELECT * FROM observability_alert_policies ORDER BY severity DESC, name ASC`);
    return result.rows.map((row) => mapPolicy(row as Record<string, unknown>));
  }

  async getAlertPolicy(policyId: string) {
    const result = await this.pool.query(`SELECT * FROM observability_alert_policies WHERE policy_id = $1 LIMIT 1`, [policyId]);
    return result.rowCount ? mapPolicy(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updateAlertPolicy(policyId: string, patch: { threshold?: number; severity?: string; enabled?: boolean }) {
    const current = await this.getAlertPolicy(policyId);
    if (!current) {
      return undefined;
    }

    const next = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE observability_alert_policies
        SET threshold = $2,
            severity = $3,
            enabled = $4,
            updated_at = NOW()
        WHERE policy_id = $1
        RETURNING *;
      `,
      [policyId, next.threshold, next.severity, next.enabled]
    );
    return mapPolicy(result.rows[0] as Record<string, unknown>);
  }

  async getOpenEventByPolicy(policyId: string) {
    const result = await this.pool.query(
      `SELECT * FROM observability_alert_events WHERE policy_id = $1 AND status = 'open' ORDER BY triggered_at DESC LIMIT 1`,
      [policyId]
    );
    return result.rowCount ? mapEvent(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async createAlertEvent(input: Omit<AlertEventRecord, "alertEventId" | "triggeredAt" | "acknowledgedAt" | "resolvedAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO observability_alert_events (
          alert_event_id, policy_id, severity, status, title, summary, payload, triggered_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.policyId, input.severity, input.status, input.title, input.summary, JSON.stringify(input.payload)]
    );
    return mapEvent(result.rows[0] as Record<string, unknown>);
  }

  async resolveOpenEventsByPolicy(policyId: string, resolutionPayload: Record<string, unknown>) {
    const result = await this.pool.query(
      `
        UPDATE observability_alert_events
        SET status = 'resolved',
            payload = payload || $2::jsonb,
            resolved_at = NOW()
        WHERE policy_id = $1 AND status = 'open'
        RETURNING *;
      `,
      [policyId, JSON.stringify(resolutionPayload)]
    );
    return result.rows.map((row) => mapEvent(row as Record<string, unknown>));
  }

  async listAlertEvents(filters: { status?: string; severity?: string; policyId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.severity) {
      values.push(filters.severity);
      conditions.push(`severity = $${values.length}`);
    }
    if (filters.policyId) {
      values.push(filters.policyId);
      conditions.push(`policy_id = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM observability_alert_events ${whereClause} ORDER BY triggered_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapEvent(row as Record<string, unknown>));
  }
}
