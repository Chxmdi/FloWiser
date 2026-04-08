import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminGatewaysPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin gateways</h1>
        <p style={{ color: "var(--muted)" }}>
          Gateway integration adds a real pickup/result contract for queued dispatches. Gateway agents can
          heartbeat, pull pending commands, and return execution results to close the loop on command delivery.
        </p>
      </div>

      <SimpleTable
        headers={["Gateway surface", "Purpose"]}
        rows={[
          ["POST /gateway/agents/:agentId/heartbeat", "Update agent liveness"],
          ["POST /gateway/agents/:agentId/pull-dispatches", "Pull queued dispatches for a site"],
          ["POST /gateway/agents/:agentId/dispatches/:dispatchId/result", "Submit success or failure result"],
          ["GET /gateway/dispatches/:dispatchId/receipts", "Inspect gateway receipts"]
        ]}
      />

      <SimpleTable
        headers={["State", "Meaning"]}
        rows={[
          ["sent", "Queued and waiting for gateway pickup or result"],
          ["claimed", "Gateway pulled the dispatch"],
          ["succeeded", "Gateway returned a successful result"],
          ["failed", "Gateway returned a failure result"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Gateway agents authenticate with <code>x-gateway-key</code>. Admin inspection still uses actor headers on admin routes.
      </p>
    </div>
  );
}
