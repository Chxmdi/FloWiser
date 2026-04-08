import Link from "next/link";
import { MetricCard } from "../components/cards/metric-card";
import { SimpleTable } from "../components/tables/simple-table";
import { fetchBackendJson, formatCurrency } from "../lib/backend-api";

const fallbackOverview = {
  kpis: {
    branchCount: 3,
    onlineBranchCount: 2,
    siteCount: 5,
    onlineSiteCount: 4,
    openAlertCount: 6,
    openIssueCount: 4,
    openRecommendationCount: 5,
    pendingApprovalCount: 2,
    expectedMonthlySavings: 420000,
    expectedDieselSavings: 180000
  },
  topRecommendations: [
    {
      actionId: "rec-1",
      title: "Cut after-hours baseload",
      siteId: "lagos-hq",
      priorityScore: 72,
      approvalStatus: "pending",
      recommendationMode: "approval_required",
      expectedMonthlySavings: 135000
    },
    {
      actionId: "rec-2",
      title: "Review generator dispatch logic",
      siteId: "abuja-central",
      priorityScore: 69,
      approvalStatus: "pending",
      recommendationMode: "approval_required",
      expectedMonthlySavings: 98000
    }
  ],
  topAlerts: [
    {
      alertId: "alert-1",
      title: "Device offline",
      siteId: "port-harcourt",
      severity: "critical",
      state: "open",
      lastSeenAt: "2026-04-07T11:20:00.000Z"
    },
    {
      alertId: "alert-2",
      title: "Telemetry quality is bad",
      siteId: "lagos-hq",
      severity: "high",
      state: "open",
      lastSeenAt: "2026-04-07T10:55:00.000Z"
    }
  ],
  branchHealth: [
    {
      branchId: "lagos-hq",
      healthScore: 84,
      qualityStatus: "good",
      openIssueCount: 1,
      isOnline: true,
      updatedAt: "2026-04-07T11:30:00.000Z"
    },
    {
      branchId: "abuja-central",
      healthScore: 61,
      qualityStatus: "suspicious",
      openIssueCount: 2,
      isOnline: true,
      updatedAt: "2026-04-07T11:25:00.000Z"
    },
    {
      branchId: "port-harcourt",
      healthScore: 42,
      qualityStatus: "bad",
      openIssueCount: 3,
      isOnline: false,
      updatedAt: "2026-04-07T11:15:00.000Z"
    }
  ]
};

export default async function HomePage() {
  const overview = await fetchBackendJson("/dashboard/overview", fallbackOverview);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <p style={{ marginBottom: 8, color: "var(--muted)" }}>Operator dashboard</p>
        <h1 style={{ marginTop: 0, fontSize: 36 }}>Portfolio operations at a glance</h1>
        <p style={{ maxWidth: 760, color: "var(--muted)" }}>
          FloWiser now exposes operator and executive dashboard APIs. This overview page surfaces
          live branch health, top alerts, and ranked actions when the backend is configured, with
          safe fallback data for UI development.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MetricCard
          label="Branches online"
          value={`${overview.kpis.onlineBranchCount}/${overview.kpis.branchCount}`}
          helper="Portfolio branch availability"
        />
        <MetricCard
          label="Sites online"
          value={`${overview.kpis.onlineSiteCount}/${overview.kpis.siteCount}`}
          helper="Telemetry-backed site coverage"
        />
        <MetricCard
          label="Open alerts"
          value={String(overview.kpis.openAlertCount)}
          helper="Active or suppressed alerts"
        />
        <MetricCard
          label="Open issues"
          value={String(overview.kpis.openIssueCount)}
          helper="Operator-owned work items"
        />
        <MetricCard
          label="Pending approvals"
          value={String(overview.kpis.pendingApprovalCount)}
          helper="Actions waiting on approval"
        />
        <MetricCard
          label="Expected monthly savings"
          value={formatCurrency(overview.kpis.expectedMonthlySavings)}
          helper="Open recommendation upside"
        />
      </section>

      <SimpleTable
        headers={["Recommendation", "Site", "Priority", "Mode", "Savings"]}
        rows={overview.topRecommendations.map((item) => [
          item.title,
          item.siteId,
          String(item.priorityScore),
          `${item.recommendationMode} / ${item.approvalStatus}`,
          formatCurrency(item.expectedMonthlySavings)
        ])}
      />

      <SimpleTable
        headers={["Alert", "Site", "Severity", "State", "Last seen"]}
        rows={overview.topAlerts.map((item) => [
          item.title,
          item.siteId,
          item.severity,
          item.state,
          new Date(item.lastSeenAt).toLocaleString()
        ])}
      />

      <SimpleTable
        headers={["Branch", "Health", "Quality", "Open issues", "Status"]}
        rows={overview.branchHealth.map((item) => [
          item.branchId,
          String(item.healthScore),
          item.qualityStatus,
          String(item.openIssueCount),
          item.isOnline ? "Online" : "Offline"
        ])}
      />

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        <Link href="/branches" style={{ color: "var(--accent)" }}>
          View branch operations
        </Link>
        <Link href="/executive" style={{ color: "var(--accent)" }}>
          Open executive summary
        </Link>
      </div>
    </div>
  );
}
