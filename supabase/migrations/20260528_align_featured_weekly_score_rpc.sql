-- Align Home + Search on a single featured analytics source of truth.
-- Weekly window is Monday 00:00 UTC -> Sunday 23:59:59.999 UTC.
-- Champion of week score: weekly_views + (weekly_bravos * 20).

drop function if exists public.get_featured_companies_analytics();

create or replace function public.get_featured_companies_analytics()
returns table (
  slot text,
  company_id uuid,
  company_name text,
  city text,
  sector text,
  slug text,
  views_24h bigint,
  bravos_7d bigint,
  views_30d bigint,
  bravos_30d bigint
)
language sql
security definer
set search_path = public
as $$
with weekly_bounds as (
  select
    (date_trunc('week', timezone('utc', now())) at time zone 'utc') as week_start,
    ((date_trunc('week', timezone('utc', now())) + interval '7 days') at time zone 'utc') as next_week_start
),
views_24 as (
  select
    cve.company_id,
    count(*)::bigint as views_24h
  from public.company_view_events cve
  where cve.viewed_at >= timezone('utc', now()) - interval '24 hours'
  group by cve.company_id
),
views_week as (
  select
    cve.company_id,
    count(*)::bigint as views_week
  from public.company_view_events cve
  cross join weekly_bounds wb
  where cve.viewed_at >= wb.week_start
    and cve.viewed_at < wb.next_week_start
  group by cve.company_id
),
bravos_week as (
  select
    cv.company_id,
    count(*)::bigint as bravos_week
  from public.company_votes cv
  cross join weekly_bounds wb
  where cv.created_at >= wb.week_start
    and cv.created_at < wb.next_week_start
  group by cv.company_id
),
views_30 as (
  select
    cve.company_id,
    count(*)::bigint as views_30d
  from public.company_view_events cve
  where cve.viewed_at >= timezone('utc', now()) - interval '30 days'
  group by cve.company_id
),
bravos_30 as (
  select
    cv.company_id,
    count(*)::bigint as bravos_30d
  from public.company_votes cv
  where cv.created_at >= timezone('utc', now()) - interval '30 days'
  group by cv.company_id
),
company_stats as (
  select
    c.id as company_id,
    c.name as company_name,
    c.city,
    c.sector,
    c.slug,
    coalesce(v24.views_24h, 0) as views_24h,
    coalesce(vw.views_week, 0) as views_week,
    coalesce(bw.bravos_week, 0) as bravos_week,
    coalesce(v30.views_30d, 0) as views_30d,
    coalesce(b30.bravos_30d, 0) as bravos_30d,
    coalesce(c.views_count, 0) as total_views,
    coalesce(c.bigup, 0) as total_bravos,
    (coalesce(v30.views_30d, 0) + (coalesce(b30.bravos_30d, 0) * 20))::numeric as combo_score_30d,
    (coalesce(vw.views_week, 0) + (coalesce(bw.bravos_week, 0) * 20))::numeric as champion_week_score
  from public.companies c
  left join views_24 v24 on v24.company_id = c.id
  left join views_week vw on vw.company_id = c.id
  left join bravos_week bw on bw.company_id = c.id
  left join views_30 v30 on v30.company_id = c.id
  left join bravos_30 b30 on b30.company_id = c.id
  where nullif(trim(c.slug), '') is not null
),
company_of_day as (
  select *
  from company_stats
  order by views_24h desc, total_views desc
  limit 1
),
champion_of_week as (
  select *
  from company_stats
  order by champion_week_score desc, bravos_week desc, views_week desc, total_bravos desc, total_views desc
  limit 1
),
pme_of_month as (
  select *
  from company_stats
  order by combo_score_30d desc, total_views desc
  limit 1
)
select
  'company_of_day'::text as slot,
  cod.company_id,
  cod.company_name,
  cod.city,
  cod.sector,
  cod.slug,
  cod.views_24h,
  cod.bravos_week as bravos_7d,
  cod.views_30d,
  cod.bravos_30d
from company_of_day cod

union all

select
  'champion_of_week'::text as slot,
  cow.company_id,
  cow.company_name,
  cow.city,
  cow.sector,
  cow.slug,
  cow.views_24h,
  cow.bravos_week as bravos_7d,
  cow.views_30d,
  cow.bravos_30d
from champion_of_week cow

union all

select
  'pme_of_month'::text as slot,
  pom.company_id,
  pom.company_name,
  pom.city,
  pom.sector,
  pom.slug,
  pom.views_24h,
  pom.bravos_week as bravos_7d,
  pom.views_30d,
  pom.bravos_30d
from pme_of_month pom;
$$;

grant execute on function public.get_featured_companies_analytics() to anon;
grant execute on function public.get_featured_companies_analytics() to authenticated;
