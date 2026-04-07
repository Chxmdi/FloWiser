import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminDevicesPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin devices</h1>
        <p style={{ color: "var(--muted)" }}>
          Device registration, mapping, and operational metadata will live here.
        </p>
      </div>

      <SimpleTable
        headers={["Device", "Type", "Status", "Mapped site"]}
        rows={[
          ["meter-lag-001", "Main meter", "Online", "Lagos HQ"],
          ["gw-abj-002", "Gateway", "Pending", "Abuja Central"]
        ]}
      />
    </div>
  );
}
