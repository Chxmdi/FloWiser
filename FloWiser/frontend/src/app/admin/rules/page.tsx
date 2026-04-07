import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminRulesPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin rules</h1>
        <p style={{ color: "var(--muted)" }}>
          Rules are now persisted and executed by the backend. This page is the first admin surface for
          inspecting the default rule set and execution-trace intent before a richer management UI lands.
        </p>
      </div>

      <SimpleTable
        headers={["Rule", "Category", "Severity", "Purpose"]}
        rows={[
          ["after_hours_baseload_waste", "energy_waste", "medium", "Detect late-night load"],
          ["avoidable_peak_event", "energy_waste", "high", "Flag sharp site spikes"],
          ["generator_inefficient_runtime", "generator", "medium", "Generator while grid exists"],
          ["excessive_start_stop_cycling", "generator", "high", "Repeated generator starts"],
          ["voltage_current_anomaly", "equipment", "high", "Trust-layer anomaly propagation"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /rules</code>, <code>PATCH /rules/:ruleId</code>, <code>GET /rules/traces</code>
      </p>
    </div>
  );
}
