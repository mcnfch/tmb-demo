import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rows = await readCsv("data/focus_sandbox.csv").catch(() => []);
  let total = 0;
  let missing = 0;
  for (const r of rows) {
    total++;
    try {
      const t = JSON.parse(r["tags"] || "{}");
      if (!t.app || !t.env || !t.bu) missing++;
    } catch {
      missing++;
    }
  }
  const pct = total > 0 ? Math.round((missing / total) * 1000) / 10 : 0;
  const data = { untagged_pct: pct };
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV([data]);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json(data);
}
