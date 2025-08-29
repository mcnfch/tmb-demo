import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

function title(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const focus = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const dims = await readCsv("seeds/tbm_dimensions.csv").catch(() => []);
  const serviceSet = new Set<string>(focus.map((r) => r["service"]).filter(Boolean));
  const mapped = new Set<string>(dims.map((r) => r["service_name"]).filter(Boolean));

  let total = 0;
  let missing = 0;
  for (const r of focus) {
    total++;
    try {
      const t = JSON.parse(r["tags"] || "{}");
      if (!t.app || !t.env || !t.bu) missing++;
    } catch {
      missing++;
    }
  }
  const untagged_pct = total > 0 ? Math.round((missing / total) * 1000) / 10 : 0;
  let unmapped_services = 0;
  for (const s of serviceSet) {
    if (!mapped.has(title(s))) unmapped_services++;
  }
  const focus_conformance_pct = Math.max(0, Math.min(100, Math.round(100 - untagged_pct * 0.5)));
  const data = {
    untagged_pct,
    unmapped_services,
    focus_conformance_pct,
    target_untagged_pct: 5,
    target_focus_pct: 95,
  };

  const dl = url.searchParams.get("download");
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV([data]);
    if (dl) {
      return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=hygiene.csv" } });
    }
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  if (dl) {
    return new NextResponse(JSON.stringify(data), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=hygiene.json" } });
  }
  return NextResponse.json(data);
}

