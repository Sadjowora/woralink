begin;

-- Tighten contact message read access to authenticated owner only.
drop policy if exists "authenticated_read_own_contact_messages" on public.contact_messages;

create policy "authenticated_read_own_contact_messages"
  on public.contact_messages
  for select
  to authenticated
  using (sender_id = auth.uid());

-- Align index with dashboard query pattern: sender_id filter + created_at sorting.
create index if not exists contact_messages_sender_id_created_at_idx
  on public.contact_messages (sender_id, created_at desc)
  where sender_id is not null;

-- Improve chat room lookup performance for role-based dashboards.
create index if not exists chat_rooms_client_id_created_at_idx
  on public.chat_rooms (client_id, created_at desc)
  where client_id is not null;

create index if not exists chat_rooms_company_id_created_at_idx
  on public.chat_rooms (company_id, created_at desc)
  where company_id is not null;

create index if not exists chat_rooms_participant_a_idx
  on public.chat_rooms (participant_a)
  where participant_a is not null;

create index if not exists chat_rooms_participant_b_idx
  on public.chat_rooms (participant_b)
  where participant_b is not null;

-- Lightweight audit view to monitor remaining legacy inconsistencies.
create or replace view public.legacy_data_audit as
select
  (select count(*) from public.chat_rooms where company_id is null) as chat_rooms_missing_company_id,
  (select count(*) from public.chat_rooms where client_id is null) as chat_rooms_missing_client_id,
  (
    select count(*)
    from public.contact_messages
    where company_id is not null and sender_id is null
  ) as contact_messages_missing_sender_id;

commit;
