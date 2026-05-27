begin;

-- Allow authenticated users to read only their own contact messages.
-- sender_id handles the new direct-message flow.
-- email fallback keeps legacy messages visible when sender_id is null.
drop policy if exists "authenticated_read_own_contact_messages" on public.contact_messages;

create policy "authenticated_read_own_contact_messages"
  on public.contact_messages
  for select
  to authenticated
  using (
    sender_id = auth.uid()
    or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

commit;
