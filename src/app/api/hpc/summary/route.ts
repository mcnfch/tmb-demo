import { NextResponse } from "next/server";
import { toCSV } from "../../../../lib/csv";
import { readCsv } from "../../../../lib/csvfs";

export const dynamic = "force-static";

function hoursInMonth(iso: string) {
  const d = new Date(iso);
  const m = d.getUTCMonth();
  const y = d.getUTCFullYear();
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return days * 24;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jobs = await readCsv("data/hpc_job_usage.csv").catch(() => []);
  const costs = await readCsv("data/hpc_cluster_cost.csv").catch(() => []);
  const bursts = await readCsv("data/hpc_cloud_burst.csv").catch(() => []);
  const nodeCount = 50;
  const map = new Map<string, { cpu: number; gpu: number; cost: number }>();
  for (const c of costs) {
    const key = c["month"];
    const cost = Number(c["total_cost_usd"]) || 0;
    const cur = map.get(key) || { cpu: 0, gpu: 0, cost: 0 };
    cur.cost += cost;
    map.set(key, cur);
  }
  for (const j of jobs) {
    const key = j["month"];
    const cur = map.get(key) || { cpu: 0, gpu: 0, cost: 0 };
    cur.cpu += Number(j["cpu_hours"]) || 0;
    cur.gpu += Number(j["gpu_hours"]) || 0;
    map.set(key, cur);
  }
  // determine latest month
  const months = Array.from(map.keys()).sort();
  const latestMonth = months[months.length - 1];
  const agg = latestMonth ? map.get(latestMonth)! : { cpu: 0, gpu: 0, cost: 0 };
  const capacity = nodeCount * hoursInMonth(latestMonth || new Date().toISOString());
  const used = agg.cpu;
  const avg_utilization_pct = capacity > 0 ? Math.round((used / capacity) * 1000) / 10 : 0;
  const idle_pct = 100 - avg_utilization_pct;
  const over_provisioned = idle_pct > 40;
  const burst_latest = bursts.filter((b) => b.month === latestMonth).reduce((s, r) => s + (Number(r.spend_usd) || 0), 0);
  const total_burst_spend = bursts.reduce((s, r) => s + (Number(r.spend_usd) || 0), 0);
  const data = {
    avg_utilization_pct,
    over_provisioned,
    burst_while_idle_flag: over_provisioned && burst_latest > 0,
    total_burst_spend: Math.round(total_burst_spend),
    cluster_monthly_cost: Math.round(agg.cost),
  };
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV([data]);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json(data);
}
