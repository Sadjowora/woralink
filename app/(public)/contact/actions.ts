'use server';

/*
  SQL Supabase – à exécuter une seule fois dans l'éditeur SQL de ton projet :

  create table if not exists contact_messages (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text not null,
    subject     text not null,
    message     text not null,
    created_at  timestamptz not null default now()
  );

  -- Politique RLS : autoriser l'insertion publique (anon)
  alter table contact_messages enable row level security;
  create policy "allow_anon_insert" on contact_messages
    for insert to anon with check (true);
*/

import { createClient } from '@supabase/supabase-js';

export type ContactFormState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

const SUBJECTS = ['Support', 'Partenariat', 'Signalement'] as const;
type Subject = (typeof SUBJECTS)[number];

function isValidSubject(value: string): value is Subject {
  return (SUBJECTS as readonly string[]).includes(value);
}

export async function submitContactMessage(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactFormState> {
  const { name, email, subject, message } = fields;

  if (!name.trim() || name.trim().length < 2) {
    return { status: 'error', message: 'Le nom doit contenir au moins 2 caractères.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { status: 'error', message: 'Adresse e-mail invalide.' };
  }

  if (!isValidSubject(subject)) {
    return { status: 'error', message: 'Veuillez sélectionner un sujet valide.' };
  }

  if (!message.trim() || message.trim().length < 10) {
    return { status: 'error', message: 'Le message doit contenir au moins 10 caractères.' };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { error } = await supabase.from('contact_messages').insert({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject,
    message: message.trim(),
  });

  if (error) {
    console.error('[contact/actions] Erreur Supabase:', error.message);
    return { status: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' };
  }

  return { status: 'success' };
}
