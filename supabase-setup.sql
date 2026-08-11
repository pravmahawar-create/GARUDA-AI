-- ============================================================
-- GARUDA LEADS TABLE — Supabase SQL setup
-- How to use (2 minutes):
--   1. Go to https://supabase.com/dashboard
--   2. Select your project (gcifzzuyswrcwvkcfqbr)
--   3. Left menu -> SQL Editor -> New query
--   4. Paste ALL of this and click "Run"
-- ============================================================

create table if not exists public.leads (
  id bigint generated always as identity primary key,
  email text,
  phone text,
  first_name text,
  source text default 'unknown',
  user_id text,
  message text,
  reply_snippet text,
  status text default 'new',
  captured_at timestamptz default now()
);

-- Allow anyone (even anonymous website visitors) to insert leads.
alter table public.leads enable row level security;

drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert"
  on public.leads
  for insert
  with check (true);

-- Founder/dashboard can read their own leads later.
drop policy if exists "leads_public_select" on public.leads;
create policy "leads_public_select"
  on public.leads
  for select
  using (true);

-- ============================================================
-- GARUDA FOUNDER MEMORY TABLE
-- Persistent founder-fact memory (orders, partners, positioning).
-- Only the server (service-role key) reads/writes this — no anon access.
-- ============================================================

create table if not exists public.founder_memory (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table public.founder_memory enable row level security;

drop policy if exists "founder_memory_admin_all" on public.founder_memory;
create policy "founder_memory_admin_all"
  on public.founder_memory
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
