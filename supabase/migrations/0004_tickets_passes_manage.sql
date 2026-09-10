-- v9: ticket types, Ziggadoo passes (show at the door, pay there), venue self-service and the monthly confirmation loop.

alter table venues add column if not exists contact_name text;
alter table venues add column if not exists contact_email text;
alter table venues add column if not exists contact_whatsapp text;
alter table venues add column if not exists passes_enabled boolean not null default false;
alter table venues add column if not exists prices_confirmed_at timestamptz;
alter table venues add column if not exists nudge_count int not null default 0;
alter table venues add column if not exists last_nudged_at timestamptz;
alter table venues add column if not exists needs_call boolean not null default false;
create index if not exists venues_contact_email_idx on venues (lower(contact_email));

create table if not exists ticket_types (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  description text,
  price_aed numeric,
  ziggadoo_price_aed numeric,
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ticket_types_venue_idx on ticket_types (venue_id, active, sort_order);
alter table ticket_types enable row level security;
drop policy if exists "ticket types public read" on ticket_types;
create policy "ticket types public read" on ticket_types for select using (active or is_admin());
drop policy if exists "ticket types admin" on ticket_types;
create policy "ticket types admin" on ticket_types for all using (is_admin()) with check (is_admin());

create table if not exists passes (
  id uuid primary key default uuid_generate_v4(),
  token uuid not null unique default uuid_generate_v4(),
  code text not null unique,
  venue_id uuid not null references venues(id) on delete cascade,
  ticket_type_id uuid references ticket_types(id) on delete set null,
  ticket_name text not null,
  price_aed numeric,
  ziggadoo_price_aed numeric,
  visit_date date not null,
  kids int,
  email text,
  whatsapp text,
  status text not null default 'issued' check (status in ('issued','used','reported')),
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists passes_venue_date_idx on passes (venue_id, visit_date);
alter table passes enable row level security;
drop policy if exists "passes admin" on passes;
create policy "passes admin" on passes for all using (is_admin()) with check (is_admin());

create table if not exists pass_reports (
  id uuid primary key default uuid_generate_v4(),
  pass_id uuid not null references passes(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table pass_reports enable row level security;
drop policy if exists "pass reports admin" on pass_reports;
create policy "pass reports admin" on pass_reports for all using (is_admin()) with check (is_admin());

create table if not exists venue_manage_tokens (
  token uuid primary key default uuid_generate_v4(),
  venue_id uuid not null references venues(id) on delete cascade,
  email text not null,
  expires_at timestamptz not null default now() + interval '14 days',
  created_at timestamptz not null default now()
);
alter table venue_manage_tokens enable row level security;
drop policy if exists "manage tokens admin" on venue_manage_tokens;
create policy "manage tokens admin" on venue_manage_tokens for all using (is_admin()) with check (is_admin());
