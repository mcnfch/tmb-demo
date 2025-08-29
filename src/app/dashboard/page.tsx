import KpiCard from "../../components/KpiCard";
import Disclosure from "../../components/Disclosure";
import { getJSON } from "../../lib/api";

export default async function Dashboard() {
  const [exec, spend, services, variance] = await Promise.all([
    getJSON<any>("/api/exec-summary"),
    getJSON<any[]>("/api/spend"),
    getJSON<any[]>("/api/top-services"),
    getJSON<any[]>("/api/variance"),
  ]);

  const totalSpend = spend.reduce((acc, r: any) => acc + (r.spend || 0), 0);
  const latestMonth = exec.latest_month as string;
  const monthLabel = new Date(latestMonth).toLocaleString("en-US", { month: "short", year: "numeric" });

  // Derive deltas for services/apps (latest vs previous month)
  const monthOf = (d: string) => d.slice(0, 7) + "-01";
  const serviceByMonth = services.reduce((m: Map<string, Set<string>>, r: { month: string; service: string }) => {
    const k = r.month;
    const set = m.get(k) || new Set<string>();
    set.add(r.service);
    m.set(k, set);
    return m;
  }, new Map());
  const months = Array.from(serviceByMonth.keys()).sort();
  const last = months[months.length - 1];
  const prev = months[months.length - 2];
  const activeServices = (serviceByMonth.get(last)?.size ?? 0);
  const deltaServices = activeServices - (serviceByMonth.get(prev)?.size ?? 0);

  const appsByMonth = spend.reduce((m: Map<string, Set<string>>, r: { usage_date: string; application: string }) => {
    const k = monthOf(r.usage_date);
    const set = m.get(k) || new Set<string>();
    set.add(r.application);
    m.set(k, set);
    return m;
  }, new Map());
  const months2 = Array.from(appsByMonth.keys()).sort();
  const last2 = months2[months2.length - 1];
  const prev2 = months2[months2.length - 2];
  const activeApps = (appsByMonth.get(last2)?.size ?? 0);
  const deltaApps = activeApps - (appsByMonth.get(prev2)?.size ?? 0);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-2">Executive Summary</h2>
        <p className="text-sm text-black/70 dark:text-white/70">
          YTD spend is <span className="font-semibold">${exec.ytd.actual.toLocaleString()}</span>
          {exec.ytd.plan > 0 && (
            <> vs plan ${exec.ytd.plan.toLocaleString()} — Δ ${exec.ytd.delta.toLocaleString()} ({exec.ytd.delta_pct}%).</>
          )}
          {' '}EOY forecast is <span className="font-semibold">${exec.eoy.forecast.toLocaleString()}</span>
          {exec.eoy.budget > 0 && (
            <> vs budget ${exec.eoy.budget.toLocaleString()} — Δ ${exec.eoy.delta.toLocaleString()} ({exec.eoy.delta_pct}%).</>
          )}
          {' '}Tagging/conformance at {exec.hygiene.focus_conformance_pct}% (target {exec.hygiene.target_focus_pct}%),
          untagged ${exec.hygiene.untagged_usd.toLocaleString()} ({exec.hygiene.untagged_pct}%).
          {exec.risks.count > 0 ? (
            <> Risks: {exec.risks.items.slice(0, 2).join('; ')}.</>
          ) : (
            <> No critical risks flagged.</>
          )}
        </p>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
        <KpiCard
          title="YTD Spend vs Plan"
          value={`$${exec.ytd.actual.toLocaleString()}`}
          subtitle={`Δ $${exec.ytd.delta.toLocaleString()} (${exec.ytd.delta_pct}% ) vs Plan`}
        />
        <KpiCard title="Run Rate" value={`$${exec.run_rate.actual.toLocaleString()}`} subtitle={monthLabel} />
        <KpiCard
          title="EOY Forecast vs Budget"
          value={`$${exec.eoy.forecast.toLocaleString()}`}
          subtitle={`Δ $${exec.eoy.delta.toLocaleString()} (${exec.eoy.delta_pct}% ) vs Budget`}
        />
        <KpiCard
          title="Savings Pipeline"
          value={`$${exec.savings.committed.toLocaleString()} committed`}
          subtitle={`$${exec.savings.inflight.toLocaleString()} in‑flight`}
        />
        <KpiCard
          title="Untagged"
          value={`$${exec.hygiene.untagged_usd.toLocaleString()}`}
          subtitle={`${exec.hygiene.untagged_pct}%`}
        />
        <KpiCard
          title="Critical Risks"
          value={exec.risks.count}
          subtitle={exec.risks.items.slice(0, 2).join("; ")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="FOCUS Conformance"
          value={`${exec.hygiene.focus_conformance_pct}%`}
          subtitle={exec.hygiene.focus_conformance_pct < exec.hygiene.target_focus_pct ? `Target ${exec.hygiene.target_focus_pct}%` : "On target"}
        />
        <KpiCard
          title="Unmapped Services"
          value={exec.hygiene.unmapped_services}
          subtitle={exec.hygiene.unmapped_services > 0 ? "Owner & ETA needed" : "OK"}
        />
        <KpiCard
          title="Active Services (obs’d)"
          value={activeServices}
          subtitle={`${deltaServices >= 0 ? "+" : ""}${deltaServices} vs prev`}
        />
        <KpiCard
          title="Active Applications"
          value={activeApps}
          subtitle={`${deltaApps >= 0 ? "+" : ""}${deltaApps} vs prev`}
        />
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
          <h2 className="text-lg font-semibold mb-2">Spend Trend (12 mo)</h2>
          <div className="flex flex-col gap-1 text-sm">
            {(Array.from(
              spend.reduce((m: Map<string, number>, r: { usage_date: string; spend: number }) => {
                const k = r.usage_date.slice(0, 7) + "-01";
                m.set(k, (m.get(k) || 0) + (r.spend || 0));
                return m;
              }, new Map())
            ) as [string, number][])
              .sort((a, b) => (a[0] < b[0] ? -1 : 1))
              .slice(-12)
              .map(([k, v]: [string, number]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="w-24 text-black/70 dark:text-white/70">{new Date(k).toLocaleString("en-US", { month: "short", year: "numeric" })}</div>
                  <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded">
                    <div
                      className="h-2 bg-black/60 dark:bg-white/60 rounded"
                      style={{ width: `${Math.min(100, (v / totalSpend) * 300)}%` }}
                    />
                  </div>
                  <div className="w-28 text-right">${Math.round(v).toLocaleString()}</div>
                </div>
              ))}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
          <h2 className="text-lg font-semibold mb-2">Top 5 Variances</h2>
          <div className="text-sm">
            {variance
              .map((v: any) => ({ ...v, abs: Math.abs(v.variance_vs_budget ?? 0) }))
              .sort((a: any, b: any) => b.abs - a.abs)
              .slice(0, 5)
              .map((v: any, i: number) => (
                <div key={i} className="flex justify-between py-1">
                  <span>
                    {new Date(v.month).toLocaleString("en-US", { month: "short" })} — {v.business_unit} / {v.application}
                  </span>
                  <span className={v.variance_vs_budget >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {v.variance_vs_budget ? (v.variance_vs_budget >= 0 ? "+" : "") : ""}${(v.variance_vs_budget ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-black/10 dark:border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-2">Top 3 Decisions This Month</h2>
        <ul className="list-disc pl-5 text-sm">
          {exec.hygiene.unmapped_services > 0 && (
            <li>
              Map {exec.hygiene.unmapped_services} unmapped services → reduce unallocated/unknown; Owner: Ops; Due: {new Date(Date.now() + 14 * 24 * 3600 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </li>
          )}
          {exec.hygiene.untagged_usd > 0 && (
            <li>
              Improve tag hygiene (untagged ${exec.hygiene.untagged_usd.toLocaleString()}) → enable chargeback fairness; Owner: FinOps; Due: End of month
            </li>
          )}
          <li>
            Validate plan/forecast coverage vs actuals (plan ${exec.ytd.plan.toLocaleString()}) → align EOY outlook; Owner: Finance; Due: Next FP&amp;A cycle
          </li>
        </ul>
      </section>

      <Disclosure title="Spend by BU / App / Env">
        <div className="overflow-auto rounded-md border border-black/10 dark:border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-white/10">
                <th className="text-left p-2">Month</th>
                <th className="text-left p-2">BU</th>
                <th className="text-left p-2">App</th>
                <th className="text-left p-2">Env</th>
                <th className="text-right p-2">Spend</th>
              </tr>
            </thead>
            <tbody>
              {spend.map((r: any, i: number) => (
                <tr key={i} className="odd:bg-black/0 even:bg-black/5 dark:even:bg-white/5">
                  <td className="p-2">{new Date(r.usage_date).toLocaleString("en-US", { month: "short", year: "numeric" })}</td>
                  <td className="p-2">{r.business_unit}</td>
                  <td className="p-2">{r.application}</td>
                  <td className="p-2">{r.environment}</td>
                  <td className="p-2 text-right">${r.spend.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>

      <Disclosure title="Top Services MoM (sample)">
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3 text-sm">
          {services.map((s: any, i: number) => (
            <div key={i} className="flex justify-between py-1">
              <span>
                {s.month} — {s.service}
              </span>
              <span>${s.spend.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Disclosure>

      <Disclosure title="Variance vs Forecast (sample)">
        <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-black/5 dark:bg-white/10">
                <th className="text-left p-2">Month</th>
                <th className="text-left p-2">BU</th>
                <th className="text-left p-2">App</th>
                <th className="text-right p-2">Actual</th>
                <th className="text-right p-2">Budget</th>
                <th className="text-right p-2">Forecast</th>
                <th className="text-right p-2">Var vs Budget</th>
                <th className="text-right p-2">Var vs Forecast</th>
              </tr>
            </thead>
            <tbody>
              {variance.map((v: any, i: number) => (
                <tr key={i} className="odd:bg-black/0 even:bg-black/5 dark:even:bg-white/5">
                  <td className="p-2">{v.month}</td>
                  <td className="p-2">{v.business_unit}</td>
                  <td className="p-2">{v.application}</td>
                  <td className="p-2 text-right">${v.actual.toLocaleString()}</td>
                  <td className="p-2 text-right">{v.budget !== null ? `$${v.budget.toLocaleString()}` : "—"}</td>
                  <td className="p-2 text-right">{v.forecast !== null ? `$${v.forecast.toLocaleString()}` : "—"}</td>
                  <td className="p-2 text-right">{v.variance_vs_budget !== null ? `$${v.variance_vs_budget.toLocaleString()}` : "—"}</td>
                  <td className="p-2 text-right">{v.variance_vs_forecast !== null ? `$${v.variance_vs_forecast.toLocaleString()}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Disclosure>
    </div>
  );
}
