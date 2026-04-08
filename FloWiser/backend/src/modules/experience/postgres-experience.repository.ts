import type { Pool } from "pg";

const toNumber = (value: unknown) => Number(value ?? 0);

const severityRank = (severity: string | null | undefined) => {
  switch (severity) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
};

export class PostgresExperienceRepository {
  constructor(private readonly pool: Pool) {}

  async getOverview() {
    const stats = await this.pool.query(`
      SELECT
        (SELECT COUNT(*)::INTEGER FROM branch_state) AS branch_count,
        (SELECT COUNT(*)::INTEGER FROM branch_state WHERE is_online = TRUE) AS online_branch_count,
        (SELECT COUNT(*)::INTEGER FROM site_state) AS site_count,
        (SELECT COUNT(*)::INTEGER FROM site_state WHERE is_online = TRUE) AS online_site_count,
        (SELECT COUNT(*)::INTEGER FROM alerts WHERE state IN ('open','suppressed')) AS open_alert_count,
        (SELECT COUNT(*)::INTEGER FROM issues WHERE status IN ('open','acknowledged','investigating')) AS open_issue_count,
        (SELECT COUNT(*)::INTEGER FROM recommendations WHERE status = 'open') AS open_recommendation_count,
        (SELECT COUNT(*)::INTEGER FROM recommendations WHERE approval_status = 'pending') AS pending_approval_count,
        (SELECT COALESCE(SUM(expected_monthly_savings), 0) FROM recommendations WHERE status = 'open') AS expected_monthly_savings,
        (SELECT COALESCE(SUM(expected_diesel_savings), 0) FROM recommendations WHERE status = 'open') AS expected_diesel_savings;
    `);

    const topRecommendations = await this.pool.query(`
      SELECT action_id, title, site_id, priority_score, approval_status, recommendation_mode, expected_monthly_savings
      FROM recommendations
      WHERE status = 'open'
      ORDER BY priority_score DESC, last_seen_at DESC
      LIMIT 5;
    `);

    const topAlerts = await this.pool.query(`
      SELECT alert_id, title, site_id, severity, state, last_seen_at
      FROM alerts
      WHERE state IN ('open','suppressed')
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          ELSE 1
        END DESC,
        last_seen_at DESC
      LIMIT 5;
    `);

    const branchHealth = await this.pool.query(`
      SELECT branch_id, health_score, quality_status, open_issue_count, is_online, updated_at
      FROM branch_state
      ORDER BY health_score ASC, open_issue_count DESC, updated_at DESC
      LIMIT 6;
    `);

    const row = stats.rows[0] as Record<string, unknown>;

    return {
      kpis: {
        branchCount: toNumber(row.branch_count),
        onlineBranchCount: toNumber(row.online_branch_count),
        siteCount: toNumber(row.site_count),
        onlineSiteCount: toNumber(row.online_site_count),
        openAlertCount: toNumber(row.open_alert_count),
        openIssueCount: toNumber(row.open_issue_count),
        openRecommendationCount: toNumber(row.open_recommendation_count),
        pendingApprovalCount: toNumber(row.pending_approval_count),
        expectedMonthlySavings: toNumber(row.expected_monthly_savings),
        expectedDieselSavings: toNumber(row.expected_diesel_savings)
      },
      topRecommendations: topRecommendations.rows.map((item) => ({
        actionId: item.action_id,
        title: item.title,
        siteId: item.site_id,
        priorityScore: toNumber(item.priority_score),
        approvalStatus: item.approval_status,
        recommendationMode: item.recommendation_mode,
        expectedMonthlySavings: toNumber(item.expected_monthly_savings)
      })),
      topAlerts: topAlerts.rows.map((item) => ({
        alertId: item.alert_id,
        title: item.title,
        siteId: item.site_id,
        severity: item.severity,
        state: item.state,
        lastSeenAt: item.last_seen_at
      })),
      branchHealth: branchHealth.rows.map((item) => ({
        branchId: item.branch_id,
        healthScore: toNumber(item.health_score),
        qualityStatus: item.quality_status,
        openIssueCount: toNumber(item.open_issue_count),
        isOnline: Boolean(item.is_online),
        updatedAt: item.updated_at
      }))
    };
  }

  async listBranches() {
    const result = await this.pool.query(`
      SELECT branch_id, tenant_id, latest_event_id, latest_telemetry_at, last_received_at, is_online,
             generator_running, grid_available, health_score, quality_status, quality_score,
             quality_flags_count, open_issue_count, updated_at
      FROM branch_state
      ORDER BY health_score ASC, open_issue_count DESC, updated_at DESC;
    `);

    return result.rows.map((item) => ({
      branchId: item.branch_id,
      tenantId: item.tenant_id,
      latestEventId: item.latest_event_id,
      latestTelemetryAt: item.latest_telemetry_at,
      lastReceivedAt: item.last_received_at,
      isOnline: Boolean(item.is_online),
      generatorRunning: item.generator_running,
      gridAvailable: item.grid_available,
      healthScore: toNumber(item.health_score),
      qualityStatus: item.quality_status,
      qualityScore: toNumber(item.quality_score),
      qualityFlagsCount: toNumber(item.quality_flags_count),
      openIssueCount: toNumber(item.open_issue_count),
      updatedAt: item.updated_at,
      attentionLabel:
        toNumber(item.health_score) < 60 || toNumber(item.open_issue_count) > 0 || item.quality_status === 'bad'
          ? 'Attention'
          : Boolean(item.is_online)
            ? 'Healthy'
            : 'Offline'
    }));
  }

  async getBranchDetail(branchId: string) {
    const branchState = await this.pool.query(`
      SELECT * FROM branch_state WHERE branch_id = $1 LIMIT 1;
    `, [branchId]);

    if (!branchState.rowCount) {
      return undefined;
    }

    const sites = await this.pool.query(`
      SELECT site_id, health_score, quality_status, open_issue_count, is_online, latest_telemetry_at
      FROM site_state
      WHERE branch_id = $1
      ORDER BY health_score ASC, open_issue_count DESC, updated_at DESC;
    `, [branchId]);

    const issues = await this.pool.query(`
      SELECT issue_id, title, status, severity, assignee, updated_at
      FROM issues
      WHERE branch_id = $1
      ORDER BY updated_at DESC
      LIMIT 10;
    `, [branchId]);

    const recommendations = await this.pool.query(`
      SELECT action_id, title, priority_score, approval_status, recommendation_mode, expected_monthly_savings
      FROM recommendations
      WHERE branch_id = $1
      ORDER BY priority_score DESC, updated_at DESC
      LIMIT 10;
    `, [branchId]);

    return {
      branch: branchState.rows[0],
      sites: sites.rows,
      issues: issues.rows,
      recommendations: recommendations.rows.map((item) => ({
        actionId: item.action_id,
        title: item.title,
        priorityScore: toNumber(item.priority_score),
        approvalStatus: item.approval_status,
        recommendationMode: item.recommendation_mode,
        expectedMonthlySavings: toNumber(item.expected_monthly_savings)
      }))
    };
  }

  async getSiteDetail(siteId: string) {
    const siteState = await this.pool.query(`
      SELECT * FROM site_state WHERE site_id = $1 LIMIT 1;
    `, [siteId]);

    if (!siteState.rowCount) {
      return undefined;
    }

    const alerts = await this.pool.query(`
      SELECT alert_id, title, severity, state, last_seen_at
      FROM alerts
      WHERE site_id = $1
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 4
          WHEN 'high' THEN 3
          WHEN 'medium' THEN 2
          ELSE 1
        END DESC,
        last_seen_at DESC
      LIMIT 10;
    `, [siteId]);

    const issues = await this.pool.query(`
      SELECT issue_id, title, status, severity, assignee, updated_at
      FROM issues
      WHERE site_id = $1
      ORDER BY updated_at DESC
      LIMIT 10;
    `, [siteId]);

    const recommendations = await this.pool.query(`
      SELECT action_id, title, priority_score, approval_status, recommendation_mode, expected_monthly_savings
      FROM recommendations
      WHERE site_id = $1
      ORDER BY priority_score DESC, updated_at DESC
      LIMIT 10;
    `, [siteId]);

    const ruleTraces = await this.pool.query(`
      SELECT trace_id, rule_id, matched, severity, title, executed_at
      FROM rule_execution_traces
      WHERE site_id = $1
      ORDER BY executed_at DESC
      LIMIT 10;
    `, [siteId]);

    return {
      site: siteState.rows[0],
      alerts: alerts.rows.map((item) => ({
        alertId: item.alert_id,
        title: item.title,
        severity: item.severity,
        state: item.state,
        lastSeenAt: item.last_seen_at
      })),
      issues: issues.rows,
      recommendations: recommendations.rows.map((item) => ({
        actionId: item.action_id,
        title: item.title,
        priorityScore: toNumber(item.priority_score),
        approvalStatus: item.approval_status,
        recommendationMode: item.recommendation_mode,
        expectedMonthlySavings: toNumber(item.expected_monthly_savings)
      })),
      ruleTraces: ruleTraces.rows.map((item) => ({
        traceId: item.trace_id,
        ruleId: item.rule_id,
        matched: item.matched,
        severity: item.severity,
        title: item.title,
        executedAt: item.executed_at
      }))
    };
  }

  async getExecutive() {
    const portfolioStats = await this.pool.query(`
      SELECT
        (SELECT COUNT(*)::INTEGER FROM branch_state) AS branch_count,
        (SELECT COUNT(*)::INTEGER FROM site_state) AS site_count,
        (SELECT COUNT(*)::INTEGER FROM branch_state WHERE health_score >= 80 AND open_issue_count = 0) AS healthy_branch_count,
        (SELECT COUNT(*)::INTEGER FROM branch_state WHERE health_score < 80 OR open_issue_count > 0 OR quality_status <> 'good') AS attention_branch_count,
        (SELECT COALESCE(SUM(expected_monthly_savings), 0) FROM recommendations WHERE status = 'open') AS expected_monthly_savings,
        (SELECT COALESCE(SUM(expected_diesel_savings), 0) FROM recommendations WHERE status = 'open') AS expected_diesel_savings,
        (SELECT COUNT(*)::INTEGER FROM recommendations WHERE approval_status = 'pending') AS pending_approval_count,
        (SELECT COUNT(*)::INTEGER FROM alerts WHERE state IN ('open','suppressed') AND severity = 'critical') AS critical_alert_count;
    `);

    const worstBranches = await this.pool.query(`
      SELECT branch_id, health_score, quality_status, open_issue_count, is_online
      FROM branch_state
      ORDER BY health_score ASC, open_issue_count DESC, updated_at DESC
      LIMIT 5;
    `);

    const biggestOpportunities = await this.pool.query(`
      SELECT action_id, title, branch_id, site_id, priority_score, expected_monthly_savings, expected_diesel_savings
      FROM recommendations
      WHERE status = 'open'
      ORDER BY priority_score DESC, expected_monthly_savings DESC
      LIMIT 5;
    `);

    const unresolvedIssuesByBranch = await this.pool.query(`
      SELECT branch_id, COUNT(*)::INTEGER AS issue_count
      FROM issues
      WHERE status IN ('open','acknowledged','investigating')
      GROUP BY branch_id
      ORDER BY issue_count DESC, branch_id ASC
      LIMIT 5;
    `);

    const statsRow = portfolioStats.rows[0] as Record<string, unknown>;

    return {
      portfolio: {
        branchCount: toNumber(statsRow.branch_count),
        siteCount: toNumber(statsRow.site_count),
        healthyBranchCount: toNumber(statsRow.healthy_branch_count),
        attentionBranchCount: toNumber(statsRow.attention_branch_count),
        expectedMonthlySavings: toNumber(statsRow.expected_monthly_savings),
        expectedDieselSavings: toNumber(statsRow.expected_diesel_savings),
        pendingApprovalCount: toNumber(statsRow.pending_approval_count),
        criticalAlertCount: toNumber(statsRow.critical_alert_count)
      },
      worstBranches: worstBranches.rows.map((item) => ({
        branchId: item.branch_id,
        healthScore: toNumber(item.health_score),
        qualityStatus: item.quality_status,
        openIssueCount: toNumber(item.open_issue_count),
        isOnline: Boolean(item.is_online)
      })),
      biggestOpportunities: biggestOpportunities.rows.map((item) => ({
        actionId: item.action_id,
        title: item.title,
        branchId: item.branch_id,
        siteId: item.site_id,
        priorityScore: toNumber(item.priority_score),
        expectedMonthlySavings: toNumber(item.expected_monthly_savings),
        expectedDieselSavings: toNumber(item.expected_diesel_savings)
      })),
      unresolvedIssuesByBranch: unresolvedIssuesByBranch.rows.map((item) => ({
        branchId: item.branch_id,
        issueCount: toNumber(item.issue_count)
      }))
    };
  }
}
