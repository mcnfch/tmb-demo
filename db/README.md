# TBM Demo – Postgres in Docker

This repo includes a Dockerized Postgres setup plus SQL to bootstrap schemas, tables, and marts aligned to the project plan (FOCUS → TBM views). Optional Metabase is included for dashboards.

## Prereqs
- Docker + Docker Compose

## Quick start
1) Configure environment

```
cp .env.example .env
# Optionally adjust POSTGRES_* values in .env
```

2) Start services

```
docker compose up -d
```

This launches:
- `db` (Postgres 16) on `localhost:5432`
- `metabase` on `http://localhost:3000` (optional)

3) Load seeds and data

Place your FOCUS sample at `data/focus_sandbox.csv` (CSV with headers). Then run:

```
./scripts/load_data.sh
```

The script uses `\copy` to load:
- Seeds from `seeds/*.csv` → `ref.*` tables
- Optional `data/focus_sandbox.csv` → `raw.focus_cost_line_item`

4) Explore in SQL

```
docker compose exec -it db psql -U ${POSTGRES_USER:-tbm} -d ${POSTGRES_DB:-tbm}
-- Examples:
select * from marts.v_spend_by_bu_app_env limit 10;
select * from marts.v_untagged_cost;
select * from marts.v_top_services_trend limit 10;
select * from marts.v_variance_mo limit 10;
```

5) Connect Metabase (optional)
- Open `http://localhost:3000`
- Add database → Postgres → host `db`, port `5432`, db `${POSTGRES_DB}`, user `${POSTGRES_USER}`
- Build tiles from the `marts.*` views

## Data model
- `raw.focus_cost_line_item` stores FOCUS-like unified line items with `tags` as `jsonb`.
- `ref.*` tables hold mappings, taxonomy, shared cost rules, and forecasts.
- `int.int_allocated_costs` derives BU/App/Env via tags + mapping.
- `marts.*` provide exec-ready KPIs.

## Notes
- The Postgres image auto-runs SQL in `db/init` on first startup.
- `./data` and `./seeds` are mounted read-only at `/import` inside the container.
- Adjust tag keys (`app`, `env`, `bu`) in `db/init/02_views.sql` to match your data.

