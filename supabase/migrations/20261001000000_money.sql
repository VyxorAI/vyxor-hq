-- Vyxor HQ: invoices and expenses (Phase 2)
-- Run once in the Supabase SQL editor (new query), after 20260930000000_projects_and_tasks.sql.

-- ---------------------------------------------------------------------------
-- updated_at: reordering cards (position-only changes) doesn't count as an edit,
-- so "Recent activity" on the home screen isn't flooded by drags.
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - 'position' - 'updated_at') = (to_jsonb(old) - 'position' - 'updated_at') then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

create type public.invoice_type as enum ('setup', 'retainer', 'other');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');
create type public.expense_category as enum ('hosting', 'api', 'software', 'marketing', 'other');

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------

create table public.invoices (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  -- Financial history stays: a client with invoices can't be deleted (mark it churned instead)
  client_id   uuid not null references public.clients (id) on delete restrict,
  -- Filled in by trigger as VX-<year>-001 when left empty
  number      text not null unique check (length(trim(number)) > 0),
  type        public.invoice_type not null default 'retainer',
  amount      numeric(12, 2) not null check (amount > 0),
  issued_on   date not null default current_date,
  due_on      date,
  paid_on     date,
  -- "overdue" is also derived in the app: a sent invoice past its due date shows as overdue
  status      public.invoice_status not null default 'draft',
  constraint invoices_dates_check check (due_on is null or due_on >= issued_on)
);

create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_paid_on_idx on public.invoices (paid_on) where paid_on is not null;

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- Number new invoices and keep status and paid_on in step
create or replace function public.invoices_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_prefix text;
  v_next   integer;
begin
  if new.number is null or trim(new.number) = '' then
    -- Serialise numbering so two inserts can't take the same number
    perform pg_advisory_xact_lock(hashtext('vyxor.invoice_number'));
    v_prefix := 'VX-' || extract(year from new.issued_on)::integer || '-';
    select coalesce(max(substring(i.number from length(v_prefix) + 1)::integer), 0) + 1
      into v_next
      from public.invoices i
     where i.number ~ ('^' || v_prefix || '[0-9]+$');
    new.number := v_prefix || lpad(v_next::text, 3, '0');
  end if;

  -- A newly entered paid date means it's paid
  if new.paid_on is not null and new.status is distinct from 'paid'
     and (tg_op = 'INSERT' or new.paid_on is distinct from old.paid_on) then
    new.status := 'paid';
  end if;
  -- Marked paid without a date: paid today
  if new.status = 'paid' and new.paid_on is null then
    new.paid_on := current_date;
  end if;
  -- No longer paid: clear the date
  if new.status is distinct from 'paid' then
    new.paid_on := null;
  end if;
  return new;
end;
$$;

create trigger invoices_before_write
  before insert or update on public.invoices
  for each row execute function public.invoices_before_write();

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  description  text not null check (length(trim(description)) > 0),
  category     public.expense_category not null default 'other',
  amount       numeric(12, 2) not null check (amount > 0),
  -- Recurring = monthly, counted every month from `date` until `ends_on` (if set)
  recurring    boolean not null default false,
  date         date not null default current_date,
  ends_on      date,
  -- Per-client cost; kept (unlinked) if the client is deleted
  client_id    uuid references public.clients (id) on delete set null,
  constraint expenses_ends_on_check check (ends_on is null or (recurring and ends_on >= date))
);

create index expenses_date_idx on public.expenses (date);
create index expenses_client_id_idx on public.expenses (client_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.invoices enable row level security;
alter table public.expenses enable row level security;

create policy "Authenticated users have full access to invoices"
  on public.invoices for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users have full access to expenses"
  on public.expenses for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.invoices, public.expenses from anon;
grant select, insert, update, delete on public.invoices, public.expenses to authenticated;
