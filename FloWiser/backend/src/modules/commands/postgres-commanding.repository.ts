import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
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
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
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
  }) {
    const dispatchId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO command_dispatches (
          dispatch_id, execution_id, action_id, template_id, tenant_id, branch_id, site_id, device_id,
          dispatch_channel, execution_mode, dispatch_status, requested_by, note, command_payload,
          simulation_result, result_summary, requested_at, dispatched_at, completed_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14::jsonb,
          $15::jsonb, $16, $17, $18, $19, NOW(), NOW()
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
        input.completedAt ?? null
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
        next.completedAt ?? null
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
}
