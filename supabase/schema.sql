-- ============================================================
-- AutoTrack Pro — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── vehicles table ──────────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id               uuid primary key default uuid_generate_v4(),

  -- UNIQUE fields: VIN is globally unique per physical vehicle
  -- idempotency_key ensures exactly-once sync from offline queue
  vin              text not null unique,
  idempotency_key  text not null unique,

  -- Vehicle identity
  make             text not null,
  model            text not null,
  year             integer not null check (year >= 1900 and year <= 2100),
  trim             text not null default '',
  color            text not null default '',

  -- Technical
  fuel_type        text not null default 'gasoline'
                     check (fuel_type in ('gasoline','diesel','electric','hybrid','plug_in_hybrid')),
  drive_type       text not null default 'FWD'
                     check (drive_type in ('FWD','RWD','AWD','4WD')),
  engine           text not null default '',
  transmission     text not null default '',
  mileage          integer not null default 0 check (mileage >= 0),

  -- Logistics
  status           text not null default 'arrived'
                     check (status in ('in_transit','arrived','inspected','released','hold','damaged')),
  arrival_date     timestamptz,

  -- LOT NUMBER: unique per yard yard assignment
  lot_number       text not null unique,

  location         text not null default '',
  inspector_id     text,
  notes            text not null default '',

  -- Timestamps
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_vehicles_updated on public.vehicles;
create trigger on_vehicles_updated
  before update on public.vehicles
  for each row execute procedure public.handle_updated_at();

-- Indexes for common query patterns
create index if not exists vehicles_status_idx    on public.vehicles (status);
create index if not exists vehicles_make_idx      on public.vehicles (make);
create index if not exists vehicles_vin_idx       on public.vehicles (vin);
create index if not exists vehicles_idem_key_idx  on public.vehicles (idempotency_key);
create index if not exists vehicles_created_at_idx on public.vehicles (created_at desc);

-- Row Level Security — public read for inspectors (adjust for auth later)
alter table public.vehicles enable row level security;

create policy "Allow all for anon" on public.vehicles
  for all using (true) with check (true);

-- ─── Done ────────────────────────────────────────────────────────────────────
-- Unique constraints summary:
--   vin              → one record per physical vehicle (global)
--   idempotency_key  → prevents duplicate inserts from offline sync retries
--   lot_number       → one vehicle per yard lot slot at a time
