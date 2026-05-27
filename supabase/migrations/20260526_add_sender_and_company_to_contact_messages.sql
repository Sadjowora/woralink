begin;

alter table public.contact_messages
  add column if not exists sender_id uuid,
  add column if not exists company_id uuid;

create index if not exists contact_messages_sender_id_idx
  on public.contact_messages (sender_id);

create index if not exists contact_messages_company_id_idx
  on public.contact_messages (company_id);

commit;
