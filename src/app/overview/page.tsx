export default function Overview() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Comprehensive TBM Demo Overview</h1>
      <section>
        <h2 className="text-lg font-semibold mb-2">Vision</h2>
        <p className="text-sm text-black/70 dark:text-white/70">
          Cloud spend transparency and HPC cost management—answering utilization vs cost, chargeback/showback, and budget variance scenarios.
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Architecture</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>PostgreSQL database (mockup) - would pull cloud financial and utilization data via API calls to generate CSVs</li>
          <li>Metabase dashboards (available but not integrated)</li>
          <li>Next.js executive UI reading from CSV data sources</li>
          <li>FOCUS-inspired schema + TBM taxonomy</li>
          <li>Interactive charts with Ant Design Charts</li>
          <li>AI-powered analysis with OpenAI Assistant API</li>
          <li>Sample data: cloud, HPC (cluster + bursts) using parameterized, random data generation via Python scripts</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Available Pages</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>Dashboard: Executive summary, spend trends, variance analysis</li>
          <li>TBM Map: Service mapping and categorization</li>
          <li>Chargeback: Cost allocation by business unit and application</li>
          <li>Finance: Budget tracking and forecasting</li>
          <li>Portfolio: Application portfolio overview</li>
          <li>Reporting: Interactive charts and AI analysis tools</li>
          <li>HPC: High Performance Computing usage and costs</li>
        </ul>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">HPC & Scaling</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>Cluster TCO allocation by CPU/GPU hours</li>
          <li>Cloud burst blending (on‑demand, reserved, spot)</li>
          <li>Over/under resourcing indicators and what‑if scenarios</li>
        </ul>
      </section>
    </div>
  );
}
