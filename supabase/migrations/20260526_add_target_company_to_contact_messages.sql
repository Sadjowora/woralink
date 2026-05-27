begin;

alter table public.contact_messages
  add column if not exists target_company_name text;

create index if not exists contact_messages_target_company_name_idx
  on public.contact_messages (target_company_name);

commit;