-- Applied to production 13 Sept 2026 via Supabase MCP. Kept here for the record.
alter table reviews add column if not exists value_score smallint check (value_score between 1 and 5);
create table if not exists review_notes (review_id uuid primary key references reviews(id) on delete cascade, profile_id uuid not null references profiles(id) on delete cascade, note text not null, created_at timestamptz not null default now());
alter table review_notes enable row level security;
create policy "review notes own write" on review_notes for insert with check (auth.uid() = profile_id);
create policy "review notes own update" on review_notes for update using (auth.uid() = profile_id);
create policy "review notes admin" on review_notes for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
alter table venues add column if not exists good_to_know text;
alter table venues add column if not exists pro_tip text;
alter table venues add column if not exists chain text;
create index if not exists venues_chain_idx on venues(chain) where chain is not null;
create table if not exists saved_venues (profile_id uuid not null references profiles(id) on delete cascade, venue_id uuid not null references venues(id) on delete cascade, kind text not null check (kind in ('saved','been')), created_at timestamptz not null default now(), primary key (profile_id, venue_id, kind));
alter table saved_venues enable row level security;
create policy "saved own" on saved_venues for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
