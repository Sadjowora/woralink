begin;

-- Final cleanup for chat_rooms:
-- 1) Normalize chat_rooms.company_id -> companies.id
-- 2) Normalize chat_rooms.client_id -> profiles.id (role=client)
-- 3) Backfill participants consistently
-- 4) Deduplicate by canonical pair (company_id, client_id)
-- 5) Enforce unique + canonical FKs

do $$
declare
  owner_col_exists boolean := false;
  role_col_exists boolean := false;
begin
  if not exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'chat_rooms'
  ) then
    return;
  end if;

  alter table public.chat_rooms
    add column if not exists participant_a uuid,
    add column if not exists participant_b uuid;

  -- Drop legacy FKs early to allow in-place normalization of ids.
  -- On some environments, chat_rooms_company_id_fkey incorrectly references profiles(id).
  if exists (
    select 1
    from pg_constraint
    where conname = 'chat_rooms_company_id_fkey'
      and conrelid = 'public.chat_rooms'::regclass
  ) then
    alter table public.chat_rooms
      drop constraint chat_rooms_company_id_fkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'chat_rooms_client_id_fkey'
      and conrelid = 'public.chat_rooms'::regclass
  ) then
    alter table public.chat_rooms
      drop constraint chat_rooms_client_id_fkey;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'owner_id'
  ) into owner_col_exists;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'role'
  ) into role_col_exists;

  -- Legacy case A: company_id contains companies.user_id (convert to companies.id)
  update public.chat_rooms cr
  set company_id = c.id
  from public.companies c
  where cr.company_id = c.user_id
    and cr.company_id is not null
    and not exists (
      select 1
      from public.companies cc
      where cc.id = cr.company_id
    );

  -- Legacy case B: company_id contains companies.owner_id (older schema)
  if owner_col_exists then
    execute $sql$
      update public.chat_rooms cr
      set company_id = c.id
      from public.companies c
      where cr.company_id = c.owner_id
        and cr.company_id is not null
        and not exists (
          select 1
          from public.companies cc
          where cc.id = cr.company_id
        )
    $sql$;
  end if;

  -- Fallback: participant_a points to the company owner user id
  update public.chat_rooms cr
  set company_id = c.id
  from public.companies c
  where cr.company_id is not null
    and not exists (
      select 1
      from public.companies cc
      where cc.id = cr.company_id
    )
    and cr.participant_a = c.user_id;

  -- Fallback legacy: participant_a points to owner_id
  if owner_col_exists then
    execute $sql$
      update public.chat_rooms cr
      set company_id = c.id
      from public.companies c
      where cr.company_id is not null
        and not exists (
          select 1
          from public.companies cc
          where cc.id = cr.company_id
        )
        and cr.participant_a = c.owner_id
    $sql$;
  end if;

  -- If unresolved, nullify to allow FK validation
  update public.chat_rooms cr
  set company_id = null
  where cr.company_id is not null
    and not exists (
      select 1
      from public.companies c
      where c.id = cr.company_id
    );

  -- Normalize client_id from participant_b when participant_b references an existing profile
  update public.chat_rooms cr
  set client_id = cr.participant_b
  where cr.client_id is null
    and cr.participant_b is not null
    and exists (
      select 1
      from public.profiles p
      where p.id = cr.participant_b
    );

  -- If client_id does not reference an existing profile, nullify
  update public.chat_rooms cr
  set client_id = null
  where cr.client_id is not null
    and not exists (
      select 1
      from public.profiles p
      where p.id = cr.client_id
    );

  -- If role column exists, ensure client_id points to a client profile
  if role_col_exists then
    execute $sql$
      update public.chat_rooms cr
      set client_id = null
      where cr.client_id is not null
        and exists (
          select 1
          from public.profiles p
          where p.id = cr.client_id
            and coalesce(lower(p.role), '') <> 'client'
        )
    $sql$;
  end if;

  -- Backfill participants from canonical data
  update public.chat_rooms cr
  set participant_a = c.user_id
  from public.companies c
  where c.id = cr.company_id
    and c.user_id is not null
    and (cr.participant_a is null or cr.participant_a = cr.company_id);

  if owner_col_exists then
    execute $sql$
      update public.chat_rooms cr
      set participant_a = c.owner_id
      from public.companies c
      where c.id = cr.company_id
        and c.owner_id is not null
        and cr.participant_a is null
    $sql$;
  end if;

  update public.chat_rooms
  set participant_b = client_id
  where participant_b is null
    and client_id is not null;

  -- Deduplicate only canonical pairs, keep oldest room
  with ranked as (
    select
      id,
      row_number() over (
        partition by company_id, client_id
        order by created_at asc, id asc
      ) as rn
    from public.chat_rooms
    where company_id is not null
      and client_id is not null
  )
  delete from public.chat_rooms
  where id in (
    select id
    from ranked
    where rn > 1
  );

  create unique index if not exists chat_rooms_company_id_client_id_key
    on public.chat_rooms (company_id, client_id)
    where company_id is not null
      and client_id is not null;

  create unique index if not exists chat_rooms_participants_unique_idx
    on public.chat_rooms (
      least(participant_a::text, participant_b::text),
      greatest(participant_a::text, participant_b::text)
    )
    where participant_a is not null
      and participant_b is not null;

  alter table public.chat_rooms
    add constraint chat_rooms_company_id_fkey
      foreign key (company_id)
      references public.companies(id)
      on delete cascade
      not valid;

  alter table public.chat_rooms
    add constraint chat_rooms_client_id_fkey
      foreign key (client_id)
      references public.profiles(id)
      on delete cascade
      not valid;

  alter table public.chat_rooms
    validate constraint chat_rooms_company_id_fkey;

  alter table public.chat_rooms
    validate constraint chat_rooms_client_id_fkey;
end $$;

commit;
