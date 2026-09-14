-- v16.3: when an admin last edited a venue (green dot in the admin venue list). Backfilled from venue_history.
alter table venues add column if not exists admin_edited_at timestamptz;
update venues v set admin_edited_at = h.last
from (select venue_id, max(changed_at) as last from venue_history where changed_by in (select id from profiles where role = 'admin') group by venue_id) h
where h.venue_id = v.id and v.admin_edited_at is null;
