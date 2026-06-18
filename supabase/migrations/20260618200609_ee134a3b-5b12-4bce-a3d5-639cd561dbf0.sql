
-- Views: use invoker permissions (so RLS of base tables applies)
alter view public.project_party_presence set (security_invoker = true);
alter view public.project_rating_summary set (security_invoker = true);
-- presence/summary still readable by anon because base tables grant anon SELECT on projects only;
-- presence aggregates rows from project_parties which only authenticated can select, so anon
-- only sees rows where they can read base data. We want anon to see presence too — recreate
-- the view as security definer function instead.

drop view if exists public.project_party_presence;
create or replace function public.get_party_presence(p_id uuid)
returns text[] language sql stable security definer set search_path = public as $$
  select coalesce(array_agg(distinct category::text order by category::text), array[]::text[])
  from public.project_parties where project_id = p_id;
$$;
revoke all on function public.get_party_presence(uuid) from public;
grant execute on function public.get_party_presence(uuid) to anon, authenticated;

-- Rating summary stays as a view but presence of ratings is fine to be authenticated-only.
-- Recreate as invoker view (already done). For anon to see avg ratings, expose via a function:
drop view if exists public.project_rating_summary;
create or replace function public.get_rating_summary(p_id uuid)
returns table(avg_hotness int, avg_accuracy int, rating_count int)
language sql stable security definer set search_path = public as $$
  select coalesce(round(avg(hotness))::int,0),
         coalesce(round(avg(accuracy))::int,0),
         count(*)::int
  from public.project_ratings where project_id = p_id;
$$;
revoke all on function public.get_rating_summary(uuid) from public;
grant execute on function public.get_rating_summary(uuid) to anon, authenticated;

-- Pin search_path on touch_updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
