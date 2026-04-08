import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminBrokerPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin broker</h1>
        <p style={{ color: "var(--muted)" }}>
          The broker outbox adds a queue-like delivery contract between command dispatch creation and gateway pickup.
          It provides message status, claim tracking, and delivery visibility separate from the dispatch record itself.
        </p>
      </div>

      <SimpleTable
        headers={["Broker surface", "Purpose"]}
        rows={[
          ["GET /broker/messages", "Inspect brokered dispatch messages"],
          ["GET /broker/messages/:messageId", "Inspect one broker message"],
          ["gateway pull-dispatches", "Claims pending broker messages for an agent/site"],
          ["gateway result", "Acks brokered delivery after gateway response"]
        ]}
      />

      <SimpleTable
        headers={["Message state", "Meaning"]}
        rows={[
          ["pending", "Published and waiting for a gateway agent"],
          ["claimed", "Picked up by a gateway agent"],
          ["acked", "Gateway transport completed and message was acknowledged"],
          ["dead_lettered", "Transport message was retired after operational handling"]
        ]}
      />
    </div>
  );
}
