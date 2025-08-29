import KpiCard from "../../components/KpiCard";
import { getJSON } from "../../lib/api";

type UtilRow = {
  month: string;
  node_count: number;
  hours_in_month: number;
  used_cpu_hours: number;
  used_gpu_hours: number;
  cluster_cost: number;
};

type BurstRow = { month: string; pricing_model: string; spend: number };

type Summary = {
  avg_utilization_pct: number;
  over_provisioned: boolean;
  burst_while_idle_flag: boolean;
  total_burst_spend: number;
  cluster_monthly_cost: number;
};

export default async function Hpc() {
  const [util, burst, summary] = await Promise.all([
    getJSON<UtilRow[]>("/api/hpc/utilization"),
    getJSON<BurstRow[]>("/api/hpc/burst"),
    getJSON<Summary>("/api/hpc/summary"),
  ]);

  const latest = util[util.length - 1];
  const burstLatest = burst
    .filter((b: any) => b.month === latest.month)
    .reduce((acc: Record<string, number>, r: any) => {
      const model = r.pricing_model || "unknown";
      const amt = Number(r.spend ?? r.spend_usd ?? 0);
      acc[model] = (acc[model] || 0) + amt;
      return acc;
    }, {} as Record<string, number>);

  const capacityHours = latest.node_count * latest.hours_in_month;
  const usedHours = latest.used_cpu_hours;
  const utilPct = Math.round((usedHours / capacityHours) * 1000) / 10;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">HPC & Scaling (sample)</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Avg Utilization" value={`${summary.avg_utilization_pct}%`} subtitle={`Latest month`} />
        <KpiCard title="Cluster Cost (mo)" value={`$${summary.cluster_monthly_cost.toLocaleString()}`} />
        <KpiCard title="Burst Spend (latest)" value={`$${Object.values(burstLatest).reduce((a, v) => a + (v || 0), 0).toLocaleString()}`} />
        <KpiCard
          title={summary.over_provisioned ? "Over‑Provisioned" : "Right‑Sized"}
          value={summary.over_provisioned ? "Yes" : "No"}
          subtitle={`Target 85–95% • ${summary.burst_while_idle_flag ? "Burst while idle" : ""}`}
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Cluster Utilization vs Capacity (latest)</h2>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
            <div className="flex justify-between py-1"><span>Nodes</span><span>{latest.node_count}</span></div>
            <div className="flex justify-between py-1"><span>Capacity Hours</span><span>{capacityHours.toLocaleString()}</span></div>
            <div className="flex justify-between py-1"><span>Used CPU Hours</span><span>{Math.round(usedHours).toLocaleString()}</span></div>
            <div className="flex justify-between py-1"><span>Utilization</span><span>{utilPct}%</span></div>
          </div>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Cloud Burst Spend by Pricing Model (latest)</h2>
          <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
            {Object.entries(burstLatest).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1">
                <span>{k}</span>
                <span>${(v as number).toLocaleString()}</span>
              </div>
            ))}
            {Object.keys(burstLatest).length === 0 && (
              <div className="text-black/60 dark:text-white/60">No burst spend in latest month</div>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">ROI Scenarios (placeholder)</h2>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
          <ul className="list-disc pl-5">
            <li>Add 20% cluster capacity vs rely on spot</li>
            <li>Shift 30% jobs to reserved instances</li>
            <li>Blend cluster + burst for cost per project</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
