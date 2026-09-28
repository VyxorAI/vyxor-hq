-- Vyxor HQ: clients (Phase 1, step 4)
-- Run once in the Supabase SQL editor (new query), after 20260928000000_profiles_and_leads.sql.

create type public.client_status as enum ('onboarding', 'active', 'paused', 'churned');

create table public.clients (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  -- The lead this client came from. One client per lead.
  lead_id           uuid unique references public.leads (id) on delete set null,
  business_name     text not null check (length(trim(business_name)) > 0),
  contact_name      text,
  phone             text,
  email             text,
  website           text,
  industry          public.lead_industry not null default 'other',
  package           text,
  setup_fee         numeric(12, 2) check (setup_fee >= 0),
  monthly_retainer  numeric(12, 2) check (monthly_retainer >= 0),
  status            public.client_status not null default 'onboarding',
  start_date        date default current_date,
  owner_id          uuid references public.profiles (id) on delete set null,
  notes             text,
  -- Link to the client's entry in the password manager. Never store passwords here.
  vault_link        text check (vault_link is null or vault_link ~* '^https?://')
);

create index clients_status_idx on public.clients (status);
create index clients_owner_id_idx on public.clients (owner_id);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- Create a client from a lead and mark the lead as won, in one transaction.
-- p_client holds the client fields (as edited in the app).
-- p_index is where the lead lands in the Won column; null puts it at the bottom.
create or replace function public.convert_lead_to_client(p_lead_id uuid, p_client jsonb, p_index integer default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_stage     public.lead_stage;
  v_client_id uuid;
begin
  select stage into v_stage from public.leads where id = p_lead_id for update;
  if not found then
    raise exception 'Lead % not found', p_lead_id;
  end if;

  if exists (select 1 from public.clients where lead_id = p_lead_id) then
    raise exception 'This lead is already a client.' using errcode = '23505';
  end if;

  insert into public.clients (
    lead_id, business_name, contact_name, phone, email, website, industry, package,
    setup_fee, monthly_retainer, status, start_date, owner_id, notes, vault_link
  )
  select
    p_lead_id, r.business_name, r.contact_name, r.phone, r.email, r.website,
    coalesce(r.industry, 'other'), r.package, r.setup_fee, r.monthly_retainer,
    coalesce(r.status, 'onboarding'), coalesce(r.start_date, current_date),
    r.owner_id, r.notes, r.vault_link
  from jsonb_populate_record(null::public.clients, p_client) as r
  returning id into v_client_id;

  if p_index is not null then
    perform public.move_lead(p_lead_id, 'won', p_index);
  elsif v_stage is distinct from 'won' then
    update public.leads set stage = 'won' where id = p_lead_id;
  end if;

  return v_client_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;

create policy "Authenticated users have full access to clients"
  on public.clients for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.clients from anon;
grant select, insert, update, delete on public.clients to authenticated;

revoke execute on function public.convert_lead_to_client(uuid, jsonb, integer) from public, anon;
grant execute on function public.convert_lead_to_client(uuid, jsonb, integer) to authenticated;
