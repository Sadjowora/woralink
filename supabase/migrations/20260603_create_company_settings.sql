begin;

create table if not exists public.company_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  notify_new_message boolean not null default true,
  notify_weekly_report boolean not null default true,
  disable_whatsapp_access boolean not null default false,
  availability_status text not null default 'online' check (availability_status in ('online', 'offline')),
  away_message text not null default '',
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists company_settings_updated_at_idx
  on public.company_settings(updated_at desc);

create or replace function public.set_company_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_company_settings_updated_at on public.company_settings;

create trigger trg_company_settings_updated_at
before update on public.company_settings
for each row
execute function public.set_company_settings_updated_at();

alter table public.company_settings enable row level security;

drop policy if exists "company_settings_select_own" on public.company_settings;
create policy "company_settings_select_own"
  on public.company_settings
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = company_settings.company_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "company_settings_insert_own" on public.company_settings;
create policy "company_settings_insert_own"
  on public.company_settings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = company_settings.company_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists "company_settings_update_own" on public.company_settings;
create policy "company_settings_update_own"
  on public.company_settings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = company_settings.company_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = company_settings.company_id
        and c.user_id = auth.uid()
    )
  );

commit;