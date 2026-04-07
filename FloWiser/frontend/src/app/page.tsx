import { MetricCard } from "../components/cards/metric-card";
import { SimpleTable } from "../components/tables/simple-table";

export default function HomePage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <p style={{ marginBottom: 8, color: "var(--muted)" }}>Epic 1 foundation</p>
        <h1 style={{ marginTop: 0, fontSize: 36 }}>Commercial energy visibility starts here</h1>
        <p style={{ maxWidth: 760, color: "var(--muted)" }}>
          This frontend is the first operator shell for FloWiser. It exists to prove local
          development, CI, routing, and page structure before telemetry and optimization logic are
          added in later epics.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))"
        }}
      >
        <MetricCard label="Pilot-ready pages" value="6" helper="Overview, branches, sites, alerts, login, admin" />
        <MetricCard label="Backend health route" value="/health" helper="Used in CI and local smoke tests" />
        <MetricCard label="Epic 1 status" value="Done in repo" helper="Monorepo, docs, CI/CD, Docker, workflows" />
      </section>

      <SimpleTable
        headers={["Area", "What exists now", "What comes next"]}
        rows={[
          ["Frontend", "App shell, routes, cards, tables", "Real data hooks and auth integration"],
          ["Backend", "Health route, env loader, logger, migration runner", "Ingestion and domain modules"],
          ["Infrastructure", "Bootstrap templates and workflows", "Applied AWS resources per environment"]
        ]}
      />
    </div>
  );
}
