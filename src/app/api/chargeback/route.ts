import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const focus = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const rate = 0.45;
  const rows: any[] = [];
  const map = new Map<string, { bu: string; app: string; usage: number; cost: number }>();
  let unallocatedCost = 0;
  for (const r of focus) {
    if ((r["service"] || "").toLowerCase() !== "compute") continue; // chargeback on compute units
    let bu = "";
    let app = "";
    try {
      const t = JSON.parse(r["tags"] || "{}");
      bu = t.bu || "";
      app = t.app || "";
    } catch {}
    const usage = Number(r["usage_qty"]) || 0;
    const cost = Number(r["cost_usd"]) || 0;
    if (!bu || !app) {
      unallocatedCost += cost;
      continue;
    }
    const key = `${bu}|${app}`;
    const cur = map.get(key) || { bu, app, usage: 0, cost: 0 };
    cur.usage += usage;
    cur.cost += cost;
    map.set(key, cur);
  }
  for (const { bu, app, usage } of map.values()) {
    const allocated_cost = Math.round(usage * rate);
    rows.push({ business_unit: bu.charAt(0).toUpperCase() + bu.slice(1), application: app.charAt(0).toUpperCase() + app.slice(1), usage_units: Math.round(usage), rate_per_unit: rate, allocated_cost });
  }
  const summary = { total_allocated: rows.reduce((s, r) => s + r.allocated_cost, 0), unallocated: Math.round(unallocatedCost) };

  if (url.searchParams.get("format") === "csv") {
    const csvRows = [
      ...rows,
      { business_unit: "—", application: "Unallocated", usage_units: "", rate_per_unit: "", allocated_cost: summary.unallocated },
    ];
    const body = toCSV(csvRows as any[]);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json({ rows, summary });
}
