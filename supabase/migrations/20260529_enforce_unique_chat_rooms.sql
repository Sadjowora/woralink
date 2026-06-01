begin;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'chat_rooms'
  ) then
    with duplicates as (
      select
        id,
        row_number() over (
          partition by company_id, client_id
          order by created_at asc, id asc
        ) as rn
      from public.chat_rooms
    )
    delete from public.chat_rooms
    where id in (
      select id
      from duplicates
      where rn > 1
    );

    create unique index if not exists chat_rooms_company_id_client_id_key
      on public.chat_rooms (company_id, client_id);
  end if;
end $$;

commit;