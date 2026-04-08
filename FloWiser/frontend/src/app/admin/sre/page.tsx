import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminSrePage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin SRE</h1>
        <p style={{ color: "var(--muted)" }}>
          SRE tooling packages recurring operational workflows into runbooks. This makes retry sweeps and health capture
          executable as explicit operational actions instead of ad hoc manual steps.
        </p>
      </div>

      <SimpleTable
        headers={["Runbook", "Purpose"]}
        rows={[
          ["retry-stuck-dispatches", "Sweep stale/failed dispatches and schedule retries or dead letters"],
          ["capture-observability", "Capture a health snapshot for later review"],
          ["retry-and-capture", "Run retry workflow and then capture updated health"]
        ]}
      />

      <SimpleTable
        headers={["SRE surface", "Purpose"]}
        rows={[
          ["GET /sre/runbooks", "List available runbooks"],
          ["GET /sre/executions", "Inspect runbook execution history"],
          ["POST /sre/runbooks/:runbookKey/execute", "Execute a runbook now"]
        ]}
      />
    </div>
  );
}
