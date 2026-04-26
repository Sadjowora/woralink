-- Increment company profile views using slug.
-- SECURITY DEFINER allows controlled updates without exposing direct table updates to anonymous users.

create or replace function public.increment_view(company_slug text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.companies
  set views_count = coalesce(views_count, 0) + 1
  where slug = company_slug
  returning views_count into updated_count;

  return coalesce(updated_count, 0);
end;
$$;

grant execute on function public.increment_view(text) to anon;
grant execute on function public.increment_view(text) to authenticated;
