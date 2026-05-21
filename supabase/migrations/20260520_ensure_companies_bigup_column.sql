-- Backfill safety migration: ensure BigUp counter exists on companies.

alter table public.companies
add column if not exists bigup integer not null default 0;
