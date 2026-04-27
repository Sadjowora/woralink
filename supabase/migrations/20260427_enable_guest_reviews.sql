do $$
begin
  if to_regclass('public.reviews') is null then
    raise notice 'Table public.reviews not found, skipping guest reviews migration.';
    return;
  end if;

  alter table public.reviews
    add column if not exists reviewer_name text,
    add column if not exists reviewer_email text,
    add column if not exists reviewer_phone text;

  begin
    alter table public.reviews alter column user_id drop not null;
  exception
    when undefined_column then
      null;
  end;

  alter table public.reviews
    drop constraint if exists reviews_guest_identity_check;

  alter table public.reviews
    add constraint reviews_guest_identity_check
    check (
      user_id is not null
      or (
        nullif(trim(reviewer_name), '') is not null
        and (
          nullif(trim(reviewer_email), '') is not null
          or nullif(trim(reviewer_phone), '') is not null
        )
      )
    );

  create unique index if not exists reviews_unique_user_per_company_idx
    on public.reviews (company_id, user_id)
    where user_id is not null;
end $$;

alter table public.reviews enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_select_public'
  ) then
    create policy reviews_select_public
      on public.reviews
      for select
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'reviews'
      and policyname = 'reviews_insert_public'
  ) then
    create policy reviews_insert_public
      on public.reviews
      for insert
      to anon, authenticated
      with check (
        company_id is not null
        and rating between 1 and 5
        and nullif(trim(comment), '') is not null
        and (
          (auth.uid() is not null and user_id = auth.uid())
          or (
            auth.uid() is null
            and user_id is null
            and nullif(trim(reviewer_name), '') is not null
            and (
              nullif(trim(reviewer_email), '') is not null
              or nullif(trim(reviewer_phone), '') is not null
            )
          )
        )
      );
  end if;
end $$;
