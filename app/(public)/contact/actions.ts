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

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = SupabaseClient<any>;

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

  return { adminClient: adminClient as AdminClient };
}

type ChatRoomRow = { id: string };

async function resolveCompanyProfileId(
  adminClient: AdminClient,
  receiverId: string,
): Promise<string | null> {
  const normalizedReceiverId = receiverId.trim();
  if (!normalizedReceiverId) return null;

  const { data: companyById, error: companyByIdError } = await adminClient
    .from('companies')
    .select('user_id')
    .eq('id', normalizedReceiverId)
    .maybeSingle<{ user_id?: string | null }>();

  if (companyByIdError && !/column .* does not exist|user_id/i.test(companyByIdError.message)) {
    console.error('[chat] company user_id lookup error:', companyByIdError.message);
    return null;
  }

  if (typeof companyById?.user_id === 'string' && companyById.user_id.trim()) {
    return companyById.user_id.trim();
  }

  const { data: companyByOwnerId, error: companyByOwnerIdError } = await adminClient
    .from('companies')
    .select('owner_id')
    .eq('id', normalizedReceiverId)
    .maybeSingle<{ owner_id?: string | null }>();

  if (
    companyByOwnerIdError &&
    !/column .* does not exist|owner_id/i.test(companyByOwnerIdError.message)
  ) {
    console.error('[chat] company owner_id lookup error:', companyByOwnerIdError.message);
    return null;
  }

  if (typeof companyByOwnerId?.owner_id === 'string' && companyByOwnerId.owner_id.trim()) {
    return companyByOwnerId.owner_id.trim();
  }

  const { data: profileById, error: profileByIdError } = await adminClient
    .from('profiles')
    .select('id')
    .eq('id', normalizedReceiverId)
    .maybeSingle<{ id: string }>();

  if (profileByIdError) {
    console.error('[chat] profile lookup error:', profileByIdError.message);
    return null;
  }

  return profileById?.id ?? null;
}

async function getOrCreateChatRoom(
  adminClient: AdminClient,
  companyId: string,
  clientId: string,
): Promise<string> {
  const { data: existingRoom, error: roomLookupError } = await adminClient
    .from('chat_rooms')
    .select('id')
    .eq('company_id', companyId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (roomLookupError) {
    throw roomLookupError;
  }

  if (existingRoom?.id) {
    return existingRoom.id;
  }

  const { data: createdRoom, error: roomCreateError } = await adminClient
    .from('chat_rooms')
    .insert({
      participant_a: companyId,
      participant_b: clientId,
      company_id: companyId,
      client_id: clientId,
      created_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (roomCreateError) {
    const { data: fallbackRoom, error: fallbackLookupError } = await adminClient
      .from('chat_rooms')
      .select('id')
      .eq('company_id', companyId)
      .eq('client_id', clientId)
      .maybeSingle();

    if (fallbackLookupError) {
      throw fallbackLookupError;
    }

    if (fallbackRoom?.id) {
      return fallbackRoom.id;
    }

    throw roomCreateError;
  }

  if (!createdRoom?.id) {
    throw new Error('Impossible de créer la room de messagerie.');
  }

  return createdRoom.id;
}

// ─── startChatRoom ────────────────────────────────────────────────────────────

export type StartChatRoomResult = { roomId: string; created: boolean } | { error: string };

/**
 * Initialise ou retrouve un salon de chat entre deux utilisateurs.
 * La vérification est bidirectionnelle : (A,B) et (B,A) désignent le même salon.
 * Sûr contre les race conditions via un fallback re-lecture sur unique_violation.
 */
export async function startChatRoom(
  senderId: string,
  receiverId: string,
): Promise<StartChatRoomResult> {
  const a = senderId.trim();
  const b = receiverId.trim();

  if (!a || !b) {
    return { error: 'Identifiants manquants pour ouvrir la discussion.' };
  }
  if (a === b) {
    return { error: 'Vous ne pouvez pas démarrer une discussion avec vous-même.' };
  }

  const { adminClient, error: configError } = getAdminSupabaseClient();
  if (configError) {
    return { error: configError };
  }

  const profileCompanyId = await resolveCompanyProfileId(adminClient, b);
  if (!profileCompanyId) {
    return { error: 'Professionnel destinataire introuvable.' };
  }

  if (a === profileCompanyId) {
    return { error: 'Vous ne pouvez pas démarrer une discussion avec vous-même.' };
  }

  // 2. Vérifier si un salon existe déjà pour ce client + cette entreprise
  const { data: existingRoom, error: lookupError } = await adminClient
    .from('chat_rooms')
    .select('id')
    .eq('client_id', a)
    .eq('company_id', profileCompanyId)
    .maybeSingle<ChatRoomRow>();

  if (lookupError) {
    console.error('[startChatRoom] lookup error:', lookupError.message);
    return { error: 'Erreur lors de la vérification du salon existant.' };
  }

  if (existingRoom?.id) {
    return { roomId: existingRoom.id, created: false };
  }

  // 3. Créer le salon
  const { data: createdRoom, error: createError } = await adminClient
    .from('chat_rooms')
    .insert({
      participant_a: profileCompanyId,
      participant_b: a,
      client_id: a,
      company_id: profileCompanyId,
    })
    .select('id')
    .single<ChatRoomRow>();

  if (createError) {
    // Race condition : un autre thread a créé la room en parallèle
    if (createError.code === '23505' || /unique/i.test(createError.message)) {
      const { data: fallback } = await adminClient
        .from('chat_rooms')
        .select('id')
        .eq('client_id', a)
        .eq('company_id', profileCompanyId)
        .maybeSingle<ChatRoomRow>();

      if (fallback?.id) {
        return { roomId: fallback.id, created: false };
      }
    }

    console.error('[startChatRoom] create error:', createError.message);
    return { error: 'Impossible de créer le salon de discussion.' };
  }

  if (!createdRoom?.id) {
    return { error: 'Salon créé mais identifiant manquant.' };
  }

  return { roomId: createdRoom.id, created: true };
}

// ─── sendContactMessage ───────────────────────────────────────────────────────

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

  try {
    const profileCompanyId = await resolveCompanyProfileId(adminClient, normalizedCompanyId);
    if (!profileCompanyId) {
      throw new Error('Entreprise destinataire sans profil propriétaire valide.');
    }

    const roomId = await getOrCreateChatRoom(adminClient, profileCompanyId, normalizedSenderId);

    const chatBody = [subject.trim(), body.trim()].filter(Boolean).join('\n\n');

    const { error: chatMessageError } = await adminClient.from('chat_messages').insert({
      room_id: roomId,
      sender_id: normalizedSenderId,
      message: chatBody,
      created_at: new Date().toISOString(),
    });

    if (chatMessageError) {
      console.warn('[contact/actions] chat_messages seed error:', chatMessageError.message);
    }
  } catch (chatError) {
    console.warn(
      '[contact/actions] chat room creation skipped:',
      chatError instanceof Error ? chatError.message : String(chatError),
    );
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
