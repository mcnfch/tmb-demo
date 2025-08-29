import type { Metadata } from "next";
import Link from "next/link";
import { ReactNode } from "react";
import ScrollToTop from "../components/ScrollToTop";
import "./globals.css";

export const metadata: Metadata = {
  title: "TBM Portal Demo",
  description: "Comprehensive TBM demo: cloud, on‑prem, EUC, labor, HPC/scaling",
};

function Nav() {
  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/overview", label: "Overview" },
    { href: "/tbm", label: "TBM Map" },
    { href: "/chargeback", label: "Chargeback" },
    { href: "/finance", label: "Finance" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/reporting", label: "Reporting" },
    { href: "/hpc", label: "HPC" },
  ];
  return (
    <nav className="sticky top-0 z-10 border-b border-black/10 dark:border-white/10 bg-background/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img src="/tmb-logo.svg" alt="TMB" className="w-8 h-8" />
          <div className="font-semibold">TBM Portal</div>
        </div>
        <ul className="flex gap-4 text-sm">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className="rounded-md px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
              >
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Nav />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <ScrollToTop />
      </body>
    </html>
  );
}
