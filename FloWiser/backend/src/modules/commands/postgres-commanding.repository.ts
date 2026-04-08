import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { DispatchDeadLetterRecord, DispatchOperationIncidentRecord } from "../operations/operations.types.js";
import type { CommandDispatchRecord, CommandPlan, CommandTemplate, SimulationResult } from "./command.types.js";

const mapTemplate = (row: Record<string, unknown>): CommandTemplate => ({
  templateId: row.template_id as string,
  name: row.name as string,
  description: row.description as string,
  actionType: row.action_type as string,
  dispatchChannel: row.dispatch_channel as CommandTemplate["dispatchChannel"],
  allowedExecutionModes: ((row.allowed_execution_modes as string[]) ?? []) as CommandTemplate["allowedExecutionModes"],
  enabled: Boolean(row.enabled),
  requiresConfirmation: Boolean(row.requires_confirmation),
  commandBlueprint: (row.command_blueprint as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapDispatch = (row: Record<string, unknown>): CommandDispatchRecord => ({
  dispatchId: row.dispatch_id as string,
  executionId: row.execution_id as string,
  actionId: row.action_id as string,
  templateId: row.template_id as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  dispatchChannel: row.dispatch_channel as CommandDispatchRecord["dispatchChannel"],
  executionMode: row.execution_mode as CommandDispatchRecord["executionMode"],
  dispatchStatus: row.dispatch_status as CommandDispatchRecord["dispatchStatus"],
  requestedBy: row.requested_by as string,
  note: (row.note as string | null) ?? undefined,
  commandPayload: (row.command_payload as CommandPlan) ?? {
    templateId: row.template_id as string,
    actionType: "unknown",
    dispatchChannel: row.dispatch_channel as CommandDispatchRecord["dispatchChannel"],
    commands: []
  },
  simulationResult: (row.simulation_result as SimulationResult) ?? {
    success: false,
    warnings: [],
    estimatedImpact: { monthlySavings: 0, dieselSavings: 0 },
    summary: "No simulation result captured"
  },
  resultSummary: (row.result_summary as string | null) ?? undefined,
  requestedAt: row.requested_at as string,
  dispatchedAt: (row.dispatched_at as string | null) ?? undefined,
  completedAt: (row.completed_at as string | null) ?? undefined,
  attemptCount: Number(row.attempt_count ?? 0),
  maxAttempts: Number(row.max_attempts ?? 3),
  nextAttemptAt: (row.next_attempt_at as string | null) ?? undefined,
  deadLetterReason: (row.dead_letter_reason as string | null) ?? undefined,
  lastError: (row.last_error as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapIncident = (row: Record<string, unknown>): DispatchOperationIncidentRecord => ({
  incidentId: row.incident_id as string,
  dispatchId: (row.dispatch_id as string | null) ?? undefined,
  agentId: (row.agent_id as string | null) ?? undefined,
  incidentType: row.incident_type as string,
  severity: row.severity as string,
  status: row.status as string,
  summary: row.summary as string,
  detail: (row.detail as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string,
  resolvedAt: (row.resolved_at as string | null) ?? undefined
});

const mapDeadLetter = (row: Record<string, unknown>): DispatchDeadLetterRecord => ({
  deadLetterId: row.dead_letter_id as string,
  dispatchId: row.dispatch_id as string,
  reason: row.reason as string,
  detail: (row.detail as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string
});

export class PostgresCommandingRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaults(defaults: CommandTemplate[]) {
    for (const template of defaults) {
      await this.pool.query(
        `
          INSERT INTO command_templates (
            template_id, name, description, action_type, dispatch_channel, allowed_execution_modes,
            enabled, requires_confirmation, command_blueprint, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6::jsonb,
            $7, $8, $9::jsonb, NOW(), NOW()
          ) ON CONFLICT (template_id) DO NOTHING;
        `,
        [
          template.templateId,
          template.name,
          template.description,
          template.actionType,
          template.dispatchChannel,
          JSON.stringify(template.allowedExecutionModes),
          template.enabled,
          template.requiresConfirmation,
          JSON.stringify(template.commandBlueprint)
        ]
      );
    }
  }

  async listTemplates() {
    const result = await this.pool.query("SELECT * FROM command_templates ORDER BY action_type, name");
    return result.rows.map((row) => mapTemplate(row as Record<string, unknown>));
  }

  async getTemplate(templateId: string) {
    const result = await this.pool.query("SELECT * FROM command_templates WHERE template_id = $1 LIMIT 1", [templateId]);
    return result.rowCount ? mapTemplate(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findTemplateByActionType(actionType: string) {
    const result = await this.pool.query(
      "SELECT * FROM command_templates WHERE action_type = $1 AND enabled = TRUE LIMIT 1",
      [actionType]
    );
    return result.rowCount ? mapTemplate(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async createDispatch(input: {
    executionId: string;
    actionId: string;
    templateId: string;
    tenantId: string;
    branchId: string;
    siteId: string;
    deviceId?: string;
    dispatchChannel: CommandDispatchRecord["dispatchChannel"];
    executionMode: CommandDispatchRecord["executionMode"];
    dispatchStatus: CommandDispatchRecord["dispatchStatus"];
    requestedBy: string;
    note?: string;
    commandPayload: CommandPlan;
    simulationResult: SimulationResult;
    resultSummary?: string;
    requestedAt: string;
    dispatchedAt?: string;
    completedAt?: string;
    attemptCount?: number;
    maxAttempts?: number;
    nextAttemptAt?: string;
    deadLetterReason?: string;
    lastError?: string;
  }) {
    const dispatchId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO command_dispatches (
          dispatch_id, execution_id, action_id, template_id, tenant_id, branch_id, site_id, device_id,
          dispatch_channel, execution_mode, dispatch_status, requested_by, note, command_payload,
          simulation_result, result_summary, requested_at, dispatched_at, completed_at,
          attempt_count, max_attempts, next_attempt_at, dead_letter_reason, last_error,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14::jsonb,
          $15::jsonb, $16, $17, $18, $19,
          $20, $21, $22, $23, $24,
          NOW(), NOW()
        ) RETURNING *;
      `,
      [
        dispatchId,
        input.executionId,
        input.actionId,
        input.templateId,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.dispatchChannel,
        input.executionMode,
        input.dispatchStatus,
        input.requestedBy,
        input.note ?? null,
        JSON.stringify(input.commandPayload),
        JSON.stringify(input.simulationResult),
        input.resultSummary ?? null,
        input.requestedAt,
        input.dispatchedAt ?? null,
        input.completedAt ?? null,
        input.attemptCount ?? 0,
        input.maxAttempts ?? 3,
        input.nextAttemptAt ?? null,
        input.deadLetterReason ?? null,
        input.lastError ?? null
      ]
    );
    return mapDispatch(result.rows[0] as Record<string, unknown>);
  }

  async updateDispatch(dispatchId: string, patch: Partial<CommandDispatchRecord>) {
    const current = await this.getDispatch(dispatchId);
    if (!current) {
      return undefined;
    }

    const next = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE command_dispatches
        SET dispatch_status = $2,
            simulation_result = $3::jsonb,
            result_summary = $4,
            dispatched_at = $5,
            completed_at = $6,
            attempt_count = $7,
            max_attempts = $8,
            next_attempt_at = $9,
            dead_letter_reason = $10,
            last_error = $11,
            updated_at = NOW()
        WHERE dispatch_id = $1
        RETURNING *;
      `,
      [
        dispatchId,
        next.dispatchStatus,
        JSON.stringify(next.simulationResult),
        next.resultSummary ?? null,
        next.dispatchedAt ?? null,
        next.completedAt ?? null,
        next.attemptCount,
        next.maxAttempts,
        next.nextAttemptAt ?? null,
        next.deadLetterReason ?? null,
        next.lastError ?? null
      ]
    );
    return mapDispatch(result.rows[0] as Record<string, unknown>);
  }

  async listDispatches(filters: { executionId?: string; siteId?: string; dispatchStatus?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.executionId) {
      values.push(filters.executionId);
      conditions.push(`execution_id = $${values.length}`);
    }
    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.dispatchStatus) {
      values.push(filters.dispatchStatus);
      conditions.push(`dispatch_status = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM command_dispatches ${whereClause} ORDER BY requested_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapDispatch(row as Record<string, unknown>));
  }

  async getDispatch(dispatchId: string) {
    const result = await this.pool.query("SELECT * FROM command_dispatches WHERE dispatch_id = $1 LIMIT 1", [dispatchId]);
    return result.rowCount ? mapDispatch(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listRetryCandidates(staleBeforeIso: string, limit = 100) {
    const result = await this.pool.query(
      `
        SELECT *
        FROM command_dispatches
        WHERE (
          dispatch_status = 'failed'
          OR (dispatch_status = 'retry_scheduled' AND next_attempt_at IS NOT NULL AND next_attempt_at <= $1)
          OR (dispatch_status = 'sent' AND dispatched_at IS NOT NULL AND dispatched_at <= $1 AND completed_at IS NULL)
        )
        ORDER BY COALESCE(next_attempt_at, dispatched_at, requested_at) ASC
        LIMIT $2;
      `,
      [staleBeforeIso, limit]
    );
    return result.rows.map((row) => mapDispatch(row as Record<string, unknown>));
  }

  async scheduleRetry(dispatchId: string, nextAttemptAt: string, reason: string) {
    const dispatch = await this.getDispatch(dispatchId);
    if (!dispatch) {
      return undefined;
    }

    return this.updateDispatch(dispatchId, {
      dispatchStatus: "retry_scheduled",
      nextAttemptAt,
      lastError: reason,
      completedAt: undefined,
      resultSummary: `Retry scheduled: ${reason}`
    });
  }

  async markDeadLetter(dispatchId: string, reason: string) {
    const dispatch = await this.getDispatch(dispatchId);
    if (!dispatch) {
      return undefined;
    }

    return this.updateDispatch(dispatchId, {
      dispatchStatus: "dead_lettered",
      deadLetterReason: reason,
      lastError: reason,
      nextAttemptAt: undefined,
      completedAt: new Date().toISOString(),
      resultSummary: `Dead-lettered: ${reason}`
    });
  }

  async createIncident(input: {
    dispatchId?: string;
    agentId?: string;
    incidentType: string;
    severity: string;
    status: string;
    summary: string;
    detail: Record<string, unknown>;
  }) {
    const result = await this.pool.query(
      `
        INSERT INTO dispatch_operation_incidents (
          incident_id, dispatch_id, agent_id, incident_type, severity, status, summary, detail, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.dispatchId ?? null,
        input.agentId ?? null,
        input.incidentType,
        input.severity,
        input.status,
        input.summary,
        JSON.stringify(input.detail)
      ]
    );
    return mapIncident(result.rows[0] as Record<string, unknown>);
  }

  async resolveIncidentsForDispatch(dispatchId: string) {
    const result = await this.pool.query(
      `
        UPDATE dispatch_operation_incidents
        SET status = 'resolved', resolved_at = NOW()
        WHERE dispatch_id = $1 AND status <> 'resolved'
        RETURNING *;
      `,
      [dispatchId]
    );
    return result.rows.map((row) => mapIncident(row as Record<string, unknown>));
  }

  async listIncidents(filters: { status?: string; incidentType?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.incidentType) {
      values.push(filters.incidentType);
      conditions.push(`incident_type = $${values.length}`);
    }
    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM dispatch_operation_incidents ${whereClause} ORDER BY created_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapIncident(row as Record<string, unknown>));
  }

  async createDeadLetter(input: { dispatchId: string; reason: string; detail: Record<string, unknown> }) {
    const result = await this.pool.query(
      `
        INSERT INTO dispatch_dead_letters (
          dead_letter_id, dispatch_id, reason, detail, created_at
        ) VALUES (
          $1, $2, $3, $4::jsonb, NOW()
        ) ON CONFLICT (dispatch_id) DO UPDATE SET
          reason = EXCLUDED.reason,
          detail = EXCLUDED.detail
        RETURNING *;
      `,
      [randomUUID(), input.dispatchId, input.reason, JSON.stringify(input.detail)]
    );
    return mapDeadLetter(result.rows[0] as Record<string, unknown>);
  }

  async listDeadLetters(limit = 100) {
    const result = await this.pool.query(
      `SELECT * FROM dispatch_dead_letters ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => mapDeadLetter(row as Record<string, unknown>));
  }
}
