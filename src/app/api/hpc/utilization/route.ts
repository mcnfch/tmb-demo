import { NextResponse } from "next/server";
import { toCSV } from "../../../../lib/csv";
import { readCsv } from "../../../../lib/csvfs";

export const dynamic = "force-static";

type U = { month: string; node_count: number; hours_in_month: number; used_cpu_hours: number; used_gpu_hours: number; cluster_cost: number };

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
  const out: U[] = Array.from(map.entries()).map(([month, agg]) => ({
    month,
    node_count: nodeCount,
    hours_in_month: hoursInMonth(month),
    used_cpu_hours: Math.round(agg.cpu),
    used_gpu_hours: Math.round(agg.gpu),
    cluster_cost: Math.round(agg.cost),
  }));
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(out);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json(out);
}
