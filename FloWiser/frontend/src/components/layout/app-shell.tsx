import Link from "next/link";
import { PropsWithChildren } from "react";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/branches", label: "Branches" },
  { href: "/alerts", label: "Alerts" },
  { href: "/executive", label: "Executive" },
  { href: "/admin/devices", label: "Admin" },
  { href: "/admin/rules", label: "Rules" },
  { href: "/admin/recommendations", label: "Recommendations" },
  { href: "/admin/controls", label: "Controls" },
  { href: "/admin/commands", label: "Commands" },
  { href: "/admin/gateways", label: "Gateways" },
  { href: "/admin/operations", label: "Operations" },
  { href: "/admin/verification", label: "Field M&V" },
  { href: "/admin/access", label: "Access" },
  { href: "/admin/reporting", label: "Reporting" }
];

export const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "240px 1fr" }}>
      <aside
        style={{
          background: "#101828",
          color: "#f8fafc",
          padding: "24px 20px"
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 24, fontSize: 24 }}>FloWiser</h1>
        <nav style={{ display: "grid", gap: 12 }}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} style={{ opacity: 0.9 }}>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ padding: 32 }}>{children}</main>
    </div>
  );
};
