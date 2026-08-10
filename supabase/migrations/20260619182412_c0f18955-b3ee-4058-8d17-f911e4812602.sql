
-- 1. Allow any authenticated user to update a project, but restrict
--    non-owners to only changing `status` and `work_type` via a trigger.

drop policy if exists "owners update own projects" on public.projects;

create policy "auth users update projects"
on public.projects for update to authenticated
using (true) with check (true);

create or replace function public.projects_restrict_non_owner_updates()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() = old.created_by or public.has_role(auth.uid(),'admin') then
    return new;
  end if;
  -- Non-owners: only status and work_type may change
  if new.name is distinct from old.name
     or new.address is distinct from old.address
     or new.description is distinct from old.description
     or new.facility_type is distinct from old.facility_type
     or new.food_subtype is distinct from old.food_subtype
     or new.cover_image_url is distinct from old.cover_image_url
     or new.created_by is distinct from old.created_by then
    raise exception 'Only the project creator can edit these fields';
  end if;
  return new;
end;
$$;

drop trigger if exists projects_restrict_updates on public.projects;
create trigger projects_restrict_updates
  before update on public.projects
  for each row execute function public.projects_restrict_non_owner_updates();

-- 2. Project info entries (unlimited per project; text and/or attachment)

create table public.project_info_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  body text,
  attachment_path text,
  attachment_name text,
  attachment_mime text,
  attachment_size integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (body is not null and length(trim(body)) > 0)
    or attachment_path is not null
  )
);
create index on public.project_info_entries (project_id, created_at desc);

grant select, insert, update, delete on public.project_info_entries to authenticated;
grant all on public.project_info_entries to service_role;

alter table public.project_info_entries enable row level security;

create policy "info readable by authenticated"
on public.project_info_entries for select to authenticated using (true);

create policy "auth users add info"
on public.project_info_entries for insert to authenticated
with check (auth.uid() = created_by);

create policy "authors update own info"
on public.project_info_entries for update to authenticated
using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'))
with check (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));

create policy "authors delete own info"
on public.project_info_entries for delete to authenticated
using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));

create trigger info_touch before update on public.project_info_entries
  for each row execute function public.touch_updated_at();
