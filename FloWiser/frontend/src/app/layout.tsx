import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "../components/layout/app-shell";

export const metadata = {
  title: "FloWiser",
  description: "Commercial energy optimization platform"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
