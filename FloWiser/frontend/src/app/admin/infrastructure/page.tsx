import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminInfrastructurePage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin infrastructure</h1>
        <p style={{ color: "var(--muted)" }}>
          Infrastructure profiles model the external systems FloWiser would connect to in production: brokers,
          metrics backends, log sinks, trace backends, and OTEL collectors. This is the configuration and health-contract layer.
        </p>
      </div>

      <SimpleTable
        headers={["Surface", "Purpose"]}
        rows={[
          ["GET /infrastructure/profiles", "List external infra profiles"],
          ["GET /infrastructure/profiles/:profileId", "Inspect one profile"],
          ["PATCH /infrastructure/profiles/:profileId", "Update config metadata"],
          ["POST /infrastructure/profiles/:profileId/check", "Run a profile health check"]
        ]}
      />

      <SimpleTable
        headers={["Profile examples", "Examples"]}
        rows={[
          ["Broker", "MQTT, Kafka"],
          ["Metrics", "Prometheus remote write"],
          ["Logging", "Loki"],
          ["Tracing", "OTEL / Tempo"]
        ]}
      />
    </div>
  );
}
