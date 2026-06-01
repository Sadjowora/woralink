begin;

update public.chat_rooms
set
  participant_a = company_id,
  participant_b = client_id
where participant_a is null
  and participant_b is null
  and company_id is not null
  and client_id is not null;

commit;