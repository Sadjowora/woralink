-- Create contact_messages table for public contact form submissions
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Recommended indexes for admin 
listing and filtering
create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);

create index if not exists contact_messages_email_idx
  on public.contact_messages (email);

alter table public.contact_messages enable row level security;

-- Allow anonymous visitors to submit contact form entries
drop policy if exists "allow_anon_insert_contact_messages" on public.contact_messages;

create policy "allow_anon_insert_contact_messages"
  on public.contact_messages
  for insert
  to anon
  with check (true);

-- Optional: prevent anonymous reads/updates/deletes implicitly by not creating policies for them
