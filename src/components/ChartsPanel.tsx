"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ensureG2Plot } from "../lib/g2plot-loader";

type TabKey =
  | "spend"
  | "variance"
  | "top-services"
  | "hygiene"
  | "chargeback"
  | "tbm-rollup"
  | "hpc-utilization"
  | "hpc-burst";

const TABS: { key: TabKey; label: string }[] = [
  { key: "spend", label: "Spend" },
  { key: "variance", label: "Variance" },
  { key: "top-services", label: "Top Services" },
  { key: "hygiene", label: "Hygiene" },
  { key: "chargeback", label: "Chargeback" },
  { key: "tbm-rollup", label: "TBM Rollup" },
  { key: "hpc-utilization", label: "HPC Utilization" },
  { key: "hpc-burst", label: "HPC Burst" },
];

function nestRollup(rows: any[]) {
  // Convert flat rows to hierarchy: cost_pool -> tower -> service
  const root: any = { name: "root", children: [] as any[] };
  const byPool = new Map<string, any>();
  for (const r of rows) {
    const pool = r.cost_pool || "Other";
    const tower = r.tower || "Other";
    const service = r.service || "Other";
    const cost = Number(r.monthly_cost || 0);
    if (!byPool.has(pool)) byPool.set(pool, { name: pool, children: new Map<string, any>() });
    const poolNode = byPool.get(pool);
    if (!poolNode.children.has(tower)) poolNode.children.set(tower, { name: tower, children: new Map<string, any>() });
    const towerNode = poolNode.children.get(tower);
    const cur = towerNode.children.get(service);
    if (cur) cur.value += cost; else towerNode.children.set(service, { name: service, value: cost });
  }
  for (const [, poolNode] of byPool) {
    const towers: any[] = [];
    for (const [, towerNode] of poolNode.children) {
      const services: any[] = [];
      for (const [, svc] of towerNode.children) services.push(svc);
      towers.push({ name: towerNode.name, children: services });
    }
    root.children.push({ name: poolNode.name, children: towers });
  }
  return root;
}

export default function ChartsPanel() {
  const [tab, setTab] = useState<TabKey>("spend");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);

  const endpoint = useMemo(() => {
    switch (tab) {
      case "spend":
        return "/api/spend";
      case "variance":
        return "/api/variance";
      case "top-services":
        return "/api/top-services";
      case "hygiene":
        return "/api/hygiene";
      case "chargeback":
        return "/api/chargeback";
      case "tbm-rollup":
        return "/api/tbm/rollup";
      case "hpc-utilization":
        return "/api/hpc/utilization";
      case "hpc-burst":
        return "/api/hpc/burst";
      default:
        return "/api/spend";
    }
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    let chart: any = null;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ok = await ensureG2Plot();
        if (!ok) throw new Error("Failed to load G2Plot");
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled || !ref.current) return;

        // Destroy existing chart
        if (chartRef.current) {
          try { chartRef.current.destroy(); } catch {}
          chartRef.current = null;
        }

        const { Line, Column, Area, Bar, Sunburst } = (window as any).G2Plot;

        switch (tab) {
          case "spend": {
            // Aggregate by month
            const m = new Map<string, number>();
            for (const r of data) {
              const k = (r.usage_date || "").slice(0, 7) + "-01";
              m.set(k, (m.get(k) || 0) + Number(r.spend || 0));
            }
            const rows = Array.from(m, ([month, spend]) => ({ month, spend }));
            chart = new Line(ref.current!, { data: rows, xField: "month", yField: "spend", smooth: true });
            break;
          }
          case "variance": {
            // Top 10 by abs variance
            const rows = data
              .map((v: any) => ({
                month: v.month,
                label: `${v.business_unit || ""}/${v.application || ""}`,
                variance: Number(v.variance_vs_budget ?? 0),
              }))
              .sort((a: any, b: any) => Math.abs(b.variance) - Math.abs(a.variance))
              .slice(0, 10);
            chart = new Column(ref.current!, { data: rows, xField: "label", yField: "variance", seriesField: "month", isGroup: true });
            break;
          }
          case "top-services": {
            // Stack by service over months
            const rows = data.map((r: any) => ({ month: r.month, service: r.service, spend: Number(r.spend || 0) }));
            chart = new Area(ref.current!, { data: rows, xField: "month", yField: "spend", seriesField: "service", isStack: true, smooth: true });
            break;
          }
          case "hygiene": {
            const rows = [
              { metric: "Untagged %", value: Number(data.untagged_pct || 0) },
              { metric: "FOCUS %", value: Number(data.focus_conformance_pct || 0) },
              { metric: "Unmapped Services", value: Number(data.unmapped_services || 0) },
            ];
            chart = new Bar(ref.current!, { data: rows, xField: "value", yField: "metric" });
            break;
          }
          case "chargeback": {
            const rows = (data.rows || []).map((r: any) => ({ application: r.application, allocated_cost: Number(r.allocated_cost || 0) }));
            chart = new Column(ref.current!, { data: rows, xField: "application", yField: "allocated_cost" });
            break;
          }
          case "tbm-rollup": {
            const rows = data.map((r: any) => ({ cost_pool: r.cost_pool, tower: r.tower, service: r.service, monthly_cost: Number(r.monthly_cost || 0) }));
            const tree = nestRollup(rows);
            chart = new Sunburst(ref.current!, { data: tree, radius: 0.95, innerRadius: 0.2, interactions: [{ type: "element-active" }] });
            break;
          }
          case "hpc-utilization": {
            const rows = data.map((r: any) => ({ month: r.month, used_cpu_hours: Number(r.used_cpu_hours || 0) }));
            chart = new Line(ref.current!, { data: rows, xField: "month", yField: "used_cpu_hours", smooth: true });
            break;
          }
          case "hpc-burst": {
            const rows = data.map((r: any) => ({ month: r.month, pricing_model: r.pricing_model, spend_usd: Number(r.spend_usd || r.spend || 0) }));
            chart = new Column(ref.current!, { data: rows, xField: "month", yField: "spend_usd", isStack: true, seriesField: "pricing_model" });
            break;
          }
        }

        chart?.render();
        chartRef.current = chart;
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to render chart");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        try { chartRef.current.destroy(); } catch {}
        chartRef.current = null;
      }
    };
  }, [endpoint, tab]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2 items-center">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1 rounded border text-sm ${tab === t.key ? "bg-black/80 text-white dark:bg-white/80 dark:text-black" : "border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10"}`}
          >
            {t.label}
          </button>
        ))}
        <div className="ml-auto" />
        {/* AI button moved to Reporting AI section */}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading && <div className="text-sm text-black/60 dark:text-white/60">Loading…</div>}
      <div ref={ref} style={{ width: "100%", height: 420 }} className="rounded border border-black/10 dark:border-white/10 bg-white dark:bg-black/5" />

      {/* Analysis modal removed; see Reporting AI section */}
    </div>
  );
}
