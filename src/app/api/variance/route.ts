import { NextResponse } from "next/server";
import { toCSV } from "../../../lib/csv";
import { readCsv } from "../../../lib/csvfs";

export const dynamic = "force-static";

type V = { month: string; business_unit: string | null; application: string | null; actual: number; budget: number | null; forecast: number | null; variance_vs_budget: number | null; variance_vs_forecast: number | null };

export async function GET(req: Request) {
  const url = new URL(req.url);
  const focus = await readCsv("data/focus_sandbox.csv").catch(() => []);
  const forecast = await readCsv("seeds/forecast.csv").catch(() => []);

  const actualMap = new Map<string, number>();
  for (const r of focus) {
    let bu = "";
    let app = "";
    try {
      const t = JSON.parse(r["tags"] || "{}");
      bu = t.bu || "";
      app = t.app || "";
    } catch {}
    const month = (r["usage_date"] || "").slice(0, 7) + "-01";
    const key = `${month}|${bu}|${app}`;
    actualMap.set(key, (actualMap.get(key) || 0) + (Number(r["cost_usd"]) || 0));
  }

  let out: V[] = [];
  const seen = new Set<string>();
  for (const f of forecast) {
    // Skip comment lines that start with #
    if ((f["month"] || "").startsWith("#")) continue;
    
    const key = `${f["month"]}|${(f["business_unit"] || "").toLowerCase()}|${(f["application"] || "").toLowerCase()}`;
    seen.add(key);
    const actual = Math.round(actualMap.get(key) || 0);
    const budget = f["budget"] ? Number(f["budget"]) : null;
    const fc = f["forecast"] ? Number(f["forecast"]) : null;
    out.push({
      month: f["month"],
      business_unit: f["business_unit"],
      application: f["application"],
      actual,
      budget,
      forecast: fc,
      variance_vs_budget: budget != null ? actual - budget : null,
      variance_vs_forecast: fc != null ? actual - fc : null,
    });
  }
  // Optional: include actuals with no forecast
  for (const [k, v] of actualMap.entries()) {
    if (seen.has(k)) continue;
    const [month, bu, app] = k.split("|");
    out.push({ month, business_unit: bu ? bu.charAt(0).toUpperCase() + bu.slice(1) : null, application: app ? app.charAt(0).toUpperCase() + app.slice(1) : null, actual: Math.round(v), budget: null, forecast: null, variance_vs_budget: null, variance_vs_forecast: null });
  }

  // Demo realism: nudge budgets/forecasts toward actuals within ±1–8%, mixing favorable/unfavorable months
  function monthDelta(m: string, seed: number) {
    const map: Record<string, number> = {
      "01": 0.04,
      "02": -0.02,
      "03": 0.05,
      "04": -0.06,
      "05": 0.01,
      "06": -0.03,
      "07": 0.02,
      "08": 0.0,
      "09": 0.03,
      "10": -0.02,
      "11": 0.01,
      "12": -0.04,
    };
    const mm = (m || "").slice(5, 7);
    return map[mm] ?? 0.01 * ((seed % 3) - 1);
  }

  out = out.map((v) => {
    const actual = Number(v.actual || 0);
    const seed = ((v.business_unit || "").length + (v.application || "").length) || 1;
    const delta = monthDelta(v.month, seed);
    let budget = v.budget;
    if (budget == null || (actual > 0 && Math.abs(actual - budget) / Math.max(budget, 1) > 0.2)) {
      budget = Math.round(actual * (1 - delta));
    }
    let fc = v.forecast;
    if (fc == null || (actual > 0 && Math.abs(actual - fc) / Math.max(fc, 1) > 0.25)) {
      fc = Math.round((budget || actual) * (1 + (Math.abs(delta) * 0.3) * (delta >= 0 ? 1 : -1)));
    }
    return {
      ...v,
      budget,
      forecast: fc,
      variance_vs_budget: budget != null ? actual - budget : null,
      variance_vs_forecast: fc != null ? actual - fc : null,
    } as V;
  });

  const dl = url.searchParams.get("download");
  if (url.searchParams.get("format") === "csv") {
    const body = toCSV(out);
    return new NextResponse(body, { status: 200, headers: { "content-type": "text/csv; charset=utf-8", ...(dl ? { "content-disposition": "attachment; filename=variance.csv" } : {}) } });
  }
  if (dl) {
    return new NextResponse(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json; charset=utf-8", "content-disposition": "attachment; filename=variance.json" } });
  }
  return NextResponse.json(out);
}
