import Link from "next/link";
import { SimpleTable } from "../../components/tables/simple-table";

export default function BranchesPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Branches</h1>
        <p style={{ color: "var(--muted)" }}>
          Placeholder operational list for branch visibility. Real data will arrive in the Phase 1
          implementation epics.
        </p>
      </div>

      <SimpleTable
        headers={["Branch", "Region", "Status", "Next action"]}
        rows={[
          ["Lagos HQ", "South West", "Healthy", "Connect live telemetry"],
          ["Abuja Central", "North Central", "Needs setup", "Complete device registration"],
          ["Port Harcourt", "South South", "Attention", "Review offline sensor"]
        ]}
      />

      <Link href="/branches/lagos-hq" style={{ color: "var(--accent)" }}>
        View sample branch detail
      </Link>
    </div>
  );
}
