import ChartsClient from "../../components/ChartsClient";
import AIAnalysisPanel from "../../components/AIAnalysisPanel";

export default function Reporting() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Reporting</h1>
      <p className="text-sm text-black/70 dark:text-white/70">CSV/JSON endpoints for BI tools and finance deliverables.</p>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
        <h2 className="font-semibold mb-2">Downloads</h2>
        <ul className="list-disc pl-5">
          <li>
            <a className="underline" href="/api/spend?format=csv&download=1" download>
              Spend (CSV)
            </a>
            •
            <a className="underline" href="/api/spend?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/variance?format=csv&download=1" download>
              Variance (CSV)
            </a>
            •
            <a className="underline" href="/api/variance?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/top-services?format=csv&download=1" download>
              Top Services (CSV)
            </a>
            •
            <a className="underline" href="/api/top-services?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/hygiene?format=csv&download=1" download>
              Hygiene (CSV)
            </a>
            •
            <a className="underline" href="/api/hygiene?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/chargeback?format=csv&download=1" download>
              Chargeback (CSV)
            </a>
            •
            <a className="underline" href="/api/chargeback?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/tbm/rollup?format=csv&download=1" download>
              TBM Rollup (CSV)
            </a>
            •
            <a className="underline" href="/api/tbm/rollup?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/hpc/utilization?format=csv&download=1" download>
              HPC Utilization (CSV)
            </a>
            •
            <a className="underline" href="/api/hpc/utilization?download=1" download>
              JSON
            </a>
          </li>
          <li>
            <a className="underline" href="/api/hpc/burst?format=csv&download=1" download>
              HPC Burst (CSV)
            </a>
            •
            <a className="underline" href="/api/hpc/burst?download=1" download>
              JSON
            </a>
          </li>
        </ul>
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
        <h2 className="font-semibold mb-2">AI Analysis</h2>
        <p className="mb-2 text-black/70 dark:text-white/70">Send the selected dataset to the assistant (prompt: &quot;report&quot;).</p>
        <AIAnalysisPanel />
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
        <h2 className="font-semibold mb-2">Power BI / Tableau (mimicked)</h2>
        <p className="mb-2">Use “From Web” to connect to CSV endpoints above. For auth-free demo use, endpoints are open; in production, secure with token headers.</p>
        <ul className="list-disc pl-5">
          <li>Power BI Desktop: Get Data → Web → URL (e.g., /api/spend?format=csv)</li>
          <li>Tableau Desktop: Connect → Web Data → URL (CSV); set refresh schedule as needed</li>
          <li>Stable schemas: columns remain consistent for each endpoint</li>
        </ul>
        <div className="mt-4">
          <div className="text-xs text-black/60 dark:text-white/60 mb-2">Interactive visuals (client-only):</div>
          <ChartsClient />
        </div>
      </div>
      <div className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-sm">
        <h2 className="font-semibold mb-2">Runbook</h2>
        <ul className="list-disc pl-5">
          <li>CSV/JSON used for finance artifacts (Excel pivots, variance tracking)</li>
          <li>Chargeback includes unallocated line until mapping rules close gaps</li>
        </ul>
        <div className="mt-3 flex flex-wrap gap-3">
          <a className="underline" href="/runbook-demo.html" target="_blank" rel="noopener noreferrer">Open Demo Runbook (HTML)</a>
          <a className="underline" href="/runbook-demo.md" download>Download Markdown</a>
        </div>
      </div>
    </div>
  );
}
