import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  RecommendationDecisionInput,
  RecommendationRecord,
  RecommendationStatus
} from "./recommendation.types.js";

type RecommendationUpsertInput = Omit<RecommendationRecord, "actionId" | "createdAt" | "updatedAt">;

const mapRecommendation = (row: Record<string, unknown>): RecommendationRecord => ({
  actionId: row.action_id as string,
  recommendationKey: row.recommendation_key as string,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  eventId: row.event_id as string,
  ruleId: row.rule_id as string,
  rootCauseKey: row.root_cause_key as string,
  rootCauseLabel: row.root_cause_label as string,
  likelyCause: row.likely_cause as string,
  title: row.title as string,
  summary: row.summary as string,
  actionType: row.action_type as string,
  recommendationMode: row.recommendation_mode as RecommendationRecord["recommendationMode"],
  approvalStatus: row.approval_status as RecommendationRecord["approvalStatus"],
  status: row.status as RecommendationStatus,
  automationPossible: row.automation_possible as boolean,
  effortScore: row.effort_score as number,
  confidenceScore: row.confidence_score as number,
  savingsScore: row.savings_score as number,
  dieselScore: row.diesel_score as number,
  uptimeImpactScore: row.uptime_impact_score as number,
  failureRiskScore: row.failure_risk_score as number,
  priorityScore: Number(row.priority_score),
  expectedMonthlySavings: Number(row.expected_monthly_savings),
  expectedDieselSavings: Number(row.expected_diesel_savings),
  evidence: (row.evidence as Record<string, unknown>) ?? {},
  lastSeenAt: row.last_seen_at as string,
  approvedBy: (row.approved_by as string | null) ?? undefined,
  approvedAt: (row.approved_at as string | null) ?? undefined,
  rejectedBy: (row.rejected_by as string | null) ?? undefined,
  rejectedAt: (row.rejected_at as string | null) ?? undefined,
  approvalNote: (row.approval_note as string | null) ?? undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

export class PostgresRecommendationRepository {
  constructor(private readonly pool: Pool) {}

  async upsertRecommendation(input: RecommendationUpsertInput) {
    const actionId = randomUUID();
    const result = await this.pool.query(
      `
        INSERT INTO recommendations (
          action_id, recommendation_key, tenant_id, branch_id, site_id, device_id, event_id, rule_id,
          root_cause_key, root_cause_label, likely_cause, title, summary, action_type, recommendation_mode,
          approval_status, status, automation_possible, effort_score, confidence_score, savings_score,
          diesel_score, uptime_impact_score, failure_risk_score, priority_score, expected_monthly_savings,
          expected_diesel_savings, evidence, last_seen_at, approved_by, approved_at, rejected_by, rejected_at,
          approval_note, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21,
          $22, $23, $24, $25, $26,
          $27, $28::jsonb, $29, $30, $31, $32, $33,
          $34, NOW(), NOW()
        )
        ON CONFLICT (recommendation_key) DO UPDATE SET
          event_id = EXCLUDED.event_id,
          title = EXCLUDED.title,
          summary = EXCLUDED.summary,
          root_cause_key = EXCLUDED.root_cause_key,
          root_cause_label = EXCLUDED.root_cause_label,
          likely_cause = EXCLUDED.likely_cause,
          action_type = EXCLUDED.action_type,
          recommendation_mode = EXCLUDED.recommendation_mode,
          automation_possible = EXCLUDED.automation_possible,
          effort_score = EXCLUDED.effort_score,
          confidence_score = EXCLUDED.confidence_score,
          savings_score = EXCLUDED.savings_score,
          diesel_score = EXCLUDED.diesel_score,
          uptime_impact_score = EXCLUDED.uptime_impact_score,
          failure_risk_score = EXCLUDED.failure_risk_score,
          priority_score = EXCLUDED.priority_score,
          expected_monthly_savings = EXCLUDED.expected_monthly_savings,
          expected_diesel_savings = EXCLUDED.expected_diesel_savings,
          evidence = EXCLUDED.evidence,
          last_seen_at = EXCLUDED.last_seen_at,
          updated_at = NOW()
        RETURNING *;
      `,
      [
        actionId,
        input.recommendationKey,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.eventId,
        input.ruleId,
        input.rootCauseKey,
        input.rootCauseLabel,
        input.likelyCause,
        input.title,
        input.summary,
        input.actionType,
        input.recommendationMode,
        input.approvalStatus,
        input.status,
        input.automationPossible,
        input.effortScore,
        input.confidenceScore,
        input.savingsScore,
        input.dieselScore,
        input.uptimeImpactScore,
        input.failureRiskScore,
        input.priorityScore,
        input.expectedMonthlySavings,
        input.expectedDieselSavings,
        JSON.stringify(input.evidence),
        input.lastSeenAt,
        input.approvedBy ?? null,
        input.approvedAt ?? null,
        input.rejectedBy ?? null,
        input.rejectedAt ?? null,
        input.approvalNote ?? null
      ]
    );

    return mapRecommendation(result.rows[0] as Record<string, unknown>);
  }

  async getRecommendation(actionId: string) {
    const result = await this.pool.query("SELECT * FROM recommendations WHERE action_id = $1 LIMIT 1", [actionId]);
    return result.rowCount ? mapRecommendation(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async listRecommendations(filters: {
    siteId?: string;
    deviceId?: string;
    status?: string;
    approvalStatus?: string;
    ruleId?: string;
    limit?: number;
  }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.deviceId) {
      values.push(filters.deviceId);
      conditions.push(`device_id = $${values.length}`);
    }
    if (filters.status) {
      values.push(filters.status);
      conditions.push(`status = $${values.length}`);
    }
    if (filters.approvalStatus) {
      values.push(filters.approvalStatus);
      conditions.push(`approval_status = $${values.length}`);
    }
    if (filters.ruleId) {
      values.push(filters.ruleId);
      conditions.push(`rule_id = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM recommendations ${whereClause} ORDER BY priority_score DESC, last_seen_at DESC LIMIT $${values.length}`,
      values
    );
    return result.rows.map((row) => mapRecommendation(row as Record<string, unknown>));
  }

  async applyDecision(actionId: string, decision: "approve" | "reject" | "resolve", input?: RecommendationDecisionInput) {
    const current = await this.getRecommendation(actionId);
    if (!current) {
      return undefined;
    }

    const now = new Date().toISOString();
    const next = {
      ...current,
      approvalStatus:
        decision === "approve"
          ? "approved"
          : decision === "reject"
            ? "rejected"
            : current.approvalStatus,
      status:
        decision === "approve"
          ? "approved"
          : decision === "reject"
            ? "rejected"
            : "resolved",
      approvedBy: decision === "approve" ? input?.actor : current.approvedBy,
      approvedAt: decision === "approve" ? now : current.approvedAt,
      rejectedBy: decision === "reject" ? input?.actor : current.rejectedBy,
      rejectedAt: decision === "reject" ? now : current.rejectedAt,
      approvalNote: input?.note ?? current.approvalNote
    };

    const result = await this.pool.query(
      `
        UPDATE recommendations
        SET approval_status = $2,
            status = $3,
            approved_by = $4,
            approved_at = $5,
            rejected_by = $6,
            rejected_at = $7,
            approval_note = $8,
            updated_at = NOW()
        WHERE action_id = $1
        RETURNING *;
      `,
      [
        actionId,
        next.approvalStatus,
        next.status,
        next.approvedBy ?? null,
        next.approvedAt ?? null,
        next.rejectedBy ?? null,
        next.rejectedAt ?? null,
        next.approvalNote ?? null
      ]
    );

    return mapRecommendation(result.rows[0] as Record<string, unknown>);
  }
}
