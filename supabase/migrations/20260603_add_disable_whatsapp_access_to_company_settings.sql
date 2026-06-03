begin;

alter table public.company_settings
  add column if not exists disable_whatsapp_access boolean not null default false;

commit;