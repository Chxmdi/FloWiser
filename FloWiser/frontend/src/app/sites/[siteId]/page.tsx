import { MetricCard } from "../../../components/cards/metric-card";
import { SimpleTable } from "../../../components/tables/simple-table";
import { fetchBackendJson, formatCurrency } from "../../../lib/backend-api";

type SitePageProps = {
  params: { siteId: string };
};

export default async function SiteDetailPage({ params }: SitePageProps) {
  const fallback = {
    site: {
      site_id: params.siteId,
      health_score: 58,
      quality_status: "suspicious",
      open_issue_count: 2,
      is_online: true,
      latest_telemetry_at: "2026-04-07T11:20:00.000Z",
      last_received_at: "2026-04-07T11:24:00.000Z"
    },
    alerts: [
      { alertId: "alert-1", title: "Telemetry quality is bad", severity: "high", state: "open", lastSeenAt: "2026-04-07T11:05:00.000Z" }
    ],
    issues: [
      { issue_id: "issue-1", title: "Check voltage anomaly", status: "open", severity: "high", assignee: "field-tech", updated_at: "2026-04-07T11:10:00.000Z" }
    ],
    recommendations: [
      { actionId: "rec-1", title: "Inspect electrical quality issue", priorityScore: 44, approvalStatus: "not_required", recommendationMode: "advisory", expectedMonthlySavings: 25000 }
    ],
    ruleTraces: [
      { traceId: "trace-1", ruleId: "voltage_current_anomaly", matched: true, severity: "high", title: "Voltage or current anomaly", executedAt: "2026-04-07T11:00:00.000Z" }
    ]
  };

  const detail = await fetchBackendJson(`/dashboard/sites/${params.siteId}`, fallback);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Site detail: {params.siteId}</h1>
        <p style={{ color: "var(--muted)" }}>
          Site detail is now a real operator cockpit: state, alerts, issues, rules, and recommendations.
        </p>
      </div>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MetricCard label="Health score" value={String(detail.site.health_score)} helper={`Quality: ${detail.site.quality_status}`} />
        <MetricCard label="Open issues" value={String(detail.site.open_issue_count)} helper={detail.site.is_online ? "Site online" : "Site offline"} />
        <MetricCard label="Last telemetry" value={new Date(detail.site.latest_telemetry_at).toLocaleTimeString()} helper="Latest meter timestamp" />
        <MetricCard label="Top savings" value={detail.recommendations[0] ? formatCurrency(detail.recommendations[0].expectedMonthlySavings) : formatCurrency(0)} helper="Highest site opportunity" />
      </section>

      <SimpleTable
        headers={["Alert", "Severity", "State", "Last seen"]}
        rows={detail.alerts.map((alert) => [
          alert.title,
          alert.severity,
          alert.state,
          new Date(alert.lastSeenAt).toLocaleString()
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

      <SimpleTable
        headers={["Rule", "Severity", "Matched", "Executed at"]}
        rows={detail.ruleTraces.map((trace) => [
          trace.ruleId,
          trace.severity,
          trace.matched ? "Yes" : "No",
          new Date(trace.executedAt).toLocaleString()
        ])}
      />
    </div>
  );
}
