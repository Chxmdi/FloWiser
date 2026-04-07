import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { RuleConfig, RuleExecutionTrace, RuleUpdateInput } from "./rule.types.js";

const mapRule = (row: Record<string, unknown>): RuleConfig => ({
  ruleId: row.rule_id as string,
  name: row.name as string,
  description: row.description as string,
  category: row.category as RuleConfig["category"],
  severity: row.severity as RuleConfig["severity"],
  enabled: row.enabled as boolean,
  scope: row.scope as string,
  version: row.version as string,
  thresholdConfig: (row.threshold_config as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapTrace = (row: Record<string, unknown>): RuleExecutionTrace => ({
  traceId: row.trace_id as string,
  ruleId: row.rule_id as string,
  ruleVersion: row.rule_version as string,
  matched: row.matched as boolean,
  severity: row.severity as RuleExecutionTrace["severity"],
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: row.device_id as string,
  eventId: row.event_id as string,
  title: row.title as string,
  summary: row.summary as string,
  evidence: (row.evidence as Record<string, unknown>) ?? {},
  executedAt: row.executed_at as string,
  createdAt: row.created_at as string
});

export class PostgresRulesRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaults(defaults: RuleConfig[]) {
    for (const rule of defaults) {
      await this.pool.query(
        `
          INSERT INTO rules_config (
            rule_id, name, description, category, severity, enabled, scope, version, threshold_config, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), NOW()
          )
          ON CONFLICT (rule_id) DO NOTHING;
        `,
        [
          rule.ruleId,
          rule.name,
          rule.description,
          rule.category,
          rule.severity,
          rule.enabled,
          rule.scope,
          rule.version,
          JSON.stringify(rule.thresholdConfig)
        ]
      );
    }
  }

  async listRules() {
    const result = await this.pool.query("SELECT * FROM rules_config ORDER BY category, name");
    return result.rows.map((row) => mapRule(row as Record<string, unknown>));
  }

  async getRule(ruleId: string) {
    const result = await this.pool.query("SELECT * FROM rules_config WHERE rule_id = $1 LIMIT 1", [ruleId]);
    return result.rowCount ? mapRule(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updateRule(ruleId: string, patch: RuleUpdateInput) {
    const current = await this.getRule(ruleId);

    if (!current) {
      return undefined;
    }

    const merged: RuleConfig = {
      ...current,
      ...patch,
      thresholdConfig: patch.thresholdConfig ?? current.thresholdConfig
    };

    const result = await this.pool.query(
      `
        UPDATE rules_config
        SET severity = $2,
            enabled = $3,
            threshold_config = $4::jsonb,
            updated_at = NOW()
        WHERE rule_id = $1
        RETURNING *;
      `,
      [ruleId, merged.severity, merged.enabled, JSON.stringify(merged.thresholdConfig)]
    );

    return mapRule(result.rows[0] as Record<string, unknown>);
  }

  async saveTrace(trace: Omit<RuleExecutionTrace, "traceId" | "createdAt">) {
    const traceId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO rule_execution_traces (
          trace_id, rule_id, rule_version, matched, severity, tenant_id, branch_id, site_id, device_id, event_id,
          title, summary, evidence, executed_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13::jsonb, $14, NOW()
        ) RETURNING *;
      `,
      [
        traceId,
        trace.ruleId,
        trace.ruleVersion,
        trace.matched,
        trace.severity,
        trace.tenantId,
        trace.branchId,
        trace.siteId,
        trace.deviceId,
        trace.eventId,
        trace.title,
        trace.summary,
        JSON.stringify(trace.evidence),
        trace.executedAt
      ]
    );

    return mapTrace(result.rows[0] as Record<string, unknown>);
  }

  async listTraces(filters: {
    ruleId?: string;
    siteId?: string;
    deviceId?: string;
    matched?: boolean;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.ruleId) {
      values.push(filters.ruleId);
      conditions.push(`rule_id = $${values.length}`);
    }

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }

    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }

    if (filters.matched !== undefined) {
      values.push(filters.matched);
      conditions.push(`matched = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM rule_execution_traces ${whereClause} ORDER BY executed_at DESC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapTrace(row as Record<string, unknown>));
  }
}
