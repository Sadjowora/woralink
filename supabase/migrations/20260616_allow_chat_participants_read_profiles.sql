begin;

-- Allow authenticated users to read profiles that are part of their chat rooms.
-- This unlocks displaying real client names (profiles.full_name) in pro messaging.
alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_chat_participants" on public.profiles;

create policy "profiles_select_chat_participants"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.chat_rooms cr
      where
        (cr.client_id = public.profiles.id
         or cr.participant_a = public.profiles.id
         or cr.participant_b = public.profiles.id)
        and auth.uid() in (cr.participant_a, cr.participant_b)
    )
  );

commit;
