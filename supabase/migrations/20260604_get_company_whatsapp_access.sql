begin;

drop function if exists public.get_company_whatsapp_access(uuid);

create or replace function public.get_company_whatsapp_access(p_company_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select cs.disable_whatsapp_access
      from public.company_settings cs
      where cs.company_id = p_company_id
      limit 1
    ),
    false
  );
$$;

grant execute on function public.get_company_whatsapp_access(uuid) to anon;
grant execute on function public.get_company_whatsapp_access(uuid) to authenticated;

commit;