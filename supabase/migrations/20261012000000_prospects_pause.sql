-- Vyxor HQ: pause and resume the daily prospect search
-- Run once in the Supabase SQL editor (new query), after 20261006000000_prospects.sql.
-- Safe to run again.
--
-- One switch, set from the Prospects page. While it's on, the 06:00 job skips
-- its call to the `find-prospects` Edge Function, so no Google searches are used.
-- "Find more now" is not affected.

-- ---------------------------------------------------------------------------
-- Settings: a single row
-- ---------------------------------------------------------------------------

create table if not exists public.prospect_settings (
  id          boolean primary key default true check (id), -- only one row can exist
  updated_at  timestamptz,
  paused      boolean not null default false,
  paused_at   timestamptz,
  paused_by   uuid references public.profiles (id) on delete set null
);

insert into public.prospect_settings (id) values (true) on conflict (id) do nothing;

-- Record who paused it and when; clear both on resume.
create or replace function public.prospect_settings_stamp_pause()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  if new.paused is distinct from old.paused then
    if new.paused then
      new.paused_at = now();
      new.paused_by = public.current_profile_id();
    else
      new.paused_at = null;
      new.paused_by = null;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prospect_settings_stamp_pause on public.prospect_settings;
create trigger prospect_settings_stamp_pause
  before update on public.prospect_settings
  for each row execute function public.prospect_settings_stamp_pause();

-- ---------------------------------------------------------------------------
-- Row Level Security: founders can read and flip the switch, nothing else
-- ---------------------------------------------------------------------------

alter table public.prospect_settings enable row level security;

drop policy if exists "Authenticated users can read prospect settings" on public.prospect_settings;
create policy "Authenticated users can read prospect settings"
  on public.prospect_settings for select to authenticated using (true);

drop policy if exists "Authenticated users can update prospect settings" on public.prospect_settings;
create policy "Authenticated users can update prospect settings"
  on public.prospect_settings for update to authenticated using (true) with check (true);

revoke all on public.prospect_settings from anon, authenticated;
grant select, update on public.prospect_settings to authenticated;

-- ---------------------------------------------------------------------------
-- Daily run: same job and time as before, now skipped while paused
-- (scheduling under an existing name replaces that job)
-- ---------------------------------------------------------------------------

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
  )
  where not coalesce((select paused from public.prospect_settings), false);
  $$
);
