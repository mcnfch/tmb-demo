import { getJSON } from "../../lib/api";

export default async function Finance() {
  const variance = await getJSON<any[]>("/api/variance");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Finance – Budget vs Actuals</h1>
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
              <th className="text-right p-2">Variance vs Budget</th>
              <th className="text-right p-2">Variance vs Forecast</th>
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
    </div>
  );
}
