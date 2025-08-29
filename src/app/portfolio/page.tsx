import { getJSON } from "../../lib/api";

export default async function Portfolio() {
  const spend = await getJSON<any[]>("/api/spend");
  const apps = (Array.from(
    spend.reduce((m: Map<string, number>, r: any) => {
      const key = `${r.business_unit}|${r.application}`;
      m.set(key, (m.get(key) || 0) + (r.spend || 0));
      return m;
    }, new Map())
  ) as [string, number][]).map(([key, val]: [string, number]) => {
    const [bu, app] = key.split("|");
    return { business_unit: bu, application: app, spend: val };
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Technology Portfolio</h1>
      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/5 dark:bg-white/10">
              <th className="text-left p-2">Business Unit</th>
              <th className="text-left p-2">Application</th>
              <th className="text-right p-2">Monthly Spend (sample)</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((r: any, i: number) => (
              <tr key={i} className="odd:bg-black/0 even:bg-black/5 dark:even:bg-white/5">
                <td className="p-2">{r.business_unit}</td>
                <td className="p-2">{r.application}</td>
                <td className="p-2 text-right">${Math.round(r.spend).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-black/60 dark:text-white/60">Add lifecycle, redundancy flags, and capability mapping as next step.</p>
    </div>
  );
}
