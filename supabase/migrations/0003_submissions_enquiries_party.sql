-- v8: venue self-service submissions, venue enquiries, party package + facilities on venues,
-- and search_venues returning tagline/categories so the home page needs one query.

alter table venues add column if not exists party jsonb not null default '{}';
alter table venues add column if not exists prices_ok boolean not null default false;

create table if not exists venue_submissions (
  id uuid primary key default uuid_generate_v4(),
  venue_name text not null,
  contact_name text,
  contact_whatsapp text,
  contact_email text,
  data jsonb not null default '{}',
  photos jsonb not null default '[]',
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  venue_id uuid references venues(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table venue_submissions enable row level security;
drop policy if exists "submissions insert" on venue_submissions;
create policy "submissions insert" on venue_submissions for insert with check (true);
drop policy if exists "submissions admin" on venue_submissions;
create policy "submissions admin" on venue_submissions for all using (is_admin()) with check (is_admin());

create table if not exists venue_enquiries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  venue_name text,
  whatsapp text,
  email text,
  message text,
  status text not null default 'open' check (status in ('open','done')),
  created_at timestamptz not null default now()
);
alter table venue_enquiries enable row level security;
drop policy if exists "enquiries insert" on venue_enquiries;
create policy "enquiries insert" on venue_enquiries for insert with check (true);
drop policy if exists "enquiries admin" on venue_enquiries;
create policy "enquiries admin" on venue_enquiries for all using (is_admin()) with check (is_admin());

-- Public bucket for photos attached to venue submissions. Anyone can upload small JPEGs; nothing is shown until approved.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('venue-submissions', 'venue-submissions', true, 900000, '{image/jpeg}')
on conflict (id) do update set public = true, file_size_limit = 900000, allowed_mime_types = '{image/jpeg}';
drop policy if exists "venue submissions public read" on storage.objects;
create policy "venue submissions public read" on storage.objects for select using (bucket_id = 'venue-submissions');
drop policy if exists "venue submissions anon upload" on storage.objects;
create policy "venue submissions anon upload" on storage.objects for insert with check (bucket_id = 'venue-submissions');

-- search_venues now returns tagline and categories.
drop function if exists search_venues(double precision, double precision, double precision, int[], indoor_outdoor, text[], int);
create or replace function search_venues(
  p_lat            double precision,
  p_lng            double precision,
  p_radius_km      double precision default 15,
  p_child_ages     int[] default '{}',
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
  rank numeric,
  tagline text, categories text[]
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
    (
      case when cardinality(p_child_ages) = 0 then 1.0
           else f.fits_count::numeric / cardinality(p_child_ages) end * 3.0
      + coalesce(f.rating_avg, 3.5) / 5.0 * 1.5
      + case when f.last_verified_at > now() - interval '30 days' then 1.0
             when f.last_verified_at > now() - interval '90 days' then 0.5 else 0 end
      + greatest(0, 1.0 - f.dist_km / nullif(p_radius_km, 0))
      + case when f.is_sponsored then 0.5 else 0 end
    )::numeric as rank,
    f.tagline, f.categories
  from fit f
  order by rank desc, f.dist_km asc
  limit p_limit;
$$;

-- Lat/lng for the admin edit page.
create or replace function venue_latlng(vid uuid)
returns table (lat double precision, lng double precision)
language sql stable as $$
  select st_y(geom::geometry), st_x(geom::geometry) from venues where id = vid;
$$;
