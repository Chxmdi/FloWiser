import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminOperationsPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin operations</h1>
        <p style={{ color: "var(--muted)" }}>
          Operations resilience adds retry scheduling, timeout sweeps, dead-letter handling, and incident tracking
          for gateway command delivery. Transport failure is now treated as an operational workflow, not an instant dead end.
        </p>
      </div>

      <SimpleTable
        headers={["Operations surface", "Purpose"]}
        rows={[
          ["GET /operations/gateway-health", "Inspect agent freshness and pending dispatch load"],
          ["GET /operations/incidents", "Review transport and retry incidents"],
          ["GET /operations/dead-letters", "Inspect exhausted dispatches"],
          ["POST /operations/retries/run", "Run timeout/retry sweep"],
          ["POST /operations/dispatches/:dispatchId/retry", "Manually reschedule one dispatch"]
        ]}
      />

      <SimpleTable
        headers={["Dispatch resilience state", "Meaning"]}
        rows={[
          ["sent", "Queued or in flight, awaiting gateway result"],
          ["retry_scheduled", "Will be retried after backoff"],
          ["dead_lettered", "Attempts exhausted; requires human follow-up"],
          ["incident", "Operational event recorded for investigation"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Epic 16 makes command delivery more production-like by adding retry orchestration and dead-letter visibility on top of the gateway loop.
      </p>
    </div>
  );
}
