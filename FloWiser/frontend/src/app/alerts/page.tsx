import { SimpleTable } from "../../components/tables/simple-table";
import { fetchBackendJson } from "../../lib/backend-api";

const fallback = {
  alerts: [
    { alertId: "alert-1", title: "Device offline", siteId: "port-harcourt", severity: "critical", state: "open", lastSeenAt: "2026-04-07T11:20:00.000Z" },
    { alertId: "alert-2", title: "Telemetry quality is bad", siteId: "lagos-hq", severity: "high", state: "open", lastSeenAt: "2026-04-07T10:55:00.000Z" }
  ]
};

export default async function AlertsPage() {
  const data = await fetchBackendJson("/alerts", fallback);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Alerts</h1>
        <p style={{ color: "var(--muted)" }}>
          Alerts now come from the workflow core. When persistence is configured, this page reflects
          active and historical alert state from the backend.
        </p>
      </div>

      <SimpleTable
        headers={["Alert", "Site", "Severity", "State", "Last seen"]}
        rows={data.alerts.map((alert) => [
          alert.title,
          alert.siteId,
          alert.severity,
          alert.state,
          new Date(alert.lastSeenAt).toLocaleString()
        ])}
      />
    </div>
  );
}
