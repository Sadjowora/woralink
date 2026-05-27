'use server';

/*
  SQL Supabase – à exécuter une seule fois dans l'éditeur SQL de ton projet :

  create table if not exists contact_messages (
    id          uuid primary key default gen_random_uuid(),
    name        text not null,
    email       text not null,
    target_company_name text,
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

export type ContactState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

const SUBJECTS = ['Support', 'Partenariat', 'Signalement'] as const;
type Subject = (typeof SUBJECTS)[number];

function isValidSubject(value: string): value is Subject {
  return (SUBJECTS as readonly string[]).includes(value);
}

function translateContactError(message: string): string {
  if (/invalid input syntax|uuid/i.test(message)) {
    return "Identifiants invalides pour l'envoi du message.";
  }
  if (/null value|not-null|null constraint/i.test(message)) {
    return 'Informations de contact incomplètes. Veuillez compléter votre profil et réessayer.';
  }
  if (/foreign key|violates/i.test(message)) {
    return "Impossible d'envoyer ce message: entreprise ou expéditeur introuvable.";
  }
  if (/permission denied|not authorized|unauthorized|policy/i.test(message)) {
    return "Vous n'êtes pas autorisé à effectuer cette action.";
  }
  if (/network|fetch|connection/i.test(message)) {
    return 'Erreur réseau. Vérifiez votre connexion et réessayez.';
  }

  return "Une erreur est survenue lors de l'envoi du message.";
}

function getAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    return {
      error:
        "Configuration serveur manquante (SUPABASE_SERVICE_ROLE_KEY). Contactez l'administrateur." as const,
    };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { adminClient };
}

export async function sendContactMessage(
  senderId: string,
  companyId: string,
  subject: string,
  body: string,
): Promise<ContactState> {
  const normalizedSenderId = senderId.trim();
  const normalizedCompanyId = companyId.trim();

  if (!normalizedSenderId || !normalizedCompanyId) {
    return { status: 'error', message: 'Informations de contact incomplètes.' };
  }

  if (!subject.trim()) {
    return { status: 'error', message: 'Le sujet est obligatoire.' };
  }

  if (!body.trim() || body.trim().length < 10) {
    return { status: 'error', message: 'Le message doit contenir au moins 10 caractères.' };
  }

  const { adminClient, error } = getAdminSupabaseClient();
  if (error) {
    return { status: 'error', message: error };
  }

  const [
    { data: senderProfile, error: senderError },
    { data: targetCompany, error: companyError },
  ] = await Promise.all([
    adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', normalizedSenderId)
      .maybeSingle<{ full_name?: string | null; email?: string | null }>(),
    adminClient
      .from('companies')
      .select('id, name')
      .eq('id', normalizedCompanyId)
      .maybeSingle<{ id: string; name?: string | null }>(),
  ]);

  if (senderError || !senderProfile?.email) {
    return {
      status: 'error',
      message: 'Expéditeur introuvable. Veuillez vous reconnecter et réessayer.',
    };
  }

  if (companyError || !targetCompany?.id) {
    return {
      status: 'error',
      message: 'Entreprise destinataire introuvable.',
    };
  }

  const senderName =
    (senderProfile.full_name && senderProfile.full_name.trim()) ||
    senderProfile.email.split('@')[0] ||
    'Client';

  const { error: insertError } = await adminClient.from('contact_messages').insert({
    sender_id: normalizedSenderId,
    company_id: normalizedCompanyId,
    name: senderName,
    email: senderProfile.email.trim().toLowerCase(),
    target_company_name: targetCompany.name?.trim() || null,
    subject: subject.trim(),
    message: body.trim(),
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    console.error('[contact/actions] sendContactMessage error:', insertError.message);
    return {
      status: 'error',
      message: translateContactError(insertError.message),
    };
  }

  return {
    status: 'success',
    message: 'Message envoyé avec succès.',
  };
}

export async function submitContactMessage(fields: {
  name: string;
  email: string;
  subject: string;
  message: string;
  targetCompanyName?: string;
}): Promise<ContactFormState> {
  const { name, email, subject, message, targetCompanyName } = fields;

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
    target_company_name: targetCompanyName?.trim() || null,
    subject,
    message: message.trim(),
  });

  if (error) {
    console.error('[contact/actions] Erreur Supabase:', error.message);
    return { status: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' };
  }

  return { status: 'success' };
}
