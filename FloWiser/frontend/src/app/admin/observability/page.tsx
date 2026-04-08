import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminObservabilityPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin observability</h1>
        <p style={{ color: "var(--muted)" }}>
          Observability snapshots capture gateway freshness, dispatch backlog, broker backlog, incidents, and dead letters.
          This gives the platform a compact health view that can be trended over time.
        </p>
      </div>

      <SimpleTable
        headers={["Observability surface", "Purpose"]}
        rows={[
          ["GET /observability/overview", "Current platform health summary"],
          ["GET /observability/snapshots", "Historical health snapshots"],
          ["POST /observability/capture", "Capture a new service health snapshot"]
        ]}
      />

      <SimpleTable
        headers={["Tracked signal", "Example"]}
        rows={[
          ["Gateway freshness", "Online / stale / offline / never seen"],
          ["Dispatch pressure", "Pending and retry-scheduled dispatch counts"],
          ["Broker backlog", "Pending and claimed broker messages"],
          ["Incident load", "Open transport failures and dead letters"]
        ]}
      />
    </div>
  );
}
