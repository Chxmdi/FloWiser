import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminReportingPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin reporting</h1>
        <p style={{ color: "var(--muted)" }}>
          Reporting turns recommendations, execution history, and dispatch logs into verification snapshots.
          This is the first ROI layer: expected vs realized savings, capture rates, and underperforming actions.
        </p>
      </div>

      <SimpleTable
        headers={["Reporting surface", "Purpose"]}
        rows={[
          ["/reporting/overview", "Verification summary and recent realized value"],
          ["/reporting/executive", "Portfolio capture rate and branch performance"],
          ["/reporting/sites/:siteId", "Site-level realization reporting"],
          ["/reporting/recommendations/:actionId", "Per-action verification history"]
        ]}
      />

      <SimpleTable
        headers={["Verification status", "Meaning"]}
        rows={[
          ["unverified", "No execution evidence yet"],
          ["partially_realized", "Some value captured, but below target confidence"],
          ["realized", "Execution evidence supports strong value realization"],
          ["not_realized", "Execution failed or no value was captured"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /reporting/overview</code>, <code>GET /reporting/executive</code>, <code>POST /reporting/recommendations/:actionId/verify</code>.
      </p>
    </div>
  );
}
