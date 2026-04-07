type SitePageProps = {
  params: { siteId: string };
};

export default function SiteDetailPage({ params }: SitePageProps) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <h1>Site detail: {params.siteId}</h1>
      <p style={{ color: "var(--muted)" }}>
        Later epics will show device state, latest telemetry, issues, and ranked recommendations on
        this page.
      </p>
    </div>
  );
}
