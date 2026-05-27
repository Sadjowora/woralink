begin;

alter table public.contact_messages
  drop constraint if exists contact_messages_sender_id_fkey,
  drop constraint if exists contact_messages_company_id_fkey;

alter table public.contact_messages
  add constraint contact_messages_sender_id_fkey
    foreign key (sender_id)
    references public.profiles(id)
    on delete set null,
  add constraint contact_messages_company_id_fkey
    foreign key (company_id)
    references public.companies(id)
    on delete set null;

commit;
