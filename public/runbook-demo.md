# TBM/Finance Reporting Runbook (Demo)

Purpose: Produce monthly CSV/JSON artifacts Finance can pivot in Excel and load into BI dashboards, with clear controls and transparency for executives.

Scope (Demo)
- Jan–Aug 2025 spend/plan/forecast for Commerce/Orders and Marketing/Website
- KPIs + Top Variances; explicit Unallocated line

Process (ETLVD)
- Extract cloud/plan data from CSVs
- Transform to normalized shapes; coerce numerics; enrich BU/App
- Load to `/api/*` as JSON/CSV
- Validate hygiene, coverage; clamp obvious demo artifacts
- Distribute downloads + exec dashboard

Controls
- Unallocated line until mapping complete
- Hygiene KPIs (Untagged %, FOCUS vs target)
- Plan coverage guardrail for demo realism

Sample CSV
Month,BU,App,Actual,Budget,Forecast,Variance vs Budget,Variance vs Forecast
2025-01-01,Commerce,Orders,562319,540000,550000,22319,12319
2025-01-01,Marketing,Website,668893,710000,700000,-41107,-31107
2025-02-01,Commerce,Orders,646181,660000,650000,-13819,-3819
2025-02-01,Marketing,Website,951513,930000,940000,21513,11513
