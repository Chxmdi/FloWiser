export default function LoginPage() {
  return (
    <div style={{ maxWidth: 420, display: "grid", gap: 16 }}>
      <h1>Login</h1>
      <p style={{ color: "var(--muted)" }}>
        Authentication is scaffolded at the platform level in Epic 1. Real login wiring will follow
        once the identity provider is selected for the first environment.
      </p>
      <label>
        Email
        <input
          type="email"
          placeholder="operator@company.com"
          style={{ width: "100%", marginTop: 8, padding: 12, borderRadius: 12, border: "1px solid var(--border)" }}
        />
      </label>
      <button
        type="button"
        style={{
          padding: "12px 16px",
          borderRadius: 12,
          border: 0,
          background: "var(--accent)",
          color: "white"
        }}
      >
        Continue
      </button>
    </div>
  );
}
