import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

type SpendRow = { usage_date: string; business_unit: string; application: string; environment: string; spend: number };

function title(s: string) {
  if (!s) return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rows = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const out: SpendRow[] = rows.map((r) => {
    let bu = "";
    let app = "";
    let env = "";
    try {
      const t = JSON.parse(r["tags"] || "{}");
      bu = t.bu || "";
      app = t.app || "";
      env = t.env || "";
    } catch {}
    const spend = Number(r["cost_usd"]) || 0;
    return {
      usage_date: r["usage_date"],
      business_unit: bu ? title(bu) : "Unassigned",
      application: app ? title(app) : "Unassigned",
      environment: env ? (env.toLowerCase() === "prod" ? "Prod" : env.toUpperCase()) : "Unknown",
      spend,
    };
  });
  const dl = url.searchParams.get("download");
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(out);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", ...(dl ? { "content-disposition": "attachment; filename=spend.csv" } : {}) } });
  }
  if (dl) {
    return new NextResponse(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=spend.json" } });
  }
  return NextResponse.json(out);
}
