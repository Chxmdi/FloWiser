import { SimpleTable } from "../../components/tables/simple-table";

export default function AlertsPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Alerts</h1>
        <p style={{ color: "var(--muted)" }}>
          Alert workflows are defined in the backlog. This page is part of the Sprint 1 shell so the
          product structure is visible from day one.
        </p>
      </div>

      <SimpleTable
        headers={["Alert", "Severity", "Owner", "State"]}
        rows={[
          ["Meter heartbeat missing", "Medium", "Ops", "Open"],
          ["Generator runtime spike", "High", "Facilities", "Investigating"]
        ]}
      />
    </div>
  );
}
