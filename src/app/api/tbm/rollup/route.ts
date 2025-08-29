import { NextResponse } from "next/server";
import { toCSV } from "../../../../lib/csv";
import { readCsv } from "../../../../lib/csvfs";

export const dynamic = "force-static";

type Row = { cost_pool: string; tower: string; service: string; application: string; monthly_cost: number };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const focus = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const hpcCost = await readCsv("data/hpc_cluster_cost.csv").catch(() => []);
  const map = new Map<string, number>();
  // Cloud focus → towers
  const towerMap: Record<string, string> = { compute: "Compute", storage: "Storage", db: "Database", network: "Network" };
  for (const r of focus) {
    const t = towerMap[(r["service"] || "").toLowerCase()] || "Other";
    let app = "Shared";
    try {
      const tags = JSON.parse(r["tags"] || "{}");
      app = tags.app ? tags.app.charAt(0).toUpperCase() + tags.app.slice(1) : "Shared";
    } catch {}
    const key = `Cloud|${t}|${(r["service"] || "").charAt(0).toUpperCase() + (r["service"] || "").slice(1)}|${app}`;
    map.set(key, (map.get(key) || 0) + (Number(r["cost_usd"]) || 0));
  }
  // HPC cluster cost → HPC tower
  for (const r of hpcCost) {
    const cost = Number(r["total_cost_usd"]) || 0;
    const key = `On-Prem|HPC|Cluster|Shared`;
    map.set(key, (map.get(key) || 0) + cost);
  }

  const out: Row[] = Array.from(map.entries()).map(([k, v]) => {
    const [pool, tower, service, app] = k.split("|");
    return { cost_pool: pool, tower, service, application: app, monthly_cost: Math.round(v) };
  });
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(out);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json(out);
}
