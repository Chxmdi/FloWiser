import Link from "next/link";
import { SimpleTable } from "../../components/tables/simple-table";
import { fetchBackendJson } from "../../lib/backend-api";

const fallback = {
  branches: [
    {
      branchId: "lagos-hq",
      healthScore: 84,
      qualityStatus: "good",
      openIssueCount: 1,
      isOnline: true,
      attentionLabel: "Healthy"
    },
    {
      branchId: "abuja-central",
      healthScore: 61,
      qualityStatus: "suspicious",
      openIssueCount: 2,
      isOnline: true,
      attentionLabel: "Attention"
    },
    {
      branchId: "port-harcourt",
      healthScore: 42,
      qualityStatus: "bad",
      openIssueCount: 3,
      isOnline: false,
      attentionLabel: "Offline"
    }
  ]
};

export default async function BranchesPage() {
  const data = await fetchBackendJson("/dashboard/branches", fallback);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Branches</h1>
        <p style={{ color: "var(--muted)" }}>
          Branches now use the dashboard experience API. Health, quality, and issue counts come from
          the backend when persistence is configured.
        </p>
      </div>

      <SimpleTable
        headers={["Branch", "Health", "Quality", "Open issues", "Status"]}
        rows={data.branches.map((branch) => [
          branch.branchId,
          String(branch.healthScore),
          branch.qualityStatus,
          String(branch.openIssueCount),
          `${branch.attentionLabel}${branch.isOnline ? " / Online" : " / Offline"}`
        ])}
      />

      <div style={{ display: "grid", gap: 8 }}>
        {data.branches.map((branch) => (
          <Link key={branch.branchId} href={`/branches/${branch.branchId}`} style={{ color: "var(--accent)" }}>
            View {branch.branchId} detail
          </Link>
        ))}
      </div>
    </div>
  );
}
