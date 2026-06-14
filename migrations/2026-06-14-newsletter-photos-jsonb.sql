-- Newsletter submissions: migrate photo storage from text[] of URLs to a jsonb
-- array of { url, focus? } objects.
--
-- `focus` is a CSS object-position keyword from a 3x3 preset grid (e.g.
-- 'center top', 'left bottom'); absent means centred. It controls how each photo
-- is cropped inside the newsletter's fixed-aspect frames. The lead photo is
-- simply index 0 of the array.
--
-- Run once in the Supabase SQL editor. Backward compatible: existing URLs are
-- wrapped as { "url": ... } with no focus, so they render exactly as before.

-- 1. Add the new jsonb column.
alter table newsletter_submissions
  add column photos jsonb not null default '[]'::jsonb;

-- 2. Backfill from the old text[] column, preserving order (so leads stay leads).
update newsletter_submissions
set photos = coalesce(
  (select jsonb_agg(jsonb_build_object('url', u)) from unnest(photo_urls) as u),
  '[]'::jsonb
);

-- 3. Drop the old column.
alter table newsletter_submissions
  drop column photo_urls;
