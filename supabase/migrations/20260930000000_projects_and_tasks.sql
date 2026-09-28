-- Vyxor HQ: projects and tasks (Phase 1, step 5)
-- Run once in the Supabase SQL editor (new query), after 20260929000000_clients.sql.

create type public.project_type as enum ('whatsapp_agent', 'website', 'voice_agent', 'automation', 'other');
create type public.project_status as enum ('planning', 'building', 'review', 'live', 'on_hold');
create type public.task_status as enum ('todo', 'doing', 'done');
create type public.task_priority as enum ('low', 'medium', 'high');

-- ---------------------------------------------------------------------------
-- projects: always belong to a client
-- ---------------------------------------------------------------------------

create table public.projects (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  client_id    uuid not null references public.clients (id) on delete cascade,
  name         text not null check (length(trim(name)) > 0),
  type         public.project_type not null default 'other',
  status       public.project_status not null default 'planning',
  start_date   date,
  due_date     date,
  description  text,
  constraint projects_dates_check check (start_date is null or due_date is null or due_date >= start_date)
);

create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- tasks: in a project, for a client only, or general agency work (neither)
-- ---------------------------------------------------------------------------

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,
  project_id   uuid references public.projects (id) on delete cascade,
  client_id    uuid references public.clients (id) on delete cascade,
  title        text not null check (length(trim(title)) > 0),
  description  text,
  assignee_id  uuid references public.profiles (id) on delete set null,
  due_date     date,
  status       public.task_status not null default 'todo',
  priority     public.task_priority not null default 'medium',
  -- Ordering within a status column of the same project (0 = top). Filled in by trigger when left empty.
  position     integer not null
);

create index tasks_project_status_position_idx on public.tasks (project_id, status, position);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_assignee_due_idx on public.tasks (assignee_id, due_date);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Keep tasks.client_id in line with the task's project, and put new tasks
-- (or tasks moved to another column/project without a position) at the bottom.
-- move_task() sets its own positions and switches the second part off.
create or replace function public.tasks_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.project_id is not null then
    select p.client_id into new.client_id from public.projects p where p.id = new.project_id;
  end if;

  if coalesce(current_setting('vyxor.manual_position', true), '') = 'on' then
    return new;
  end if;

  if (tg_op = 'INSERT' and new.position is null)
     or (tg_op = 'UPDATE'
         and (new.status is distinct from old.status or new.project_id is distinct from old.project_id)
         and new.position = old.position) then
    select coalesce(max(t.position) + 1, 0)
      into new.position
      from public.tasks t
     where t.status = new.status
       and t.project_id is not distinct from new.project_id
       and t.id <> new.id;
  end if;
  return new;
end;
$$;

create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- If a project moves to another client, its tasks follow
create or replace function public.projects_sync_task_client()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.tasks set client_id = new.client_id where project_id = new.id;
  return new;
end;
$$;

create trigger projects_sync_task_client
  after update of client_id on public.projects
  for each row
  when (new.client_id is distinct from old.client_id)
  execute function public.projects_sync_task_client();

-- Move a task to a status column at a given index (0 = top) within its own
-- project (or the general board) and renumber, in one transaction.
create or replace function public.move_task(p_task_id uuid, p_status public.task_status, p_index integer)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_old_status public.task_status;
  v_project_id uuid;
  v_index      integer;
begin
  select status, project_id into v_old_status, v_project_id
    from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'Task % not found', p_task_id;
  end if;

  perform set_config('vyxor.manual_position', 'on', true);

  select least(greatest(coalesce(p_index, 0), 0), count(*))::integer
    into v_index
    from public.tasks
   where status = p_status and project_id is not distinct from v_project_id and id <> p_task_id;

  -- Renumber the other tasks in the target column, leaving a gap at v_index
  with ordered as (
    select id, (row_number() over (order by position, created_at) - 1)::integer as rn
      from public.tasks
     where status = p_status and project_id is not distinct from v_project_id and id <> p_task_id
  )
  update public.tasks t
     set position = case when o.rn >= v_index then o.rn + 1 else o.rn end
    from ordered o
   where t.id = o.id
     and t.position is distinct from (case when o.rn >= v_index then o.rn + 1 else o.rn end);

  update public.tasks set status = p_status, position = v_index where id = p_task_id;

  -- Close the gap left in the old column
  if v_old_status is distinct from p_status then
    with ordered as (
      select id, (row_number() over (order by position, created_at) - 1)::integer as rn
        from public.tasks
       where status = v_old_status and project_id is not distinct from v_project_id
    )
    update public.tasks t
       set position = o.rn
      from ordered o
     where t.id = o.id
       and t.position is distinct from o.rn;
  end if;

  perform set_config('vyxor.manual_position', 'off', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security: any authenticated user has full access (two founders only)
-- ---------------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

create policy "Authenticated users have full access to projects"
  on public.projects for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users have full access to tasks"
  on public.tasks for all
  to authenticated
  using (true)
  with check (true);

revoke all on public.projects, public.tasks from anon;
grant select, insert, update, delete on public.projects, public.tasks to authenticated;

revoke execute on function public.move_task(uuid, public.task_status, integer) from public, anon;
grant execute on function public.move_task(uuid, public.task_status, integer) to authenticated;
