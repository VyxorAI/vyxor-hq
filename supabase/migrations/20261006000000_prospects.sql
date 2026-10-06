-- Vyxor HQ: Prospects (lead finder)
-- Run once in the Supabase SQL editor (new query), after 20261002000000_library_and_activity.sql.
--
-- Businesses found daily through the Google Places API by the `find-prospects`
-- Edge Function. Founders contact them personally (phone first; email/WhatsApp
-- only to ask consent, per POPIA), then move them to Leads with one click.

create type public.prospect_status as enum ('new', 'converted', 'dismissed');

-- ---------------------------------------------------------------------------
-- What to search for: one row per category + area, editable in the app
-- ---------------------------------------------------------------------------

create table public.prospect_searches (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz,
  category           text not null check (length(trim(category)) > 0), -- "Dentists"
  query              text not null check (length(trim(query)) > 0),    -- "dentist"
  area               text not null check (length(trim(area)) > 0),     -- "Durbanville"
  industry           public.lead_industry not null default 'other',    -- used when it becomes a lead
  active             boolean not null default true,
  last_run_at        timestamptz,
  last_result_count  integer,
  unique (query, area)
);

create trigger prospect_searches_set_updated_at
  before update on public.prospect_searches
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Prospects
-- ---------------------------------------------------------------------------

create table public.prospects (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz,
  place_id              text not null unique,           -- Google Places id, prevents duplicates
  search_id             uuid references public.prospect_searches (id) on delete set null,
  business_name         text not null,
  category              text,
  area                  text,
  industry              public.lead_industry not null default 'other',
  address               text,
  phone                 text,                           -- as Google shows it locally
  phone_international   text,                           -- for click-to-call
  website               text,
  email                 text,                           -- only if published on their own website
  rating                numeric(2, 1),
  review_count          integer,
  maps_url              text,
  -- Website check (null until checked)
  website_checked_at    timestamptz,
  has_whatsapp          boolean,
  has_booking           boolean,
  -- Suggested pitch
  suggested_offer       public.lead_offer not null default 'other',
  pitch_reason          text,
  score                 integer not null default 0 check (score between 0 and 100),
  -- Workflow
  status                public.prospect_status not null default 'new',
  do_not_contact        boolean not null default false,
  lead_id               uuid references public.leads (id) on delete set null,
  contacted_at          timestamptz,
  contacted_by          uuid references public.profiles (id) on delete set null,
  last_seen_at          timestamptz not null default now()
);

create index prospects_status_score_idx on public.prospects (status, score desc);
create index prospects_created_at_idx on public.prospects (created_at desc);
create index prospects_unchecked_idx on public.prospects (created_at) where website_checked_at is null and website is not null;

create trigger prospects_set_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- "Contacted → Leads": create the lead, log the first contact, mark the prospect
-- ---------------------------------------------------------------------------

create or replace function public.convert_prospect_to_lead(
  p_prospect_id uuid,
  p_channel text,               -- 'call' | 'email' | 'whatsapp'
  p_note text default null,
  p_follow_up date default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_prospect public.prospects;
  v_profile  uuid := public.current_profile_id();
  v_lead_id  uuid;
  v_note     text := nullif(trim(coalesce(p_note, '')), '');
begin
  select * into v_prospect from public.prospects where id = p_prospect_id for update;
  if not found then
    raise exception 'Prospect not found.';
  end if;
  if v_prospect.status = 'converted' then
    raise exception 'This business is already in Leads.' using errcode = '23505';
  end if;
  if v_prospect.do_not_contact then
    raise exception 'This business is marked do not contact.';
  end if;
  if p_channel not in ('call', 'email', 'whatsapp') then
    raise exception 'Unknown contact channel: %', p_channel;
  end if;

  insert into public.leads (
    business_name, phone, email, website, industry, offer, stage, source, owner_id, next_follow_up, notes
  )
  values (
    v_prospect.business_name,
    coalesce(v_prospect.phone, v_prospect.phone_international),
    v_prospect.email,
    v_prospect.website,
    v_prospect.industry,
    v_prospect.suggested_offer,
    'contacted',
    'outreach',
    v_profile,
    coalesce(p_follow_up, current_date + 3),
    concat_ws(
      E'\n',
      'Found via Prospects (' || concat_ws(', ', v_prospect.category, v_prospect.area) || ').',
      'Pitch: ' || v_prospect.pitch_reason,
      'Address: ' || v_prospect.address,
      'Google Maps: ' || v_prospect.maps_url
    )
  )
  returning id into v_lead_id;

  insert into public.activities (entity_type, entity_id, kind, body)
  values (
    'lead',
    v_lead_id,
    (case p_channel when 'call' then 'call' when 'email' then 'email' else 'note' end)::public.activity_kind,
    case p_channel
      when 'call' then coalesce(v_note, 'First call, from Prospects.')
      when 'email' then coalesce(v_note, 'Consent request sent by email, from Prospects.')
      else 'WhatsApp: ' || coalesce(v_note, 'Consent request sent, from Prospects.')
    end
  );

  update public.prospects
     set status = 'converted', lead_id = v_lead_id, contacted_at = now(), contacted_by = v_profile
   where id = p_prospect_id;

  return v_lead_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Secret for the daily schedule (readable only by the service role / database)
-- ---------------------------------------------------------------------------

create table public.app_secrets (
  key    text primary key,
  value  text not null
);
alter table public.app_secrets enable row level security; -- no policies: app users can't read it
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (key, value)
values ('prospects_cron_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.prospect_searches enable row level security;
alter table public.prospects enable row level security;

create policy "Authenticated users have full access to prospect searches"
  on public.prospect_searches for all to authenticated using (true) with check (true);

create policy "Authenticated users have full access to prospects"
  on public.prospects for all to authenticated using (true) with check (true);

revoke all on public.prospect_searches, public.prospects from anon;
grant select, insert, update, delete on public.prospect_searches, public.prospects to authenticated;

revoke execute on function public.convert_prospect_to_lead(uuid, text, text, date) from public, anon;
grant execute on function public.convert_prospect_to_lead(uuid, text, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- Starting searches: phone-driven and service businesses in the northern suburbs
-- (10 categories x 10 areas = 100 searches; the daily job runs 15, oldest first)
-- ---------------------------------------------------------------------------

insert into public.prospect_searches (category, query, area, industry)
select c.category, c.query, a.area, c.industry::public.lead_industry
from (values
  ('Dentists',              'dentist',                   'dental'),
  ('GP practices',          'general practitioner doctor', 'medical'),
  ('Physiotherapists',      'physiotherapist',           'medical'),
  ('Vets',                  'veterinarian',              'other'),
  ('Hair and beauty salons','hair and beauty salon',     'salon'),
  ('Plumbers',              'plumber',                   'construction'),
  ('Electricians',          'electrician',               'construction'),
  ('Attorneys',             'attorney',                  'legal'),
  ('Accountants',           'accountant',                'bookkeeping'),
  ('Driving schools',       'driving school',            'driving_school')
) as c (category, query, industry)
cross join (values
  ('Durbanville'), ('Bellville'), ('Parow'), ('Goodwood'), ('Brackenfell'),
  ('Kraaifontein'), ('Kuils River'), ('Plattekloof'), ('Edgemead'), ('Table View')
) as a (area)
on conflict (query, area) do nothing;

-- ---------------------------------------------------------------------------
-- Daily run at 06:00 South African time (04:00 UTC)
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'find-prospects-daily',
  '0 4 * * *',
  $$
  select net.http_post(
    url := 'https://nfvbnjdnsyrazjdaeaio.supabase.co/functions/v1/find-prospects',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value from public.app_secrets where key = 'prospects_cron_secret')
    ),
    body := '{"trigger":"schedule"}'::jsonb,
    timeout_milliseconds := 150000
  );
  $$
);
