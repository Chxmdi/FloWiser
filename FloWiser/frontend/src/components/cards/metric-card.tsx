type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export const MetricCard = ({ label, value, helper }: MetricCardProps) => {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20
      }}
    >
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{label}</p>
      <h2 style={{ margin: "12px 0 8px", fontSize: 28 }}>{value}</h2>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>{helper}</p>
    </section>
  );
};
