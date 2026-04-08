import { SimpleTable } from "../../../components/tables/simple-table";

export default function AdminAccessPage() {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1>Admin access</h1>
        <p style={{ color: "var(--muted)" }}>
          Access hardening adds tenant memberships, role-based route guards, scope checks, and audit logs.
          The backend now expects actor headers on protected routes and records authenticated activity.
        </p>
      </div>

      <SimpleTable
        headers={["Role", "Typical access", "Intended persona"]}
        rows={[
          ["viewer", "Portfolio and dashboard read access", "Executive viewer"],
          ["operator", "Operational workflows and execution requests", "Ops manager or field lead"],
          ["tenant_admin", "Tenant administration and policy control", "Operations director"],
          ["platform_admin", "Cross-tenant administration", "Internal platform admin"]
        ]}
      />

      <SimpleTable
        headers={["Route family", "Minimum role"]}
        rows={[
          ["/dashboard, /alerts, /state, /quality", "viewer"],
          ["/issues, /field, /recommendations, /controls, /commands", "operator"],
          ["/registry, /rules", "tenant_admin"],
          ["/access/memberships, /access/audit-logs", "tenant_admin"],
          ["Cross-tenant membership management", "platform_admin"]
        ]}
      />

      <p style={{ color: "var(--muted)", margin: 0 }}>
        Backend routes: <code>GET /access/me</code>, <code>GET /access/memberships</code>, <code>GET /access/audit-logs</code>.
        Protected routes expect <code>x-tenant-id</code> and <code>x-user-id</code> headers.
      </p>
    </div>
  );
}
