import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminAlertingPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin alerting</h1>
        <p style={{ color: "var(--muted)" }}>
          Alerting policies evaluate observability signals like offline gateways, backlog, retry pressure, and dead letters.
          This is the bridge from passive monitoring to explicit platform alert events.
        </p>
      </div>

      <SimpleTable
        headers={["Alerting surface", "Purpose"]}
        rows={[
          ["GET /telemetry-alerts/policies", "List alert policies"],
          ["PATCH /telemetry-alerts/policies/:policyId", "Retune thresholds or severity"],
          ["GET /telemetry-alerts/events", "Inspect alert events"],
          ["POST /telemetry-alerts/evaluate", "Evaluate policies against current health state"]
        ]}
      />

      <SimpleTable
        headers={["Signal examples", "Example policy"]}
        rows={[
          ["offlineGatewayCount", "Trigger when one or more gateways go offline"],
          ["brokerPendingCount", "Trigger on queue backlog buildup"],
          ["deadLetterCount", "Trigger on exhausted dispatches"],
          ["openIncidentCount", "Trigger when operational load spikes"]
        ]}
      />
    </div>
  );
}
