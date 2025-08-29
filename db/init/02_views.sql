set search_path to int, public;

-- Normalize cost and derive basic tag-based dimensions
create or replace view int.int_allocated_costs as
with li as (
  select
    usage_date,
    provider,
    service,
    sku,
    coalesce(amortized_cost, unblended_cost) as cost,
    usage_qty,
    unit,
    account_id,
    region,
    tags
  from raw.focus_cost_line_item
),
expanded as (
  select
    li.*,
    nullif(trim(tags->>'app'), '') as tag_app,
    nullif(trim(tags->>'env'), '') as tag_env,
    nullif(trim(tags->>'bu'),  '') as tag_bu
  from li
),
tag_map as (
  select tag_key, tag_value, application, environment, cost_center, business_unit
  from ref.allocation_map
)
select
  usage_date,
  provider,
  service,
  sku,
  region,
  coalesce(tm.business_unit, e.tag_bu,  'Unallocated') as business_unit,
  coalesce(tm.application,  e.tag_app, 'Unallocated') as application,
  coalesce(tm.environment,  e.tag_env, 'Unspecified') as environment,
  cost,
  usage_qty,
  unit
from expanded e
left join tag_map tm
  on tm.tag_key = 'app' and tm.tag_value = e.tag_app;

set search_path to marts, public;

-- Spend by BU / App / Env per day (month in query)
create or replace view marts.v_spend_by_bu_app_env as
select
  usage_date,
  business_unit,
  application,
  environment,
  sum(cost) as spend
from int.int_allocated_costs
group by 1,2,3,4;

-- Untagged percentage (Unallocated share)
create or replace view marts.v_untagged_cost as
with tot as (
  select sum(cost) as total_cost from int.int_allocated_costs
), untag as (
  select sum(cost) as untag_cost from int.int_allocated_costs where business_unit = 'Unallocated'
)
select
  case when tot.total_cost > 0 then round(100.0 * untag.untag_cost / tot.total_cost, 2) else 0 end as untagged_pct
from tot, untag;

-- Top services trend (month)
create or replace view marts.v_top_services_trend as
select
  date_trunc('month', usage_date) as month,
  service,
  sum(cost) as spend
from int.int_allocated_costs
group by 1,2
order by 1, spend desc;

-- Variance vs forecast by month and optional dims
create or replace view marts.v_variance_mo as
with actual as (
  select
    date_trunc('month', usage_date)::date as month,
    business_unit,
    application,
    sum(cost) as actual
  from int.int_allocated_costs
  group by 1,2,3
)
select
  coalesce(a.month, f.month) as month,
  coalesce(a.business_unit, f.business_unit) as business_unit,
  coalesce(a.application, f.application) as application,
  a.actual,
  f.budget,
  f.forecast,
  (a.actual - coalesce(f.budget, 0))   as variance_vs_budget,
  (a.actual - coalesce(f.forecast, 0)) as variance_vs_forecast
from actual a
full outer join ref.forecast f
  on a.month = f.month
 and (a.business_unit is not distinct from f.business_unit)
 and (a.application  is not distinct from f.application);

