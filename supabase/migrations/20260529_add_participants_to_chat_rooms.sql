begin;

-- Crée la table si elle n'existe pas encore (projet fraîchement cloné)
create table if not exists public.chat_rooms (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid,
  client_id  uuid,
  created_at timestamptz not null default now()
);

-- Colonnes génériques (nullable pour rétrocompatibilité avec les lignes company/client existantes)
alter table public.chat_rooms
  add column if not exists participant_a uuid,
  add column if not exists participant_b uuid;

-- Backfill : alimente les nouvelles colonnes depuis les anciennes pour les rooms existantes
update public.chat_rooms
set
  participant_a = company_id,
  participant_b = client_id
where participant_a is null
  and participant_b is null
  and company_id is not null
  and client_id  is not null;

-- Index unique fonctionnel bidirectionnel :
-- least/greatest garantit que (A,B) et (B,A) génèrent la même clé d'index
create unique index if not exists chat_rooms_participants_unique_idx
  on public.chat_rooms (
    least(participant_a::text, participant_b::text),
    greatest(participant_a::text, participant_b::text)
  )
  where participant_a is not null
    and participant_b is not null;

-- RLS : chaque participant accède uniquement à ses propres rooms
alter table public.chat_rooms enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'chat_rooms'
      and policyname = 'chat_rooms_participants_select'
  ) then
    execute $pol$
      create policy chat_rooms_participants_select
        on public.chat_rooms
        for select
        to authenticated
        using (
          auth.uid() = participant_a
          or auth.uid() = participant_b
          or auth.uid() = client_id
          or auth.uid() in (
            select user_id from public.companies where id = company_id
          )
        )
    $pol$;
  end if;
end $$;

commit;
