export type SpendRow = {
  usage_date: string;
  business_unit: string;
  application: string;
  environment: string;
  spend: number;
};

export type VarianceRow = {
  month: string;
  business_unit: string | null;
  application: string | null;
  actual: number;
  budget: number | null;
  forecast: number | null;
  variance_vs_budget: number | null;
  variance_vs_forecast: number | null;
};

export type ServiceTrendRow = { month: string; service: string; spend: number };

export const MOCK_UNTAGGED = { untagged_pct: 7.8 };

export const MOCK_SPEND: SpendRow[] = [
  { usage_date: "2025-01-01", business_unit: "Commerce", application: "Orders", environment: "Prod", spend: 4200 },
  { usage_date: "2025-01-01", business_unit: "Marketing", application: "Website", environment: "Prod", spend: 2100 },
  { usage_date: "2025-01-02", business_unit: "Commerce", application: "Orders", environment: "Prod", spend: 4300 },
  { usage_date: "2025-01-02", business_unit: "Marketing", application: "Website", environment: "Prod", spend: 1950 },
];

export const MOCK_VARIANCE: VarianceRow[] = [
  { month: "2025-01-01", business_unit: "Commerce", application: "Orders", actual: 121000, budget: 120000, forecast: 125000, variance_vs_budget: 1000, variance_vs_forecast: -4000 },
  { month: "2025-01-01", business_unit: "Marketing", application: "Website", actual: 59000, budget: 60000, forecast: 58000, variance_vs_budget: -1000, variance_vs_forecast: 1000 },
];

export const MOCK_SERVICES: ServiceTrendRow[] = [
  { month: "2025-01-01", service: "Compute", spend: 5200 },
  { month: "2025-01-01", service: "Storage", spend: 2400 },
  { month: "2025-02-01", service: "Compute", spend: 5400 },
  { month: "2025-02-01", service: "Storage", spend: 2500 },
];

// --- HPC mock data ---
export type HpcUtilizationRow = {
  month: string; // YYYY-MM-01
  node_count: number;
  hours_in_month: number; // total hours for entire cluster if 1 node, multiply by node_count for capacity
  used_cpu_hours: number; // aggregate CPU hours consumed on-prem
  used_gpu_hours: number; // aggregate GPU hours consumed on-prem
  cluster_cost: number; // amortized + opex + power for the month
};

export type HpcBurstSpendRow = {
  month: string;
  pricing_model: "on_demand" | "reserved" | "spot";
  spend: number;
};

export type HpcSummary = {
  avg_utilization_pct: number; // used_hours / (node_count * hours_in_month)
  over_provisioned: boolean; // heuristic > 40% idle
  burst_while_idle_flag: boolean; // burst spend while low utilization
  total_burst_spend: number;
  cluster_monthly_cost: number;
};

export const MOCK_HPC_UTILIZATION: HpcUtilizationRow[] = [
  {
    month: "2025-01-01",
    node_count: 50,
    hours_in_month: 31 * 24,
    used_cpu_hours: 50 * 31 * 24 * 0.52, // 52% avg CPU usage
    used_gpu_hours: 50 * 31 * 24 * 0.21, // subset GPU jobs
    cluster_cost: 78000,
  },
  {
    month: "2025-02-01",
    node_count: 50,
    hours_in_month: 28 * 24,
    used_cpu_hours: 50 * 28 * 24 * 0.46,
    used_gpu_hours: 50 * 28 * 24 * 0.19,
    cluster_cost: 78000,
  },
  {
    month: "2025-03-01",
    node_count: 50,
    hours_in_month: 31 * 24,
    used_cpu_hours: 50 * 31 * 24 * 0.39, // dips -> potential over-provision
    used_gpu_hours: 50 * 31 * 24 * 0.16,
    cluster_cost: 78000,
  },
];

export const MOCK_HPC_BURST: HpcBurstSpendRow[] = [
  { month: "2025-01-01", pricing_model: "on_demand", spend: 11000 },
  { month: "2025-01-01", pricing_model: "reserved", spend: 6000 },
  { month: "2025-01-01", pricing_model: "spot", spend: 3500 },
  { month: "2025-02-01", pricing_model: "on_demand", spend: 9000 },
  { month: "2025-02-01", pricing_model: "reserved", spend: 6000 },
  { month: "2025-02-01", pricing_model: "spot", spend: 4200 },
  { month: "2025-03-01", pricing_model: "on_demand", spend: 8000 },
  { month: "2025-03-01", pricing_model: "reserved", spend: 6000 },
  { month: "2025-03-01", pricing_model: "spot", spend: 5000 },
];

export const MOCK_HPC_SUMMARY: HpcSummary = (() => {
  const latest = MOCK_HPC_UTILIZATION[MOCK_HPC_UTILIZATION.length - 1];
  const capacity_hours = latest.node_count * latest.hours_in_month;
  const used_hours = latest.used_cpu_hours; // conservative: base on CPU
  const avg_utilization_pct = Math.round((used_hours / capacity_hours) * 1000) / 10;
  const idle_pct = 100 - avg_utilization_pct;
  const over_provisioned = idle_pct > 40; // heuristic per overview
  const months = new Set(MOCK_HPC_BURST.map((b) => b.month));
  const total_burst_spend = Array.from(months).reduce((acc, m) => {
    return (
      acc +
      MOCK_HPC_BURST.filter((b) => b.month === m).reduce((s, r) => s + r.spend, 0)
    );
  }, 0);
  const burst_latest = MOCK_HPC_BURST.filter((b) => b.month === latest.month).reduce((s, r) => s + r.spend, 0);
  const burst_while_idle_flag = over_provisioned && burst_latest > 0;
  return {
    avg_utilization_pct,
    over_provisioned,
    burst_while_idle_flag,
    total_burst_spend,
    cluster_monthly_cost: latest.cluster_cost,
  };
})();

// --- Hygiene mock ---
export type HygieneSummary = {
  untagged_pct: number;
  unmapped_services: number; // count
  focus_conformance_pct: number;
  target_untagged_pct: number;
  target_focus_pct: number;
};

export const MOCK_HYGIENE: HygieneSummary = {
  untagged_pct: 7.8,
  unmapped_services: 3,
  focus_conformance_pct: 93,
  target_untagged_pct: 5,
  target_focus_pct: 95,
};

// --- TBM rollup mock ---
export type TbmRollupRow = {
  cost_pool: string; // e.g., Infra Capex, Cloud, Labor
  tower: string; // TBM Tower
  service: string; // TBM Service
  application: string; // App
  monthly_cost: number;
};

export const MOCK_TBM_ROLLUP: TbmRollupRow[] = [
  { cost_pool: "Cloud", tower: "Compute", service: "EC2", application: "Orders", monthly_cost: 42000 },
  { cost_pool: "Cloud", tower: "Storage", service: "S3", application: "Website", monthly_cost: 9800 },
  { cost_pool: "On‑Prem", tower: "HPC", service: "Cluster", application: "ResearchSim", monthly_cost: 78000 },
  { cost_pool: "Labor", tower: "Platform", service: "SRE", application: "Shared", monthly_cost: 32000 },
];

// --- Chargeback/showback mock ---
export type ChargebackRow = {
  business_unit: string;
  application: string;
  usage_units: number; // e.g., vCPU‑hours
  rate_per_unit: number; // $ per unit
  allocated_cost: number; // usage * rate
};

export type ChargebackSummary = {
  total_allocated: number;
  unallocated: number;
};

export const MOCK_CHARGEBACK: ChargebackRow[] = [
  { business_unit: "Commerce", application: "Orders", usage_units: 12500, rate_per_unit: 0.45, allocated_cost: Math.round(12500 * 0.45) },
  { business_unit: "Marketing", application: "Website", usage_units: 6800, rate_per_unit: 0.45, allocated_cost: Math.round(6800 * 0.45) },
  { business_unit: "R&D", application: "ResearchSim", usage_units: 4200, rate_per_unit: 0.45, allocated_cost: Math.round(4200 * 0.45) },
];

export const MOCK_CHARGEBACK_SUMMARY: ChargebackSummary = (() => {
  const total_allocated = MOCK_CHARGEBACK.reduce((s, r) => s + r.allocated_cost, 0);
  const unallocated = 8500; // placeholder shared costs not yet mapped
  return { total_allocated, unallocated };
})();
