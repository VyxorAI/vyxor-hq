-- Vyxor HQ: business descriptions and a Realtors category for Prospects
-- Run once in the Supabase SQL editor (new query), after 20261012000000_prospects_pause.sql.
-- Safe to run again.

-- ---------------------------------------------------------------------------
-- Description: from the business's own website, or Google's summary
-- ---------------------------------------------------------------------------

alter table public.prospects
  add column if not exists description             text,
  add column if not exists description_source      text check (description_source in ('website', 'google')),
  add column if not exists description_checked_at  timestamptz; -- when their website was read for one (null = not yet)

-- ---------------------------------------------------------------------------
-- Realtors in the same ten areas (110 searches in total)
-- ---------------------------------------------------------------------------

insert into public.prospect_searches (category, query, area, industry)
select 'Realtors', 'estate agent', a.area, 'real_estate'::public.lead_industry
from (values
  ('Durbanville'), ('Bellville'), ('Parow'), ('Goodwood'), ('Brackenfell'),
  ('Kraaifontein'), ('Kuils River'), ('Plattekloof'), ('Edgemead'), ('Table View')
) as a (area)
on conflict (query, area) do nothing;

-- Shown in the SQL editor when this has run: expect 10 realtor searches.
select count(*) as realtor_searches from public.prospect_searches where category = 'Realtors';
