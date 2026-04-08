import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminCommandsPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin commands</h1>
        <p style={{ color: "var(--muted)" }}>
          Commanding converts a guarded execution request into a command plan, simulation result, and
          dispatch log. This is the bridge between control approvals and future real gateway integrations.
        </p>
      </div>

      <SimpleTable
        headers={["Template", "Channel", "Modes", "Purpose"]}
        rows={[
          ["schedule_adjustment_template", "simulated_gateway", "dry_run / manual / automated", "Patch schedules and verify drop"],
          ["schedule_tuning_template", "simulated_gateway", "dry_run / manual / automated", "Tune start/stop windows"],
          ["load_staggering_template", "manual_playbook", "dry_run / manual", "Prepare manual heavy-load plan"],
          ["connectivity_check_template", "simulator", "dry_run / manual", "Run connectivity diagnostics"]
        ]}
      />

      <SimpleTable
        headers={["Dispatch state", "Meaning"]}
        rows={[
          ["planned", "Command plan was generated but not yet simulated or dispatched"],
          ["simulated", "Simulation ran successfully without live dispatch"],
          ["blocked", "Guardrails or execution state prevented dispatch"],
          ["succeeded / failed", "Dispatch simulation completed and was logged"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /commands/templates</code>, <code>POST /commands/executions/:executionId/simulate</code>, <code>POST /commands/executions/:executionId/dispatch</code>
      </p>
    </div>
  );
}
