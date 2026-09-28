-- Vyxor HQ: profiles and leads (Phase 1)
-- Run once in the Supabase SQL editor, or with `supabase db push`.

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create type public.profile_role as enum ('founder');

create table public.profiles (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  user_id     uuid not null unique references auth.users (id) on delete cascade,
  full_name   text not null,
  avatar_url  text,
  role        public.profile_role not null default 'founder'
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when a user is added in Supabase Auth.
-- full_name comes from user metadata if set, otherwise the part of the email before the @.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist
insert into public.profiles (user_id, full_name)
select
  u.id,
  coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1))
from auth.users u
on conflict (user_id) do nothing;

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------

create type public.lead_industry as enum (
  'salon', 'dental', 'medical', 'guest_house', 'construction', 'bookkeeping',
  'real_estate', 'cleaning', 'driving_school', 'gym', 'legal', 'other'
);

create type public.lead_offer as enum ('whatsapp_automation', 'website', 'voice_agent', 'other');

create type public.lead_stage as enum ('new', 'contacted', 'call_booked', 'proposal_sent', 'won', 'lost');

create type public.lead_source as enum ('outreach', 'referral', 'website_form', 'social', 'other');

create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz,
  business_name        text not null check (length(trim(business_name)) > 0),
  contact_name         text,
  phone                text,
  email                text,
  website              text,
  industry             public.lead_industry not null default 'other',
  offer                public.lead_offer not null default 'other',
  stage                public.lead_stage not null default 'new',
  estimated_setup_fee  numeric(12, 2) check (estimated_setup_fee >= 0),
  estimated_monthly    numeric(12, 2) check (estimated_monthly >= 0),
  source               public.lead_source not null default 'other',
  owner_id             uuid references public.profiles (id) on delete set null,
  next_follow_up       date,
  notes                text,
  lost_reason          text,
  -- Ordering within a stage (0 = top). Filled in by trigger when left empty.
  position             integer not null
);

create index leads_stage_position_idx on public.leads (stage, position);
create index leads_owner_id_idx on public.leads (owner_id);
create index leads_next_follow_up_idx on public.leads (next_follow_up) where next_follow_up is not null;

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- New leads, and leads whose stage changes without an explicit position,
-- go to the bottom of their stage. move_lead() sets its own positions and
-- switches this off for its transaction.
create or replace function public.leads_default_position()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('vyxor.manual_position', true), '') = 'on' then
    return new;
  end if;

  if (tg_op = 'INSERT' and new.position is null)
     or (tg_op = 'UPDATE' and new.stage is distinct from old.stage and new.position = old.position) then
    select coalesce(max(l.position) + 1, 0)
      into new.position
      from public.leads l
     where l.stage = new.stage
       and l.id <> new.id;
  end if;
  return new;
end;
$$;

create trigger leads_default_position
  before insert or update on public.leads
  for each row execute function public.leads_default_position();

-- Move a lead to a stage at a given index (0 = top) and renumber positions
-- in the affected stages, all in one transaction. Used by the kanban board.
create or replace function public.move_lead(p_lead_id uuid, p_stage public.lead_stage, p_index integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_stage public.lead_stage;
  v_index     integer;
begin
  select stage into v_old_stage from public.leads where id = p_lead_id for update;
  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  perform set_config('vyxor.manual_position', 'on', true);

  select least(greatest(coalesce(p_index, 0), 0), count(*))::integer
    into v_index
    from public.leads
   where stage = p_stage and id <> p_lead_id;

  -- Renumber the other leads in the target stage, leaving a gap at v_index
  with ordered as (
    select id, (row_number() over (order by position, created_at) - 1)::integer as rn
      from public.leads
     where stage = p_stage and id <> p_lead_id
  )
  update public.leads l
     set position = case when o.rn >= v_index then o.rn + 1 else o.rn end
    from ordered o
   where l.id = o.id
     and l.position is distinct from (case when o.rn >= v_index then o.rn + 1 else o.rn end);

  update public.leads
     set stage = p_stage, position = v_index
   where id = p_lead_id;

  -- Close the gap left in the old stage
  if v_old_stage is distinct from p_stage then
    with ordered as (
      select id, (row_number() over (order by position, created_at) - 1)::integer as rn
        from public.leads
       where stage = v_old_stage
    )
    update public.leads l
       set position = o.rn
      from ordered o
     where l.id = o.id
       and l.position is distinct from o.rn;
  end if;

  perform set_config('vyxor.manual_position', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.leads enable row level security;

create policy "Authenticated users have full access to profiles"
  on public.profiles for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users have full access to leads"
  on public.leads for all
  to authenticated
  using (true)
  with check (true);

-- Explicit grants: nothing for anonymous visitors
revoke all on public.profiles, public.leads from anon;
grant select, insert, update, delete on public.profiles, public.leads to authenticated;

revoke execute on function public.move_lead(uuid, public.lead_stage, integer) from public, anon;
grant execute on function public.move_lead(uuid, public.lead_stage, integer) to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
