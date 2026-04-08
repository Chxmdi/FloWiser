import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminVerificationPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin field verification</h1>
        <p style={{ color: "var(--muted)" }}>
          Field M&amp;V adds actual measured before/after inputs for energy and diesel consumption. When present,
          reporting can use these measurements instead of relying only on execution evidence proxies.
        </p>
      </div>

      <SimpleTable
        headers={["Field verification surface", "Purpose"]}
        rows={[
          ["GET /field-verification/measurements", "List captured measurements"],
          ["GET /field-verification/recommendations/:actionId", "Inspect per-action measurements"],
          ["POST /field-verification/recommendations/:actionId/measure", "Capture measured before/after values"]
        ]}
      />

      <SimpleTable
        headers={["Measurement basis", "Example"]}
        rows={[
          ["manual_meter_read", "Actual meter read before/after schedule change"],
          ["telemetry_rollup", "Verified daily average from telemetry"],
          ["fuel_log", "Diesel consumption from generator fuel records"],
          ["site_survey", "Structured site verification visit"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Reporting now prefers measured field inputs when they exist, and falls back to execution-evidence verification otherwise.
      </p>
    </div>
  );
}
