-- v16: Good-for pills, photo manager.

-- "Tours and field trips" folds into Homeschoolers. Nothing is lost: every venue tagged tours gets homeschool.
update venues
set categories = array_remove(array_append(categories, 'homeschool'), 'tours')
where 'tours' = any(categories);
update venues set categories = (select array_agg(distinct c) from unnest(categories) c) where 'homeschool' = any(categories);

-- Admins can delete, replace and list files in both photo buckets (needed by the photo manager).
drop policy if exists "photo buckets admin update" on storage.objects;
create policy "photo buckets admin update" on storage.objects for update
  using (bucket_id in ('venue-photos', 'venue-submissions') and is_admin())
  with check (bucket_id in ('venue-photos', 'venue-submissions') and is_admin());
drop policy if exists "photo buckets admin delete" on storage.objects;
create policy "photo buckets admin delete" on storage.objects for delete
  using (bucket_id in ('venue-photos', 'venue-submissions') and is_admin());
drop policy if exists "photo buckets admin insert" on storage.objects;
create policy "photo buckets admin insert" on storage.objects for insert
  with check (bucket_id in ('venue-photos', 'venue-submissions') and is_admin());
