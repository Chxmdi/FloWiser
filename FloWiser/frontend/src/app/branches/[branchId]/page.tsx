import { MetricCard } from "../../../components/cards/metric-card";
import { SimpleTable } from "../../../components/tables/simple-table";
import { fetchBackendJson, formatCurrency } from "../../../lib/backend-api";

type BranchPageProps = {
  params: { branchId: string };
};

export default async function BranchDetailPage({ params }: BranchPageProps) {
  const fallback = {
    branch: {
      branch_id: params.branchId,
      health_score: 68,
      quality_status: "suspicious",
      open_issue_count: 2,
      is_online: true,
      latest_telemetry_at: "2026-04-07T11:30:00.000Z"
    },
    sites: [
      { site_id: `${params.branchId}-site-a`, health_score: 71, quality_status: "good", open_issue_count: 1, is_online: true, latest_telemetry_at: "2026-04-07T11:28:00.000Z" },
      { site_id: `${params.branchId}-site-b`, health_score: 54, quality_status: "suspicious", open_issue_count: 1, is_online: true, latest_telemetry_at: "2026-04-07T11:24:00.000Z" }
    ],
    issues: [
      { issue_id: "issue-1", title: "Investigate generator runtime", status: "investigating", severity: "high", assignee: "ops-manager", updated_at: "2026-04-07T11:10:00.000Z" }
    ],
    recommendations: [
      { actionId: "rec-1", title: "Cut after-hours baseload", priorityScore: 72, approvalStatus: "pending", recommendationMode: "approval_required", expectedMonthlySavings: 135000 }
    ]
  };

  const detail = await fetchBackendJson(`/dashboard/branches/${params.branchId}`, fallback);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Branch detail: {params.branchId}</h1>
        <p style={{ color: "var(--muted)" }}>
          Branch details combine state, issues, recommendations, and site health into one operator view.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MetricCard label="Health score" value={String(detail.branch.health_score)} helper={`Quality: ${detail.branch.quality_status}`} />
        <MetricCard label="Open issues" value={String(detail.branch.open_issue_count)} helper={detail.branch.is_online ? "Branch online" : "Branch offline"} />
        <MetricCard label="Last telemetry" value={new Date(detail.branch.latest_telemetry_at).toLocaleTimeString()} helper="Most recent branch signal" />
        <MetricCard label="Top savings" value={detail.recommendations[0] ? formatCurrency(detail.recommendations[0].expectedMonthlySavings) : formatCurrency(0)} helper="Highest visible opportunity" />
      </section>

      <SimpleTable
        headers={["Site", "Health", "Quality", "Open issues", "Status"]}
        rows={detail.sites.map((site) => [
          site.site_id,
          String(site.health_score),
          site.quality_status,
          String(site.open_issue_count),
          site.is_online ? "Online" : "Offline"
        ])}
      />

      <SimpleTable
        headers={["Issue", "Severity", "Status", "Assignee", "Updated"]}
        rows={detail.issues.map((issue) => [
          issue.title,
          issue.severity,
          issue.status,
          issue.assignee ?? "Unassigned",
          new Date(issue.updated_at).toLocaleString()
        ])}
      />

      <SimpleTable
        headers={["Recommendation", "Priority", "Mode", "Savings"]}
        rows={detail.recommendations.map((item) => [
          item.title,
          String(item.priorityScore),
          `${item.recommendationMode} / ${item.approvalStatus}`,
          formatCurrency(item.expectedMonthlySavings)
        ])}
      />
    </div>
  );
}
