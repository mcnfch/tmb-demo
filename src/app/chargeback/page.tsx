import { getJSON } from "../../lib/api";

type Resp = { rows: any[]; summary: { total_allocated: number; unallocated: number } };

export default async function Chargeback() {
  const data = await getJSON<Resp>("/api/chargeback");
  const grandTotal = data.summary.total_allocated + data.summary.unallocated;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Showback / Chargeback (sample)</h1>
      <p className="text-sm text-black/70 dark:text-white/70">Rate × Usage = Cost, with unallocated highlighted.</p>
      <div className="rounded-lg border border-black/10 dark:border-white/10 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/5 dark:bg-white/10">
              <th className="text-left p-2">BU</th>
              <th className="text-left p-2">App</th>
              <th className="text-right p-2">Usage Units</th>
              <th className="text-right p-2">Rate/Unit</th>
              <th className="text-right p-2">Allocated Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r: any, i: number) => (
              <tr key={i} className="odd:bg-black/0 even:bg-black/5 dark:even:bg-white/5">
                <td className="p-2">{r.business_unit}</td>
                <td className="p-2">{r.application}</td>
                <td className="p-2 text-right">{r.usage_units.toLocaleString()}</td>
                <td className="p-2 text-right">${r.rate_per_unit.toFixed(2)}</td>
                <td className="p-2 text-right">${r.allocated_cost.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="text-amber-700 dark:text-amber-400">
              <td className="p-2">—</td>
              <td className="p-2">Unallocated</td>
              <td className="p-2 text-right">—</td>
              <td className="p-2 text-right">—</td>
              <td className="p-2 text-right">${data.summary.unallocated.toLocaleString()}</td>
            </tr>
            <tr className="font-semibold">
              <td className="p-2" colSpan={4}>Grand Total</td>
              <td className="p-2 text-right">${grandTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

