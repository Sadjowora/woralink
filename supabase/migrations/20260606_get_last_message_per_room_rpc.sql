begin;

drop function if exists public.get_last_message_per_room(uuid[]);

create or replace function public.get_last_message_per_room(room_ids uuid[])
returns table (
  id uuid,
  room_id uuid,
  message text,
  created_at timestamptz,
  sender_id uuid
)
language sql
stable
set search_path = public
as $$
  select distinct on (cm.room_id)
    cm.id,
    cm.room_id,
    cm.message,
    cm.created_at,
    cm.sender_id
  from public.chat_messages cm
  where cm.room_id = any(room_ids)
  order by cm.room_id, cm.created_at desc, cm.id desc;
$$;

grant execute on function public.get_last_message_per_room(uuid[]) to authenticated;

commit;
