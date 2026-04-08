import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type {
  RecommendationVerificationContext,
  VerificationSnapshotRecord
} from "./reporting.types.js";

const toNumber = (value: unknown) => Number(value ?? 0);

const mapVerification = (row: Record<string, unknown>): VerificationSnapshotRecord => ({
  snapshotId: row.snapshot_id as string,
  actionId: row.action_id as string,
  executionId: (row.execution_id as string | null) ?? undefined,
  dispatchId: (row.dispatch_id as string | null) ?? undefined,
  tenantId: row.tenant_id as string,
  branchId: row.branch_id as string,
  siteId: row.site_id as string,
  deviceId: (row.device_id as string | null) ?? undefined,
  verificationStatus: row.verification_status as VerificationSnapshotRecord["verificationStatus"],
  verificationBasis: row.verification_basis as string,
  expectedMonthlySavings: toNumber(row.expected_monthly_savings),
  expectedDieselSavings: toNumber(row.expected_diesel_savings),
  realizedMonthlySavings: toNumber(row.realized_monthly_savings),
  realizedDieselSavings: toNumber(row.realized_diesel_savings),
  realizationRate: toNumber(row.realization_rate),
  implementationCostProxy: toNumber(row.implementation_cost_proxy),
  roiScore: toNumber(row.roi_score),
  paybackMonths: row.payback_months == null ? undefined : toNumber(row.payback_months),
  verificationNote: (row.verification_note as string | null) ?? undefined,
  verifiedBy: row.verified_by as string,
  measuredAt: row.measured_at as string,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string
});

export class PostgresReportingRepository {
  constructor(private readonly pool: Pool) {}

  async getRecommendationVerificationContext(actionId: string): Promise<RecommendationVerificationContext | undefined> {
    const result = await this.pool.query(
      `
        SELECT
          recommendation.action_id,
          recommendation.tenant_id,
          recommendation.branch_id,
          recommendation.site_id,
          recommendation.device_id,
          recommendation.title,
          recommendation.action_type,
          recommendation.status AS recommendation_status,
          recommendation.approval_status,
          recommendation.expected_monthly_savings,
          recommendation.expected_diesel_savings,
          recommendation.confidence_score,
          recommendation.effort_score,
          recommendation.last_seen_at,
          execution.execution_id,
          execution.execution_mode,
          execution.status AS execution_status,
          execution.requested_at AS execution_requested_at,
          execution.completed_at AS execution_completed_at,
          dispatch.dispatch_id,
          dispatch.dispatch_channel,
          dispatch.dispatch_status,
          dispatch.requested_at AS dispatch_requested_at,
          dispatch.completed_at AS dispatch_completed_at,
          dispatch.simulation_result
        FROM recommendations recommendation
        LEFT JOIN LATERAL (
          SELECT *
          FROM action_execution_requests execution
          WHERE execution.action_id = recommendation.action_id
          ORDER BY execution.requested_at DESC
          LIMIT 1
        ) execution ON TRUE
        LEFT JOIN LATERAL (
          SELECT *
          FROM command_dispatches dispatch
          WHERE (execution.execution_id IS NOT NULL AND dispatch.execution_id = execution.execution_id)
             OR dispatch.action_id = recommendation.action_id
          ORDER BY dispatch.requested_at DESC
          LIMIT 1
        ) dispatch ON TRUE
        WHERE recommendation.action_id = $1
        LIMIT 1;
      `,
      [actionId]
    );

    if (!result.rowCount) {
      return undefined;
    }

    const row = result.rows[0] as Record<string, unknown>;
    return {
      actionId: row.action_id as string,
      tenantId: row.tenant_id as string,
      branchId: row.branch_id as string,
      siteId: row.site_id as string,
      deviceId: (row.device_id as string | null) ?? undefined,
      title: row.title as string,
      actionType: row.action_type as string,
      recommendationStatus: row.recommendation_status as string,
      approvalStatus: row.approval_status as string,
      expectedMonthlySavings: toNumber(row.expected_monthly_savings),
      expectedDieselSavings: toNumber(row.expected_diesel_savings),
      confidenceScore: toNumber(row.confidence_score),
      effortScore: toNumber(row.effort_score),
      lastSeenAt: row.last_seen_at as string,
      executionId: (row.execution_id as string | null) ?? undefined,
      executionMode: (row.execution_mode as string | null) ?? undefined,
      executionStatus: (row.execution_status as string | null) ?? undefined,
      executionRequestedAt: (row.execution_requested_at as string | null) ?? undefined,
      executionCompletedAt: (row.execution_completed_at as string | null) ?? undefined,
      dispatchId: (row.dispatch_id as string | null) ?? undefined,
      dispatchChannel: (row.dispatch_channel as string | null) ?? undefined,
      dispatchStatus: (row.dispatch_status as string | null) ?? undefined,
      dispatchRequestedAt: (row.dispatch_requested_at as string | null) ?? undefined,
      dispatchCompletedAt: (row.dispatch_completed_at as string | null) ?? undefined,
      simulationResult: (row.simulation_result as Record<string, unknown> | null) ?? undefined
    };
  }

  async createVerificationSnapshot(input: Omit<VerificationSnapshotRecord, "snapshotId" | "createdAt" | "updatedAt">) {
    const result = await this.pool.query(
      `
        INSERT INTO verification_snapshots (
          snapshot_id, action_id, execution_id, dispatch_id, tenant_id, branch_id, site_id, device_id,
          verification_status, verification_basis, expected_monthly_savings, expected_diesel_savings,
          realized_monthly_savings, realized_diesel_savings, realization_rate, implementation_cost_proxy,
          roi_score, payback_months, verification_note, verified_by, measured_at, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20, $21, NOW(), NOW()
        ) RETURNING *;
      `,
      [
        randomUUID(),
        input.actionId,
        input.executionId ?? null,
        input.dispatchId ?? null,
        input.tenantId,
        input.branchId,
        input.siteId,
        input.deviceId ?? null,
        input.verificationStatus,
        input.verificationBasis,
        input.expectedMonthlySavings,
        input.expectedDieselSavings,
        input.realizedMonthlySavings,
        input.realizedDieselSavings,
        input.realizationRate,
        input.implementationCostProxy,
        input.roiScore,
        input.paybackMonths ?? null,
        input.verificationNote ?? null,
        input.verifiedBy,
        input.measuredAt
      ]
    );

    return mapVerification(result.rows[0] as Record<string, unknown>);
  }

  async listVerificationSnapshots(filters: { siteId?: string; actionId?: string; verificationStatus?: string; limit?: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filters.siteId) {
      values.push(filters.siteId);
      conditions.push(`site_id = $${values.length}`);
    }
    if (filters.actionId) {
      values.push(filters.actionId);
      conditions.push(`action_id = $${values.length}`);
    }
    if (filters.verificationStatus) {
      values.push(filters.verificationStatus);
      conditions.push(`verification_status = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await this.pool.query(
      `SELECT * FROM verification_snapshots ${whereClause} ORDER BY measured_at DESC LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapVerification(row as Record<string, unknown>));
  }

  async getRecommendationVerification(actionId: string) {
    const recommendation = await this.pool.query(
      `SELECT action_id, title, site_id, branch_id, status, approval_status, expected_monthly_savings, expected_diesel_savings
       FROM recommendations WHERE action_id = $1 LIMIT 1`,
      [actionId]
    );

    if (!recommendation.rowCount) {
      return undefined;
    }

    const snapshots = await this.pool.query(
      `SELECT * FROM verification_snapshots WHERE action_id = $1 ORDER BY measured_at DESC`,
      [actionId]
    );

    return {
      recommendation: recommendation.rows[0],
      snapshots: snapshots.rows.map((row) => mapVerification(row as Record<string, unknown>))
    };
  }

  async getOverview() {
    const result = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        ORDER BY action_id, measured_at DESC
      )
      SELECT
        COUNT(*)::INTEGER AS verified_action_count,
        COUNT(*) FILTER (WHERE verification_status = 'realized')::INTEGER AS realized_action_count,
        COUNT(*) FILTER (WHERE verification_status = 'partially_realized')::INTEGER AS partial_action_count,
        COUNT(*) FILTER (WHERE verification_status = 'not_realized')::INTEGER AS not_realized_action_count,
        COALESCE(SUM(expected_monthly_savings), 0) AS expected_monthly_savings,
        COALESCE(SUM(realized_monthly_savings), 0) AS realized_monthly_savings,
        COALESCE(SUM(expected_diesel_savings), 0) AS expected_diesel_savings,
        COALESCE(SUM(realized_diesel_savings), 0) AS realized_diesel_savings,
        COALESCE(AVG(realization_rate), 0) AS average_realization_rate,
        COALESCE(AVG(roi_score), 0) AS average_roi_score
      FROM latest;
    `);

    const topVerified = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        ORDER BY action_id, measured_at DESC
      )
      SELECT action_id, site_id, realized_monthly_savings, realization_rate, verification_status
      FROM latest
      ORDER BY realized_monthly_savings DESC, realization_rate DESC
      LIMIT 5;
    `);

    const recent = await this.pool.query(`
      SELECT snapshot_id, action_id, site_id, verification_status, realized_monthly_savings, measured_at
      FROM verification_snapshots
      ORDER BY measured_at DESC
      LIMIT 10;
    `);

    const row = result.rows[0] as Record<string, unknown>;
    return {
      summary: {
        verifiedActionCount: toNumber(row.verified_action_count),
        realizedActionCount: toNumber(row.realized_action_count),
        partialActionCount: toNumber(row.partial_action_count),
        notRealizedActionCount: toNumber(row.not_realized_action_count),
        expectedMonthlySavings: toNumber(row.expected_monthly_savings),
        realizedMonthlySavings: toNumber(row.realized_monthly_savings),
        expectedDieselSavings: toNumber(row.expected_diesel_savings),
        realizedDieselSavings: toNumber(row.realized_diesel_savings),
        averageRealizationRate: toNumber(row.average_realization_rate),
        averageRoiScore: toNumber(row.average_roi_score)
      },
      topVerifiedActions: topVerified.rows.map((item) => ({
        actionId: item.action_id,
        siteId: item.site_id,
        realizedMonthlySavings: toNumber(item.realized_monthly_savings),
        realizationRate: toNumber(item.realization_rate),
        verificationStatus: item.verification_status
      })),
      recentVerifications: recent.rows.map((item) => ({
        snapshotId: item.snapshot_id,
        actionId: item.action_id,
        siteId: item.site_id,
        verificationStatus: item.verification_status,
        realizedMonthlySavings: toNumber(item.realized_monthly_savings),
        measuredAt: item.measured_at
      }))
    };
  }

  async getExecutiveReport() {
    const result = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        ORDER BY action_id, measured_at DESC
      )
      SELECT
        COUNT(*)::INTEGER AS verified_action_count,
        COALESCE(SUM(expected_monthly_savings), 0) AS expected_monthly_savings,
        COALESCE(SUM(realized_monthly_savings), 0) AS realized_monthly_savings,
        COALESCE(SUM(expected_diesel_savings), 0) AS expected_diesel_savings,
        COALESCE(SUM(realized_diesel_savings), 0) AS realized_diesel_savings,
        COALESCE(AVG(realization_rate), 0) AS average_realization_rate,
        COALESCE(SUM(realized_monthly_savings) / NULLIF(SUM(expected_monthly_savings), 0), 0) AS capture_rate
      FROM latest;
    `);

    const branchCapture = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        ORDER BY action_id, measured_at DESC
      )
      SELECT branch_id,
             COALESCE(SUM(expected_monthly_savings), 0) AS expected_monthly_savings,
             COALESCE(SUM(realized_monthly_savings), 0) AS realized_monthly_savings,
             COALESCE(AVG(realization_rate), 0) AS average_realization_rate
      FROM latest
      GROUP BY branch_id
      ORDER BY realized_monthly_savings DESC, average_realization_rate DESC
      LIMIT 5;
    `);

    const underperforming = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        ORDER BY action_id, measured_at DESC
      )
      SELECT action_id, site_id, verification_status, realization_rate, expected_monthly_savings, realized_monthly_savings
      FROM latest
      WHERE expected_monthly_savings > 0
      ORDER BY realization_rate ASC, expected_monthly_savings DESC
      LIMIT 5;
    `);

    const row = result.rows[0] as Record<string, unknown>;
    return {
      portfolio: {
        verifiedActionCount: toNumber(row.verified_action_count),
        expectedMonthlySavings: toNumber(row.expected_monthly_savings),
        realizedMonthlySavings: toNumber(row.realized_monthly_savings),
        expectedDieselSavings: toNumber(row.expected_diesel_savings),
        realizedDieselSavings: toNumber(row.realized_diesel_savings),
        averageRealizationRate: toNumber(row.average_realization_rate),
        captureRate: toNumber(row.capture_rate)
      },
      branchCapture: branchCapture.rows.map((item) => ({
        branchId: item.branch_id,
        expectedMonthlySavings: toNumber(item.expected_monthly_savings),
        realizedMonthlySavings: toNumber(item.realized_monthly_savings),
        averageRealizationRate: toNumber(item.average_realization_rate)
      })),
      underperformingActions: underperforming.rows.map((item) => ({
        actionId: item.action_id,
        siteId: item.site_id,
        verificationStatus: item.verification_status,
        realizationRate: toNumber(item.realization_rate),
        expectedMonthlySavings: toNumber(item.expected_monthly_savings),
        realizedMonthlySavings: toNumber(item.realized_monthly_savings)
      }))
    };
  }

  async getSiteReport(siteId: string) {
    const result = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        WHERE site_id = $1
        ORDER BY action_id, measured_at DESC
      )
      SELECT
        COUNT(*)::INTEGER AS verified_action_count,
        COALESCE(SUM(expected_monthly_savings), 0) AS expected_monthly_savings,
        COALESCE(SUM(realized_monthly_savings), 0) AS realized_monthly_savings,
        COALESCE(SUM(expected_diesel_savings), 0) AS expected_diesel_savings,
        COALESCE(SUM(realized_diesel_savings), 0) AS realized_diesel_savings,
        COALESCE(AVG(realization_rate), 0) AS average_realization_rate
      FROM latest;
    `, [siteId]);

    const latestActions = await this.pool.query(`
      WITH latest AS (
        SELECT DISTINCT ON (action_id) *
        FROM verification_snapshots
        WHERE site_id = $1
        ORDER BY action_id, measured_at DESC
      )
      SELECT action_id, verification_status, realized_monthly_savings, realization_rate, measured_at
      FROM latest
      ORDER BY measured_at DESC
      LIMIT 10;
    `, [siteId]);

    const row = result.rows[0] as Record<string, unknown>;
    return {
      siteId,
      summary: {
        verifiedActionCount: toNumber(row.verified_action_count),
        expectedMonthlySavings: toNumber(row.expected_monthly_savings),
        realizedMonthlySavings: toNumber(row.realized_monthly_savings),
        expectedDieselSavings: toNumber(row.expected_diesel_savings),
        realizedDieselSavings: toNumber(row.realized_diesel_savings),
        averageRealizationRate: toNumber(row.average_realization_rate)
      },
      latestActions: latestActions.rows.map((item) => ({
        actionId: item.action_id,
        verificationStatus: item.verification_status,
        realizedMonthlySavings: toNumber(item.realized_monthly_savings),
        realizationRate: toNumber(item.realization_rate),
        measuredAt: item.measured_at
      }))
    };
  }
}
