import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminRecommendationsPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin recommendations</h1>
        <p style={{ color: "var(--muted)" }}>
          Recommendations are now generated from matched rule traces. This admin surface makes the
          optimization layer visible before richer operator workflows are added.
        </p>
      </div>

      <SimpleTable
        headers={["Action", "Mode", "Priority", "Purpose"]}
        rows={[
          ["Cut after-hours baseload", "approval_required", "72+", "Reduce overnight waste"],
          ["Review generator dispatch logic", "approval_required", "70+", "Reduce diesel waste"],
          ["Restore telemetry continuity", "advisory", "20+", "Recover missing visibility"],
          ["Inspect electrical quality issue", "advisory", "30+", "Reduce equipment risk"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /recommendations</code>, <code>GET /recommendations/top-actions</code>, <code>POST /recommendations/:actionId/approve</code>
      </p>
    </div>
  );
}
