import { NextResponse } from "next/server";
import { toCSV } from "../../../../lib/csv";
import { readCsv } from "../../../../lib/csvfs";

export const dynamic = "force-static";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rows = await readCsv("data/hpc_cloud_burst.csv").catch(() => []);
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(rows);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8" } });
  }
  return NextResponse.json(rows);
}
