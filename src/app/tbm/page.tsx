import { getJSON } from "../../lib/api";

export default async function TbmMap() {
  const rows = await getJSON<any[]>("/api/tbm/rollup");
  const total = rows.reduce((s, r: any) => s + (r.monthly_cost || 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">TBM Taxonomy Map (sample)</h1>
      <p className="text-sm text-black/70 dark:text-white/70">Cost pools → Towers → Services → Apps with sample costs.</p>
      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/5 dark:bg-white/10">
              <th className="text-left p-2">Cost Pool</th>
              <th className="text-left p-2">Tower</th>
              <th className="text-left p-2">Service</th>
              <th className="text-left p-2">Application</th>
              <th className="text-right p-2">Monthly Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => (
              <tr key={i} className="odd:bg-black/0 even:bg-black/5 dark:even:bg-white/5">
                <td className="p-2">{r.cost_pool}</td>
                <td className="p-2">{r.tower}</td>
                <td className="p-2">{r.service}</td>
                <td className="p-2">{r.application}</td>
                <td className="p-2 text-right">${r.monthly_cost.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="p-2" colSpan={4}>Total</td>
              <td className="p-2 text-right">${total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

