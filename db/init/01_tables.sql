set search_path to raw, public;

-- FOCUS-like unified cost line items (flexible across clouds)
create table if not exists raw.focus_cost_line_item (
  usage_date       date,
  provider         text,
  service          text,
  sku              text,
  usage_qty        numeric,
  unit             text,
  unblended_cost   numeric,
  amortized_cost   numeric,
  account_id       text,
  subscription_id  text,
  project_id       text,
  region           text,
  tags             jsonb
);

set search_path to ref, public;

-- Mapping tag values to TBM-aligned dimensions
create table if not exists ref.allocation_map (
  tag_key       text not null,
  tag_value     text not null,
  application   text,
  environment   text,
  cost_center   text,
  business_unit text
);

-- TBM taxonomy reference (simplified for demo)
create table if not exists ref.tbm_dimensions (
  business_unit  text,
  application    text,
  environment    text,
  service_tower  text,
  service_name   text
);

-- Shared cost allocation rules
create table if not exists ref.shared_cost_rules (
  rule_id       text primary key,
  basis         text check (basis in ('spend','usage','heads')),
  scope         text,
  driver_weight numeric
);

-- Budgets / Forecasts by month and optional dims
create table if not exists ref.forecast (
  month         date not null,
  business_unit text,
  application   text,
  budget        numeric,
  forecast      numeric
);

