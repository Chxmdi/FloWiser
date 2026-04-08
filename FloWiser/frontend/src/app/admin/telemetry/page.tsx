import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminTelemetryPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin telemetry</h1>
        <p style={{ color: "var(--muted)" }}>
          Telemetry ops persist metrics, structured logs, and trace spans inside the platform so external export can be wired later.
          This is the first explicit metrics/logs/traces layer rather than only health snapshots.
        </p>
      </div>

      <SimpleTable
        headers={["Telemetry surface", "Purpose"]}
        rows={[
          ["GET /telemetry-ops/metrics", "Inspect captured metric points"],
          ["POST /telemetry-ops/metrics/capture", "Capture metrics from current health state"],
          ["GET /telemetry-ops/logs", "Inspect structured log entries"],
          ["POST /telemetry-ops/logs", "Write a structured log entry"],
          ["GET /telemetry-ops/traces", "Inspect trace spans"],
          ["POST /telemetry-ops/traces", "Write a trace span"]
        ]}
      />

      <SimpleTable
        headers={["Signal type", "Examples"]}
        rows={[
          ["Metrics", "Gateway counts, backlog, incident load"],
          ["Logs", "Operational events with structured context"],
          ["Traces", "Runbook, dispatch, and workflow span timing"]
        ]}
      />
    </div>
  );
}
