-- ============================================================
-- Ziggadoo foundation schema
-- Venues / events / locations / people / reviews / freshness
-- ============================================================

create extension if not exists postgis;
create extension if not exists pg_trgm;
create extension if not exists "uuid-ossp";

-- ---------- Enums ----------
create type verification_status as enum ('draft', 'needs_review', 'verified', 'archived');
create type indoor_outdoor as enum ('indoor', 'outdoor', 'mixed');
create type price_model as enum ('free', 'per_child', 'per_person', 'per_family', 'from', 'unknown');
create type booking_mode as enum ('walk_in', 'recommended', 'required');
create type location_kind as enum ('mall', 'park', 'beach', 'hotel', 'district', 'attraction', 'other');
create type content_source as enum ('ai_seed', 'admin', 'parent', 'business');
create type moderation_status as enum ('pending', 'approved', 'rejected');
create type report_kind as enum ('closed', 'wrong_hours', 'wrong_price', 'wrong_ages', 'wrong_location', 'other');
create type report_status as enum ('open', 'investigating', 'resolved', 'dismissed');
create type user_role as enum ('parent', 'business', 'admin');

-- ---------- Helper: updated_at ----------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============================================================
-- LOCATIONS: containers a venue sits inside (mall, park, beach).
-- Never an activity in their own right.
-- ============================================================
create table locations (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null,
  name          text not null,
  kind          location_kind not null default 'other',
  area          text,                       -- Dubai community, e.g. "Downtown Dubai"
  address       text,
  geom          geography(point, 4326),
  parking_notes text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index locations_geom_idx on locations using gist (geom);
create trigger locations_updated before update on locations for each row execute function set_updated_at();

-- ============================================================
-- VENUES: the thing you actually go to and pay for.
-- ============================================================
create table venues (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text unique not null,
  name                text not null,
  tagline             text,
  description         text,
  location_id         uuid references locations(id) on delete set null,
  area                text,                 -- Dubai community for SEO/filters
  address             text,
  geom                geography(point, 4326) not null,
  indoor_outdoor      indoor_outdoor not null default 'indoor',
  categories          text[] not null default '{}',   -- e.g. {play, water, learning, animals, sport}
  -- Age fit (months, so 18m vs 2y is expressible). Venue's own claim.
  age_min_months      int,
  age_max_months      int,
  best_age_min_months int,
  best_age_max_months int,
  -- Pricing: enough structure to compute "AED X for your family"
  price_model         price_model not null default 'unknown',
  price_child_aed     numeric(8,2),
  price_adult_aed     numeric(8,2),
  adult_entry_free    boolean,
  free_under_months   int,                  -- e.g. 24 = under 2s free
  price_notes         text,
  booking             booking_mode not null default 'walk_in',
  booking_url         text,
  whatsapp            text,                 -- E.164, e.g. +9715...
  phone               text,
  website             text,
  instagram           text,
  typical_duration_min int,
  facilities          jsonb not null default '{}'::jsonb, -- {parking:true, cafe:true, baby_change:true, stroller_friendly:true, shade:false}
  opening_hours       jsonb not null default '{}'::jsonb, -- {mon:[["10:00","22:00"]], ...} ; empty = unknown
  seasonal_notes      text,                 -- e.g. "Outdoor area closed Jun to Sep"
  hero_image_url      text,
  -- Freshness and trust
  status              verification_status not null default 'draft',
  source              content_source not null default 'admin',
  last_verified_at    timestamptz,
  verified_by         uuid,                 -- profile id, set when verified
  published_at        timestamptz,
  -- Commercial
  is_sponsored        boolean not null default false,
  claimed_by          uuid,                 -- profile id of business owner
  -- Search
  search              tsvector generated always as (
                        setweight(to_tsvector('english', coalesce(name,'')), 'A') ||
                        setweight(to_tsvector('english', coalesce(tagline,'')), 'B') ||
                        setweight(to_tsvector('english', coalesce(area,'')), 'B') ||
                        setweight(to_tsvector('english', coalesce(description,'')), 'C')
                      ) stored,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint venues_age_range check (age_min_months is null or age_max_months is null or age_min_months <= age_max_months)
);
create index venues_geom_idx on venues using gist (geom);
create index venues_status_idx on venues (status);
create index venues_area_idx on venues (area);
create index venues_categories_idx on venues using gin (categories);
create index venues_search_idx on venues using gin (search);
create index venues_name_trgm_idx on venues using gin (name gin_trgm_ops);
create trigger venues_updated before update on venues for each row execute function set_updated_at();

-- ============================================================
-- EVENTS: time-bound things at a venue (workshop, camp, show)
-- ============================================================
create table events (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid not null references venues(id) on delete cascade,
  slug            text unique not null,
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  recurrence_note text,                     -- "Every Saturday until 30 Nov"
  age_min_months  int,
  age_max_months  int,
  price_model     price_model not null default 'unknown',
  price_child_aed numeric(8,2),
  price_adult_aed numeric(8,2),
  booking_url     text,
  status          verification_status not null default 'draft',
  source          content_source not null default 'admin',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index events_venue_idx on events (venue_id);
create index events_time_idx on events (starts_at, ends_at);
create trigger events_updated before update on events for each row execute function set_updated_at();

-- ============================================================
-- PHOTOS
-- ============================================================
create table venue_photos (
  id            uuid primary key default uuid_generate_v4(),
  venue_id      uuid not null references venues(id) on delete cascade,
  storage_path  text not null,               -- Supabase Storage path
  caption       text,
  is_community  boolean not null default false, -- parent-submitted vs venue/official
  submitted_by  uuid,
  status        moderation_status not null default 'pending',
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index venue_photos_venue_idx on venue_photos (venue_id, status);

-- ============================================================
-- PEOPLE
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  role          user_role not null default 'parent',
  home_area     text,
  home_geom     geography(point, 4326),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger profiles_updated before update on profiles for each row execute function set_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Children: birthdate, never age, so profiles age themselves
create table children (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  name        text not null,
  birthdate   date not null,
  created_at  timestamptz not null default now()
);
create index children_profile_idx on children (profile_id);

create table favorites (
  profile_id  uuid not null references profiles(id) on delete cascade,
  venue_id    uuid not null references venues(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, venue_id)
);

-- ============================================================
-- REVIEWS: the source of real age-fit data
-- ============================================================
create table reviews (
  id                   uuid primary key default uuid_generate_v4(),
  venue_id             uuid not null references venues(id) on delete cascade,
  profile_id           uuid not null references profiles(id) on delete cascade,
  rating               smallint not null check (rating between 1 and 5),
  would_return         boolean,
  good_value           boolean,
  visited_on           date,
  child_ages_months    int[] not null default '{}',  -- ages of the kids who went, at visit time
  loved_it_ages_months int[] not null default '{}',  -- subset that actually enjoyed it
  duration_min         int,
  body                 text,
  status               moderation_status not null default 'pending',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (venue_id, profile_id)
);
create index reviews_venue_idx on reviews (venue_id, status);
create trigger reviews_updated before update on reviews for each row execute function set_updated_at();

-- ============================================================
-- REPORTS + EDIT SUGGESTIONS (the freshness engine)
-- ============================================================
create table reports (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  kind        report_kind not null,
  note        text,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid
);
create index reports_venue_idx on reports (venue_id, status);

create table edit_suggestions (
  id          uuid primary key default uuid_generate_v4(),
  venue_id    uuid not null references venues(id) on delete cascade,
  profile_id  uuid references profiles(id) on delete set null,
  changes     jsonb not null,                -- partial venue fields proposed
  note        text,
  status      moderation_status not null default 'pending',
  created_at  timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid
);
create index edit_suggestions_venue_idx on edit_suggestions (venue_id, status);

create table venue_claims (
  id             uuid primary key default uuid_generate_v4(),
  venue_id       uuid not null references venues(id) on delete cascade,
  profile_id     uuid not null references profiles(id) on delete cascade,
  business_email text,
  evidence       text,
  status         moderation_status not null default 'pending',
  created_at     timestamptz not null default now()
);

-- ============================================================
-- AGGREGATES: computed from approved reviews
-- ============================================================
create or replace view venue_stats as
select
  v.id as venue_id,
  count(r.id)::int                                   as review_count,
  round(avg(r.rating)::numeric, 1)                   as rating_avg,
  round(100.0 * avg(case when r.would_return then 1 else 0 end))::int as would_return_pct,
  round(100.0 * avg(case when r.good_value then 1 else 0 end))::int   as good_value_pct,
  percentile_cont(0.5) within group (order by r.duration_min)        as typical_duration_min,
  -- community best-age band: 20th to 80th percentile of ages that loved it
  percentile_cont(0.2) within group (order by a.age)                 as community_age_min_months,
  percentile_cont(0.8) within group (order by a.age)                 as community_age_max_months
from venues v
left join reviews r on r.venue_id = v.id and r.status = 'approved'
left join lateral unnest(r.loved_it_ages_months) as a(age) on true
group by v.id;

-- ============================================================
-- SEARCH RPC: the "What shall we do today?" query
-- ============================================================
create or replace function search_venues(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_km      double precision default 15,
  p_child_ages     int[] default '{}',       -- months
  p_indoor         indoor_outdoor default null,
  p_categories     text[] default null,
  p_limit          int default 40
)
returns table (
  id uuid, slug text, name text, area text, indoor_outdoor indoor_outdoor,
  distance_km numeric, hero_image_url text,
  price_model price_model, price_child_aed numeric, price_adult_aed numeric, adult_entry_free boolean, free_under_months int,
  best_age_min_months int, best_age_max_months int,
  rating_avg numeric, review_count int,
  fits_all boolean, fits_count int,
  last_verified_at timestamptz, published_at timestamptz, is_sponsored boolean,
  rank numeric
)
language sql stable as $$
  with base as (
    select v.*,
           s.rating_avg, s.review_count,
           coalesce(s.community_age_min_months, v.best_age_min_months, v.age_min_months, 0)::int   as fit_min,
           coalesce(s.community_age_max_months, v.best_age_max_months, v.age_max_months, 216)::int as fit_max,
           st_distance(v.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) / 1000.0    as dist_km
    from venues v
    left join venue_stats s on s.venue_id = v.id
    where v.status = 'verified'
      and st_dwithin(v.geom, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, p_radius_km * 1000)
      and (p_indoor is null or v.indoor_outdoor = p_indoor or v.indoor_outdoor = 'mixed')
      and (p_categories is null or v.categories && p_categories)
  ),
  fit as (
    select b.*,
           (select count(*) from unnest(p_child_ages) a where a between b.fit_min and b.fit_max)::int as fits_count
    from base b
  )
  select
    f.id, f.slug, f.name, f.area, f.indoor_outdoor,
    round(f.dist_km::numeric, 1) as distance_km, f.hero_image_url,
    f.price_model, f.price_child_aed, f.price_adult_aed, f.adult_entry_free, f.free_under_months,
    f.fit_min, f.fit_max,
    f.rating_avg, coalesce(f.review_count, 0),
    (cardinality(p_child_ages) > 0 and f.fits_count = cardinality(p_child_ages)) as fits_all,
    f.fits_count,
    f.last_verified_at, f.published_at, f.is_sponsored,
    -- Ranking: family fit first, then freshness, rating, proximity
    (
      case when cardinality(p_child_ages) = 0 then 1.0
           else f.fits_count::numeric / cardinality(p_child_ages) end * 3.0
      + coalesce(f.rating_avg, 3.5) / 5.0 * 1.5
      + case when f.last_verified_at > now() - interval '30 days' then 1.0
             when f.last_verified_at > now() - interval '90 days' then 0.5 else 0 end
      + greatest(0, 1.0 - f.dist_km / nullif(p_radius_km, 0))
      + case when f.is_sponsored then 0.5 else 0 end
    )::numeric as rank
  from fit f
  order by rank desc, f.dist_km asc
  limit p_limit;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table locations enable row level security;
alter table venues enable row level security;
alter table events enable row level security;
alter table venue_photos enable row level security;
alter table profiles enable row level security;
alter table children enable row level security;
alter table favorites enable row level security;
alter table reviews enable row level security;
alter table reports enable row level security;
alter table edit_suggestions enable row level security;
alter table venue_claims enable row level security;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function current_role_of(uid uuid) returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = uid;
$$;

-- Public read of verified content, anonymous included
create policy "locations public read" on locations for select using (true);
create policy "venues public read" on venues for select using (status = 'verified' or is_admin());
create policy "events public read" on events for select using (status = 'verified' or is_admin());
create policy "photos public read" on venue_photos for select using (status = 'approved' or is_admin());
create policy "reviews public read" on reviews for select using (status = 'approved' or profile_id = auth.uid() or is_admin());

-- Admin full control
create policy "locations admin" on locations for all using (is_admin()) with check (is_admin());
create policy "venues admin" on venues for all using (is_admin()) with check (is_admin());
create policy "events admin" on events for all using (is_admin()) with check (is_admin());
create policy "photos admin" on venue_photos for all using (is_admin()) with check (is_admin());
create policy "reviews admin" on reviews for all using (is_admin()) with check (is_admin());
create policy "reports admin" on reports for all using (is_admin()) with check (is_admin());
create policy "edits admin" on edit_suggestions for all using (is_admin()) with check (is_admin());
create policy "claims admin" on venue_claims for all using (is_admin()) with check (is_admin());

-- Own data
create policy "profiles self read" on profiles for select using (id = auth.uid() or is_admin());
create policy "profiles self update" on profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = current_role_of(auth.uid()));
create policy "children own" on children for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy "favorites own" on favorites for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Contributions: signed-in parents can create, edit their own pending items
create policy "reviews insert own" on reviews for insert with check (profile_id = auth.uid());
create policy "reviews update own pending" on reviews for update using (profile_id = auth.uid() and status = 'pending') with check (profile_id = auth.uid());
create policy "photos insert own" on venue_photos for insert with check (submitted_by = auth.uid());
create policy "reports insert" on reports for insert with check (profile_id = auth.uid() or profile_id is null);
create policy "reports read own" on reports for select using (profile_id = auth.uid());
create policy "edits insert" on edit_suggestions for insert with check (profile_id = auth.uid());
create policy "edits read own" on edit_suggestions for select using (profile_id = auth.uid());
create policy "claims insert own" on venue_claims for insert with check (profile_id = auth.uid());
create policy "claims read own" on venue_claims for select using (profile_id = auth.uid());

-- ============================================================
-- STORAGE bucket for photos (public read, authenticated write)
-- ============================================================
insert into storage.buckets (id, name, public) values ('venue-photos', 'venue-photos', true)
on conflict (id) do nothing;
create policy "venue photos public read" on storage.objects for select using (bucket_id = 'venue-photos');
create policy "venue photos auth upload" on storage.objects for insert with check (bucket_id = 'venue-photos' and auth.role() = 'authenticated');
