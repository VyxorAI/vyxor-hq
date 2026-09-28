-- Vyxor HQ: assets library and activity log (Phase 3)
-- Run once in the Supabase SQL editor (new query), after 20261001000000_money.sql.

-- ---------------------------------------------------------------------------
-- Library: files (in Supabase Storage) and markdown documents
-- ---------------------------------------------------------------------------

create type public.asset_type as enum ('proposal', 'questionnaire', 'guide', 'prompt', 'sop', 'template', 'other');

create table public.assets (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz,
  title       text not null check (length(trim(title)) > 0),
  type        public.asset_type not null default 'other',
  -- Uploaded file: path inside the private "assets" bucket, plus display details
  file_path   text unique,
  file_name   text,
  file_size   bigint,
  mime_type   text,
  -- Written document (markdown), for SOPs and prompts
  content     text,
  tags        text[] not null default '{}',
  constraint assets_has_body check (file_path is not null or content is not null)
);

create index assets_type_idx on public.assets (type);
create index assets_tags_idx on public.assets using gin (tags);

create trigger assets_set_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();

-- Private bucket; files are downloaded through short-lived signed links
insert into storage.buckets (id, name, public, file_size_limit)
values ('assets', 'assets', false, 26214400) -- 25 MB
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "Authenticated users can read library files"
  on storage.objects for select to authenticated
  using (bucket_id = 'assets');

create policy "Authenticated users can upload library files"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'assets');

create policy "Authenticated users can update library files"
  on storage.objects for update to authenticated
  using (bucket_id = 'assets')
  with check (bucket_id = 'assets');

create policy "Authenticated users can delete library files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'assets');

-- ---------------------------------------------------------------------------
-- Activity log: notes, calls, emails, plus automatic stage/status changes
-- ---------------------------------------------------------------------------

create type public.activity_entity as enum ('lead', 'client', 'project');
create type public.activity_kind as enum ('note', 'call', 'email', 'stage_change', 'status_change');

-- The signed-in founder's profile id (null for automations using the service role)
create or replace function public.current_profile_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.profiles where user_id = auth.uid()
$$;

create table public.activities (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  entity_type  public.activity_entity not null,
  -- No foreign key (it points at a lead, client or project); cleaned up by triggers below
  entity_id    uuid not null,
  user_id      uuid references public.profiles (id) on delete set null default public.current_profile_id(),
  kind         public.activity_kind not null default 'note',
  body         text,
  -- For stage/status changes: {"field": "stage", "from": "contacted", "to": "call_booked"}
  meta         jsonb,
  constraint activities_body_check
    check (kind in ('stage_change', 'status_change') or length(trim(coalesce(body, ''))) > 0)
);

create index activities_entity_idx on public.activities (entity_type, entity_id, created_at desc);
create index activities_created_at_idx on public.activities (created_at desc);

create trigger activities_set_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- Log a change of one column. Arguments: entity type, column name.
create or replace function public.log_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_column text := tg_argv[1];
  v_from   text := to_jsonb(old) ->> v_column;
  v_to     text := to_jsonb(new) ->> v_column;
begin
  if v_from is distinct from v_to then
    insert into public.activities (entity_type, entity_id, kind, meta)
    values (
      tg_argv[0]::public.activity_entity,
      new.id,
      (case when v_column = 'stage' then 'stage_change' else 'status_change' end)::public.activity_kind,
      jsonb_build_object('field', v_column, 'from', v_from, 'to', v_to)
    );
  end if;
  return new;
end;
$$;

create trigger leads_log_stage_change
  after update of stage on public.leads
  for each row execute function public.log_status_change('lead', 'stage');

create trigger clients_log_status_change
  after update of status on public.clients
  for each row execute function public.log_status_change('client', 'status');

create trigger projects_log_status_change
  after update of status on public.projects
  for each row execute function public.log_status_change('project', 'status');

-- Remove a record's activity when the record is deleted. Argument: entity type.
create or replace function public.delete_entity_activities()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  delete from public.activities
   where entity_type = tg_argv[0]::public.activity_entity
     and entity_id = old.id;
  return old;
end;
$$;

create trigger leads_delete_activities
  after delete on public.leads
  for each row execute function public.delete_entity_activities('lead');

create trigger clients_delete_activities
  after delete on public.clients
  for each row execute function public.delete_entity_activities('client');

create trigger projects_delete_activities
  after delete on public.projects
  for each row execute function public.delete_entity_activities('project');

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.assets enable row level security;
alter table public.activities enable row level security;

create policy "Authenticated users have full access to assets"
  on public.assets for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users have full access to activities"
  on public.activities for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.assets, public.activities from anon;
grant select, insert, update, delete on public.assets, public.activities to authenticated;

revoke execute on function public.current_profile_id() from public, anon;
grant execute on function public.current_profile_id() to authenticated;
