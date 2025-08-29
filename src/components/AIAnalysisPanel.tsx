"use client";

import { useState } from "react";

const ENDPOINTS = [
  { key: "spend", label: "Spend" },
  { key: "variance", label: "Variance" },
  { key: "top-services", label: "Top Services" },
  { key: "hygiene", label: "Hygiene" },
  { key: "chargeback", label: "Chargeback" },
  { key: "tbm-rollup", label: "TBM Rollup" },
  { key: "hpc-utilization", label: "HPC Utilization" },
  { key: "hpc-burst", label: "HPC Burst" },
  { key: "comprehensive", label: "Comprehensive" },
] as const;

export default function AIAnalysisPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const run = async (endpoint: string) => {
    try {
      setActive(endpoint);
      setOpen(true);
      setLoading(true);
      setResult(null);
      const res = await fetch(`/api/ai/analysis?endpoint=${encodeURIComponent(endpoint)}`, { cache: "no-store" });
      const data = await res.json();
      console.log('AI Analysis Response:', data);
      setResult(data);
    } catch (e: any) {
      console.error('AI Analysis Error:', e);
      setResult({ error: e?.message || "Failed to analyze" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ENDPOINTS.map((e) => (
          <button
            key={e.key}
            onClick={() => run(e.key)}
            className="px-3 py-1 rounded border text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            {e.label}
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-w-2xl w-[90%] rounded-lg bg-white dark:bg-zinc-900 text-sm p-4 border border-black/10 dark:border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">AI Analysis — {active}</div>
              <button onClick={() => setOpen(false)} className="px-2 py-1 rounded border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/10">Close</button>
            </div>
            {loading && <div className="text-black/60 dark:text-white/60">Analyzing…</div>}
            {!loading && result && (
              <div className="flex flex-col gap-3 max-h-[60vh] overflow-auto">
                {result.diagnostics?.ai_powered && (
                  <div className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-2 rounded">
                    ✅ Powered by OpenAI Assistant API
                  </div>
                )}
                {result.diagnostics?.ai_powered === false && (
                  <div className="text-xs bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 p-2 rounded">
                    ⚠️ Using fallback analysis - AI not available
                  </div>
                )}
                {result.error && <div className="text-red-600">{result.error}</div>}
                {result.insights && (
                  <div>
                    <div className="font-medium">AI Insights</div>
                    <div className="text-sm">{String(result.insights)}</div>
                  </div>
                )}
                {result.data_quality && (
                  <div>
                    <div className="font-medium">Data Quality Assessment</div>
                    <div className="text-sm">{String(result.data_quality)}</div>
                  </div>
                )}
                {result.analysis && (
                  <>
                    {result.analysis.spend_trends && Array.isArray(result.analysis.spend_trends) && (
                      <div>
                        <div className="font-medium">Spend Trends</div>
                        <ul className="list-disc pl-5">{result.analysis.spend_trends.map((s: any, i: number) => <li key={i}>{String(s)}</li>)}</ul>
                      </div>
                    )}
                    {result.analysis.notable_spikes_dips && Array.isArray(result.analysis.notable_spikes_dips) && (
                      <div>
                        <div className="font-medium">Notable Spikes/Dips</div>
                        <ul className="list-disc pl-5">{result.analysis.notable_spikes_dips.map((s: any, i: number) => <li key={i}>{String(s)}</li>)}</ul>
                      </div>
                    )}
                    {result.analysis.cumulative_view && Array.isArray(result.analysis.cumulative_view) && (
                      <div>
                        <div className="font-medium">Cumulative View</div>
                        <ul className="list-disc pl-5">{result.analysis.cumulative_view.map((s: any, i: number) => <li key={i}>{String(s)}</li>)}</ul>
                      </div>
                    )}
                    {result.analysis.recommendations && Array.isArray(result.analysis.recommendations) && (
                      <div>
                        <div className="font-medium">Recommendations</div>
                        <ul className="list-disc pl-5">{result.analysis.recommendations.map((s: any, i: number) => <li key={i}>{String(s)}</li>)}</ul>
                      </div>
                    )}
                  </>
                )}
                {result.diagnostics && (
                  <div className="text-xs text-black/60 dark:text-white/60">
                    <div>Rows: {String(result.diagnostics.row_count || 0)}</div>
                    {result.diagnostics.missing_columns?.length > 0 && (
                      <div>Missing columns: {result.diagnostics.missing_columns.join(", ")}</div>
                    )}
                    {result.diagnostics.notes && <div>Notes: {String(result.diagnostics.notes)}</div>}
                  </div>
                )}
                {result.raw_response && (
                  <details>
                    <summary>Raw AI Response</summary>
                    <pre className="text-xs bg-blue-50 dark:bg-blue-900/20 p-2 rounded overflow-auto whitespace-pre-wrap">{result.raw_response}</pre>
                  </details>
                )}
                <details>
                  <summary>Raw JSON</summary>
                  <pre className="text-xs bg-black/5 dark:bg-white/10 p-2 rounded overflow-auto">{JSON.stringify(result, null, 2)}</pre>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
