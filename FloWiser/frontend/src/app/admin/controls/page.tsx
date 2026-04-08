import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminControlsPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin controls</h1>
        <p style={{ color: "var(--muted)" }}>
          Controls turn approved recommendations into guarded execution requests. This surface makes
          policies, approvals, and execution states visible before closed-loop automation is added.
        </p>
      </div>

      <SimpleTable
        headers={["Policy", "Modes", "Approvals", "Guardrail focus"]}
        rows={[
          ["schedule_adjustment_approval_required", "dry_run / manual / automated", "1", "No critical alerts + minimum confidence"],
          ["dispatch_policy_review_approval_required", "dry_run / manual", "2", "Two-person review for generator changes"],
          ["control_logic_review_approval_required", "dry_run / manual", "2", "High-risk control logic changes"],
          ["connectivity_check_advisory", "dry_run / manual", "0", "Operator-safe connectivity actions"]
        ]}
      />

      <SimpleTable
        headers={["Execution state", "Meaning"]}
        rows={[
          ["blocked", "Guardrails stopped the action"],
          ["pending_approval", "Guardrails passed; waiting for execution approvals"],
          ["ready", "Can be completed safely under current policy"],
          ["executed / failed", "Execution was attempted and logged"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /controls/policies</code>, <code>POST /controls/executions</code>, <code>POST /controls/executions/:executionId/approvals</code>
      </p>
    </div>
  );
}
