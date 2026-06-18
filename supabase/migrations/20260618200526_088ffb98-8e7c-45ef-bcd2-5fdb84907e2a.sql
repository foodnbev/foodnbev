
-- =========== ENUMS ===========
create type public.app_role as enum ('admin','user');
create type public.project_status as enum ('planning','underway','completed','unknown');
create type public.facility_type as enum ('brewery','distillery','food_processing');
create type public.food_subtype as enum ('meat','fish','snacks','coldroom','other');
create type public.work_type as enum ('newbuild','extension','refurbishment','modification');
create type public.party_category as enum (
  'end_user','architect','general_contractor','me','real_estate_planner',
  'consultant','flooring','groundworks','drainage','other'
);

-- =========== PROFILES ===========
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  alias text not null unique,
  full_name text,
  email text not null,
  mobile text,
  involved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.profiles to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles readable by all" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
create policy "users insert own profile" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- =========== USER ROLES ===========
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users see own roles" on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

-- admins can read all roles
create policy "admins read all roles" on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- =========== PROJECTS ===========
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  description text not null,
  status public.project_status not null default 'unknown',
  facility_type public.facility_type not null,
  food_subtype public.food_subtype,
  work_type public.work_type,
  cover_image_url text,
  created_at timestamptz not null default now()
);
create index on public.projects (facility_type);
create index on public.projects (status);
create index on public.projects (created_at desc);
grant select on public.projects to anon, authenticated;
grant insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
alter table public.projects enable row level security;
create policy "projects readable by all" on public.projects for select using (true);
create policy "auth users create projects" on public.projects for insert to authenticated
  with check (auth.uid() = created_by);
create policy "owners delete own projects" on public.projects for delete to authenticated
  using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));
create policy "owners update own projects" on public.projects for update to authenticated
  using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'))
  with check (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));

-- =========== PROJECT PARTIES ===========
create table public.project_parties (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  category public.party_category not null,
  other_label text,
  company text,
  contact_name text,
  email text,
  phone text,
  spec_description text,
  created_at timestamptz not null default now()
);
-- Only one row per (project, category) for non-"other" categories
create unique index project_parties_unique_category
  on public.project_parties (project_id, category)
  where category <> 'other';
create index on public.project_parties (project_id);
grant select, insert, delete on public.project_parties to authenticated;
grant all on public.project_parties to service_role;
alter table public.project_parties enable row level security;
create policy "parties readable by authenticated" on public.project_parties for select to authenticated using (true);
create policy "auth users add parties" on public.project_parties for insert to authenticated
  with check (auth.uid() = created_by);
create policy "creators delete own parties" on public.project_parties for delete to authenticated
  using (auth.uid() = created_by or public.has_role(auth.uid(),'admin'));

-- Public-visible presence-of-categories view (no details leaked)
create or replace view public.project_party_presence
with (security_invoker = false) as
select project_id, array_agg(distinct category::text order by category::text) as categories
from public.project_parties
group by project_id;
grant select on public.project_party_presence to anon, authenticated;

-- =========== RATINGS ===========
create table public.project_ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hotness integer not null check (hotness between 0 and 100),
  accuracy integer not null check (accuracy between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);
grant select, insert, update, delete on public.project_ratings to authenticated;
grant all on public.project_ratings to service_role;
alter table public.project_ratings enable row level security;
create policy "ratings readable by authenticated" on public.project_ratings for select to authenticated using (true);
create policy "users insert own rating" on public.project_ratings for insert to authenticated
  with check (auth.uid() = user_id);
create policy "users update own rating" on public.project_ratings for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own rating" on public.project_ratings for delete to authenticated
  using (auth.uid() = user_id);

-- Aggregated rating summary view (public-safe averages)
create or replace view public.project_rating_summary
with (security_invoker = false) as
select project_id,
       coalesce(round(avg(hotness))::int, 0) as avg_hotness,
       coalesce(round(avg(accuracy))::int, 0) as avg_accuracy,
       count(*)::int as rating_count
from public.project_ratings
group by project_id;
grant select on public.project_rating_summary to anon, authenticated;

-- =========== COMPLETENESS ===========
-- 10 party categories + 4 project optional fields = 14 signals
create or replace function public.project_completeness(p_id uuid)
returns integer language sql stable security definer set search_path = public as $$
  with p as (select * from public.projects where id = p_id),
  parts as (
    select count(distinct category) filter (where category <> 'other') as cat_count,
           count(*) filter (where category = 'other') as other_count,
           count(*) filter (where spec_description is not null and length(trim(spec_description))>0) as specs
    from public.project_parties where project_id = p_id
  )
  select least(100, (
    (select cat_count from parts) * 8 +                       -- up to 72 for 9 non-other categories
    least((select other_count from parts), 2) * 4 +           -- up to 8
    least((select specs from parts), 5) * 2 +                 -- up to 10
    (case when (select cover_image_url from p) is not null then 5 else 0 end) +
    (case when (select food_subtype from p) is not null then 3 else 0 end) +
    (case when (select work_type from p) is not null then 2 else 0 end)
  ))::int;
$$;
grant execute on function public.project_completeness(uuid) to anon, authenticated;

-- =========== SIGNUP TRIGGER ===========
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, alias, full_name, email, mobile, involved)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'alias', split_part(new.email,'@',1) || '-' || substr(new.id::text,1,4)),
    nullif(new.raw_user_meta_data->>'full_name',''),
    new.email,
    nullif(new.raw_user_meta_data->>'mobile',''),
    coalesce((new.raw_user_meta_data->>'involved')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger for ratings
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger ratings_touch before update on public.project_ratings
  for each row execute function public.touch_updated_at();
