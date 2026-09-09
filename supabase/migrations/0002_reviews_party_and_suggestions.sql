-- Party fit on reviews, height tip on venues, and a table for parent-submitted new places.
alter table reviews
  add column good_for_party boolean,
  add column party_note text;

alter table venues
  add column height_note text,
  add column aliases text[] not null default '{}';

create table venue_suggestions (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid references profiles(id) on delete set null,
  name        text not null,
  area        text,
  url         text,
  note        text,
  status      moderation_status not null default 'pending',
  created_at  timestamptz not null default now()
);
alter table venue_suggestions enable row level security;
create policy "suggestions insert" on venue_suggestions for insert with check (profile_id = auth.uid());
create policy "suggestions read own" on venue_suggestions for select using (profile_id = auth.uid());
create policy "suggestions admin" on venue_suggestions for all using (is_admin()) with check (is_admin());

-- Party fit aggregate
create or replace view venue_party_stats as
select venue_id,
  count(*) filter (where good_for_party is not null)::int as party_votes,
  round(100.0 * avg(case when good_for_party then 1 else 0 end) filter (where good_for_party is not null))::int as party_pct
from reviews where status = 'approved' group by venue_id;
