import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

type Row = { month: string; service: string; spend: number };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const focus = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const map = new Map<string, number>();
  for (const r of focus) {
    const month = (r["usage_date"] || "").slice(0, 7) + "-01";
    const key = `${month}|${r["service"] || "unknown"}`;
    map.set(key, (map.get(key) || 0) + (Number(r["cost_usd"]) || 0));
  }
  const out: Row[] = Array.from(map.entries()).map(([k, v]) => {
    const [month, service] = k.split("|");
    return { month, service, spend: Math.round(v) };
  });
  const dl = url.searchParams.get("download");
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(out);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", ...(dl ? { "content-disposition": "attachment; filename=top-services.csv" } : {}) } });
  }
  if (dl) {
    return new NextResponse(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=top-services.json" } });
  }
  return NextResponse.json(out);
}
