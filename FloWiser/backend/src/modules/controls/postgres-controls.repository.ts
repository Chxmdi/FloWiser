import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  ActionExecutionApprovalRecord,
  ActionExecutionRecord,
  ControlApprovalPolicy,
  ControlPolicyUpdateInput,
  GuardrailOutcome
} from "./control.types.js";

const mapPolicy = (row: Record<string, unknown>): ControlApprovalPolicy => ({
  policyId: row.policy_id as string,
  name: row.name as string,
  actionType: row.action_type as string,
  recommendationMode: row.recommendation_mode as string,
  allowedExecutionModes: ((row.allowed_execution_modes as string[]) ?? []) as ControlApprovalPolicy["allowedExecutionModes"],
  minExecutionApprovals: Number(row.min_execution_approvals),
  requiresTwoPerson: Boolean(row.requires_two_person),
  enabled: Boolean(row.enabled),
  maxOpenCriticalAlerts: Number(row.max_open_critical_alerts),
  minConfidenceScore: Number(row.min_confidence_score),
  maxRecommendationAgeHours: Number(row.max_recommendation_age_hours),
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapExecution = (row: Record<string, unknown>): ActionExecutionRecord => ({
  executionId: row.execution_id as string,
  actionId: row.action_id as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  actionType: row.action_type as string,
  recommendationMode: row.recommendation_mode as string,
  executionMode: row.execution_mode as ActionExecutionRecord["executionMode"],
  status: row.status as ActionExecutionRecord["status"],
  requestedBy: row.requested_by as string,
  note: (row.note as string | null) ?? undefined,
  policyId: (row.policy_id as string | null) ?? undefined,
  guardrailOutcome: (row.guardrail_outcome as GuardrailOutcome) ?? {
    ready: false,
    blocks: ["Missing guardrail outcome"],
    warnings: [],
    snapshot: {
      criticalAlertCount: 0,
      recommendationAgeHours: 0,
      confidenceScore: 0,
      recommendationStatus: "unknown",
      approvalStatus: "unknown"
    }
  },
  approvalCount: Number(row.approval_count ?? 0),
  resultSummary: (row.result_summary as string | null) ?? undefined,
  requestedAt: row.requested_at as string,
  executedAt: (row.executed_at as string | null) ?? undefined,
  completedAt: (row.completed_at as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

const mapApproval = (row: Record<string, unknown>): ActionExecutionApprovalRecord => ({
  approvalId: row.approval_id as string,
  executionId: row.execution_id as string,
  approver: row.approver as string,
  role: (row.role as string | null) ?? undefined,
  note: (row.note as string | null) ?? undefined,
  approvedAt: row.approved_at as string,
  createdAt: row.created_at as string
});

export class PostgresControlsRepository {
  constructor(private readonly pool: Pool) {}

  async ensureDefaults(defaults: ControlApprovalPolicy[]) {
    for (const policy of defaults) {
      await this.pool.query(
        `
          INSERT INTO control_approval_policies (
            policy_id, name, action_type, recommendation_mode, allowed_execution_modes,
            min_execution_approvals, requires_two_person, enabled, max_open_critical_alerts,
            min_confidence_score, max_recommendation_age_hours, created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5::jsonb,
            $6, $7, $8, $9,
            $10, $11, NOW(), NOW()
          ) ON CONFLICT (policy_id) DO NOTHING;
        `,
        [
          policy.policyId,
          policy.name,
          policy.actionType,
          policy.recommendationMode,
          JSON.stringify(policy.allowedExecutionModes),
          policy.minExecutionApprovals,
          policy.requiresTwoPerson,
          policy.enabled,
          policy.maxOpenCriticalAlerts,
          policy.minConfidenceScore,
          policy.maxRecommendationAgeHours
        ]
      );
    }
  }

  async listPolicies() {
    const result = await this.pool.query("SELECT * FROM control_approval_policies ORDER BY action_type, recommendation_mode, name");
    return result.rows.map((row) => mapPolicy(row as Record<string, unknown>));
  }

  async getPolicy(policyId: string) {
    const result = await this.pool.query("SELECT * FROM control_approval_policies WHERE policy_id = $1 LIMIT 1", [policyId]);
    return result.rowCount ? mapPolicy(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findPolicy(actionType: string, recommendationMode: string) {
    const result = await this.pool.query(
      "SELECT * FROM control_approval_policies WHERE action_type = $1 AND recommendation_mode = $2 LIMIT 1",
      [actionType, recommendationMode]
    );
    return result.rowCount ? mapPolicy(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updatePolicy(policyId: string, patch: ControlPolicyUpdateInput) {
    const current = await this.getPolicy(policyId);
    if (!current) {
      return undefined;
    }

    const next = {
      ...current,
      ...patch,
      allowedExecutionModes: patch.allowedExecutionModes ?? current.allowedExecutionModes,
      minExecutionApprovals: patch.minExecutionApprovals ?? current.minExecutionApprovals,
      requiresTwoPerson: patch.requiresTwoPerson ?? current.requiresTwoPerson,
      enabled: patch.enabled ?? current.enabled,
      maxOpenCriticalAlerts: patch.maxOpenCriticalAlerts ?? current.maxOpenCriticalAlerts,
      minConfidenceScore: patch.minConfidenceScore ?? current.minConfidenceScore,
      maxRecommendationAgeHours: patch.maxRecommendationAgeHours ?? current.maxRecommendationAgeHours
    };

    const result = await this.pool.query(
      `
        UPDATE control_approval_policies
        SET allowed_execution_modes = $2::jsonb,
            min_execution_approvals = $3,
            requires_two_person = $4,
            enabled = $5,
            max_open_critical_alerts = $6,
            min_confidence_score = $7,
            max_recommendation_age_hours = $8,
            updated_at = NOW()
        WHERE policy_id = $1
        RETURNING *;
      `,
      [
        policyId,
        JSON.stringify(next.allowedExecutionModes),
        next.minExecutionApprovals,
        next.requiresTwoPerson,
        next.enabled,
        next.maxOpenCriticalAlerts,
        next.minConfidenceScore,
        next.maxRecommendationAgeHours
      ]
    );

    return mapPolicy(result.rows[0] as Record<string, unknown>);
  }

  async countCriticalOpenAlerts(siteId: string) {
    const result = await this.pool.query(
      "SELECT COUNT(*)::INTEGER AS total FROM alerts WHERE site_id = $1 AND state IN ('open','suppressed') AND severity = 'critical'",
      [siteId]
    );
    return Number(result.rows[0]?.total ?? 0);
  }

  async createExecutionRequest(input: {
    actionId: string;
    tenantId: string;
    branchId: string;
    siteId: string;
    deviceId?: string;
    actionType: string;
    recommendationMode: string;
    executionMode: ActionExecutionRecord["executionMode"];
    status: ActionExecutionRecord["status"];
    requestedBy: string;
    note?: string;
    policyId?: string;
    guardrailOutcome: GuardrailOutcome;
    requestedAt: string;
  }) {
    const executionId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO action_execution_requests (
          execution_id, action_id, tenant_id, branch_id, site_id, device_id, action_type, recommendation_mode,
          execution_mode, status, requested_by, note, policy_id, guardrail_outcome, requested_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14::jsonb, $15, NOW(), NOW()
        ) RETURNING *, 0::INTEGER AS approval_count;
      `,
      [
        executionId,
        input.actionId,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.actionType,
        input.recommendationMode,
        input.executionMode,
        input.status,
        input.requestedBy,
        input.note ?? null,
        input.policyId ?? null,
        JSON.stringify(input.guardrailOutcome),
        input.requestedAt
      ]
    );
    return mapExecution(result.rows[0] as Record<string, unknown>);
  }

  async listExecutionRequests(filters: { siteId?: string; status?: string; actionId?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`request.site_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`request.status = $${values.length}`);
    }
    if (filters.actionId) {
      values.push(filters.actionId);
      conditions.push(`request.action_id = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `
        SELECT request.*, COALESCE(COUNT(approval.approval_id), 0)::INTEGER AS approval_count
        FROM action_execution_requests request
        LEFT JOIN action_execution_approvals approval ON approval.execution_id = request.execution_id
        ${whereClause}
        GROUP BY request.execution_id
        ORDER BY request.requested_at DESC
        LIMIT $${values.length};
      `,
      values
    );

    return result.rows.map((row) => mapExecution(row as Record<string, unknown>));
  }

  async getExecutionRequest(executionId: string) {
    const result = await this.pool.query(
      `
        SELECT request.*, COALESCE(COUNT(approval.approval_id), 0)::INTEGER AS approval_count
        FROM action_execution_requests request
        LEFT JOIN action_execution_approvals approval ON approval.execution_id = request.execution_id
        WHERE request.execution_id = $1
        GROUP BY request.execution_id
        LIMIT 1;
      `,
      [executionId]
    );
    return result.rowCount ? mapExecution(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async updateExecutionRequest(executionId: string, patch: Partial<ActionExecutionRecord>) {
    const current = await this.getExecutionRequest(executionId);
    if (!current) {
      return undefined;
    }

    const next = { ...current, ...patch };
    const result = await this.pool.query(
      `
        UPDATE action_execution_requests
        SET status = $2,
            policy_id = $3,
            guardrail_outcome = $4::jsonb,
            result_summary = $5,
            executed_at = $6,
            completed_at = $7,
            updated_at = NOW()
        WHERE execution_id = $1
        RETURNING *;
      `,
      [
        executionId,
        next.status,
        next.policyId ?? null,
        JSON.stringify(next.guardrailOutcome),
        next.resultSummary ?? null,
        next.executedAt ?? null,
        next.completedAt ?? null
      ]
    );

    const approvalCount = current.approvalCount;
    return mapExecution({ ...(result.rows[0] as Record<string, unknown>), approval_count: approvalCount });
  }

  async createApproval(input: { executionId: string; approver: string; role?: string; note?: string; approvedAt: string }) {
    const result = await this.pool.query(
      `
        INSERT INTO action_execution_approvals (
          approval_id, execution_id, approver, role, note, approved_at, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        ) ON CONFLICT (execution_id, approver) DO NOTHING
        RETURNING *;
      `,
      [randomUUID(), input.executionId, input.approver, input.role ?? null, input.note ?? null, input.approvedAt]
    );
    return result.rowCount ? mapApproval(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listApprovals(executionId: string) {
    const result = await this.pool.query(
      "SELECT * FROM action_execution_approvals WHERE execution_id = $1 ORDER BY approved_at ASC",
      [executionId]
    );
    return result.rows.map((row) => mapApproval(row as Record<string, unknown>));
  }
}
