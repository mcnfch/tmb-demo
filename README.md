# TBM Demo Platform

A comprehensive Technology Business Management (TBM) demonstration platform focused on **cloud spend transparency and HPC cost management**. The platform answers critical business questions around utilization vs cost, chargeback/showback allocation, and budget variance scenarios across enterprise IT environments.

## 🎯 Vision

**Cloud spend transparency and HPC cost management**—answering utilization vs cost, chargeback/showback, and budget variance scenarios.

This demo portal helps IT leaders answer critical questions:

- Are my clusters over-provisioned (too much idle capacity)?
- Are my cloud bursts cost-effective (reserved vs spot vs on-demand)?
- What is the cost per simulation/project/business unit, and how does it trend over time?
- How can we optimize IT spend allocation and forecasting across all domains?

## 🏗️ Architecture

- **Database:** PostgreSQL (mockup) - designed to pull cloud financial and utilization data via API calls to generate CSVs
- **Dashboards:** Metabase dashboards (available but not integrated)
- **Frontend:** Next.js executive UI reading from CSV data sources
- **Data Schema:** FOCUS-inspired schema + TBM taxonomy
- **Visualization:** Interactive charts with Ant Design Charts and FINOS Perspective
- **AI Integration:** AI-powered analysis with OpenAI Assistant API
- **Sample Data:** Cloud, HPC (cluster + bursts) using parameterized, random data generation via Python scripts

### Tech Stack
- **Frontend:** Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Visualization:** FINOS Perspective + Ant Design Charts for interactive analysis
- **AI Integration:** OpenAI Assistant API for intelligent cost analysis
- **Database:** PostgreSQL with comprehensive TBM data models
- **Standards:** FOCUS-inspired schema for cloud costs, TBM taxonomy for service categorization

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ 
- PostgreSQL database
- NPM or compatible package manager

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up your database:
```bash
# Initialize database schema and seed data
./scripts/seed_and_load.sh
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3333](http://localhost:3333).

### Available Scripts
- `npm run dev` - Start development server on port 3333
- `npm run build` - Build for production with Turbopack
- `npm run start` - Start production server on port 3333
- `npm run lint` - Run ESLint

## 📊 Available Pages

### Dashboard
Executive summary, spend trends, variance analysis

### TBM Map
Service mapping and categorization

### Chargeback
Cost allocation by business unit and application

### Finance
Budget tracking and forecasting

### Portfolio
Application portfolio overview

### Reporting
Interactive charts and AI analysis tools

### HPC
High Performance Computing usage and costs

## 🚀 HPC & Scaling Features

### Cluster TCO Allocation
- **CPU/GPU Hours Allocation:** Distribute cluster Total Cost of Ownership by actual compute hours consumed
- **Cost per Project:** Track true cost per simulation/project/business unit

### Cloud Burst Blending
- **Multi-Pricing Model Support:** On-demand, reserved, and spot instance cost tracking
- **Hybrid Cost Analysis:** Blend on-premises cluster costs with cloud burst expenses
- **Cost-Effectiveness Analysis:** Compare burst strategies across pricing models

### Over/Under Resourcing Indicators
- **Capacity Utilization Metrics:** Track cluster idle time vs peak usage
- **Resource Optimization Alerts:** Identify over-provisioned clusters (>40% idle)
- **Misallocation Detection:** Flag cloud bursts occurring while on-premises capacity sits idle

### What-If Scenarios
- **Capacity Planning:** Model adding 20% cluster capacity vs relying on spot instances
- **Reserved Instance Analysis:** Calculate savings from shifting 30% of jobs to reserved instances
- **ROI Optimization:** Compare capex investment vs variable cloud costs over 3-year horizons

## 🔄 Data Processing

The platform processes multiple data domains through a unified transformation pipeline:

1. **Cloud** - Normalize to FOCUS standard, allocate by tags and shared cost rules
2. **On-Premises** - Amortize capex, distribute infrastructure costs by utilization
3. **EUC** - Calculate TCO per device including capex, recurring, and soft costs
4. **Labor** - Allocate by supported assets and projects
5. **HPC** - Blend cluster TCO with cloud bursts for true project costs

## 🎯 Key Features

- **Multi-Domain Cost Analysis:** Unified view across all IT cost domains
- **AI-Powered Insights:** Automated analysis and recommendations
- **Interactive Visualizations:** Drill-down capabilities with Perspective
- **Scenario Modeling:** What-if analysis for capacity planning and optimization
- **Standards-Based:** Built on industry-standard FOCUS and TBM frameworks

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes for data access
│   ├── dashboard/         # Main dashboard
│   ├── finance/           # Financial reporting
│   ├── hpc/              # HPC analytics
│   └── tbm/              # TBM rollup views
├── components/            # Reusable UI components
├── data/                 # Mock data and utilities
└── lib/                  # Shared libraries and utilities
```

## 🤝 Contributing

This is a demonstration platform designed to showcase comprehensive TBM capabilities across enterprise IT environments.
