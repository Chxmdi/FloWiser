import { MetricCard } from "../../components/cards/metric-card";
import { SimpleTable } from "../../components/tables/simple-table";
import { fetchBackendJson, formatCurrency } from "../../lib/backend-api";

const fallback = {
  portfolio: {
    branchCount: 3,
    siteCount: 5,
    healthyBranchCount: 1,
    attentionBranchCount: 2,
    expectedMonthlySavings: 420000,
    expectedDieselSavings: 180000,
    pendingApprovalCount: 2,
    criticalAlertCount: 1
  },
  worstBranches: [
    { branchId: "port-harcourt", healthScore: 42, qualityStatus: "bad", openIssueCount: 3, isOnline: false },
    { branchId: "abuja-central", healthScore: 61, qualityStatus: "suspicious", openIssueCount: 2, isOnline: true }
  ],
  biggestOpportunities: [
    { actionId: "rec-1", title: "Cut after-hours baseload", branchId: "lagos-hq", siteId: "lagos-hq", priorityScore: 72, expectedMonthlySavings: 135000, expectedDieselSavings: 0 },
    { actionId: "rec-2", title: "Review generator dispatch logic", branchId: "abuja-central", siteId: "abuja-central", priorityScore: 69, expectedMonthlySavings: 98000, expectedDieselSavings: 120000 }
  ],
  unresolvedIssuesByBranch: [
    { branchId: "port-harcourt", issueCount: 3 },
    { branchId: "abuja-central", issueCount: 2 }
  ]
};

export default async function ExecutivePage() {
  const data = await fetchBackendJson("/dashboard/executive", fallback);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <p style={{ marginBottom: 8, color: "var(--muted)" }}>Executive summary</p>
        <h1 style={{ marginTop: 0, fontSize: 36 }}>Portfolio performance and upside</h1>
        <p style={{ maxWidth: 760, color: "var(--muted)" }}>
          The executive experience API translates operational state into a portfolio summary: branch
          health, unresolved issues, approval backlog, and financial upside from active recommendations.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MetricCard label="Healthy branches" value={`${data.portfolio.healthyBranchCount}/${data.portfolio.branchCount}`} helper="Branches with strong health and low friction" />
        <MetricCard label="Attention branches" value={String(data.portfolio.attentionBranchCount)} helper="Branches needing near-term action" />
        <MetricCard label="Pending approvals" value={String(data.portfolio.pendingApprovalCount)} helper="Actions awaiting approval" />
        <MetricCard label="Critical alerts" value={String(data.portfolio.criticalAlertCount)} helper="Currently critical portfolio issues" />
        <MetricCard label="Expected monthly savings" value={formatCurrency(data.portfolio.expectedMonthlySavings)} helper="Open portfolio upside" />
        <MetricCard label="Expected diesel savings" value={formatCurrency(data.portfolio.expectedDieselSavings)} helper="Generator-related opportunity" />
      </section>

      <SimpleTable
        headers={["Branch", "Health", "Quality", "Open issues", "Status"]}
        rows={data.worstBranches.map((item) => [
          item.branchId,
          String(item.healthScore),
          item.qualityStatus,
          String(item.openIssueCount),
          item.isOnline ? "Online" : "Offline"
        ])}
      />

      <SimpleTable
        headers={["Opportunity", "Branch", "Site", "Priority", "Monthly savings"]}
        rows={data.biggestOpportunities.map((item) => [
          item.title,
          item.branchId,
          item.siteId,
          String(item.priorityScore),
          formatCurrency(item.expectedMonthlySavings)
        ])}
      />

      <SimpleTable
        headers={["Branch", "Unresolved issues"]}
        rows={data.unresolvedIssuesByBranch.map((item) => [item.branchId, String(item.issueCount)])}
      />
    </div>
  );
}
