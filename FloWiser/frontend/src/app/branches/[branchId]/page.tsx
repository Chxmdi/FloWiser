type BranchPageProps = {
  params: { branchId: string };
};

export default function BranchDetailPage({ params }: BranchPageProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Branch detail: {params.branchId}</h1>
      <p style={{ color: "var(--muted)" }}>
        This route exists so the page structure is stable before live branch telemetry is wired up.
      </p>
    </div>
  );
}
