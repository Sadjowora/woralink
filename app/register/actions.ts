'use server';

import { createClient } from '@supabase/supabase-js';

function traduireErreur(message: string): string {
  if (/already registered|already exists|email.*exist/i.test(message))
    return 'Un compte avec cette adresse e-mail existe deja. Connectez-vous ou utilisez une autre adresse.';
  if (/unauthorized|not authorized|permission denied|invalid api key|not_admin/i.test(message))
    return "Configuration Supabase invalide pour l'inscription. Vérifiez la clé serveur SUPABASE_SERVICE_ROLE_KEY.";
  if (/invalid email/i.test(message)) return 'Adresse e-mail invalide.';
  if (/password.*characters|password.*length|at least.*characters/i.test(message))
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  if (/weak password/i.test(message))
    return 'Le mot de passe est trop faible. Choisissez un mot de passe plus sécurisé.';
  if (/rate limit|too many requests/i.test(message))
    return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
  if (/network|fetch|connection/i.test(message))
    return 'Erreur réseau. Vérifiez votre connexion et réessayez.';
  return "Une erreur inattendue s'est produite. Veuillez réessayer.";
}

export type RegisterState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

function getAdminClient() {
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

/**
 * Inscription atomique : si l'insertion du profil échoue après la création
 * du compte Auth, l'utilisateur Auth est immédiatement supprimé pour permettre
 * une nouvelle tentative sans conflit.
 *
 * Requiert SUPABASE_SERVICE_ROLE_KEY dans .env.local (jamais exposée au client
 * car elle ne commence pas par NEXT_PUBLIC_).
 */
export async function registerUser(
  fullName: string,
  email: string,
  password: string,
  role: 'company' | 'visitor',
): Promise<RegisterState> {
  const { adminClient, error } = getAdminClient();
  if (error) {
    return {
      status: 'error',
      message: error,
    };
  }

  // 1. Créer l'utilisateur dans Auth
  const { data, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirme l'email côté serveur pour permettre la connexion immédiate
  });

  if (authError || !data.user) {
    console.error('[registerUser] auth.admin.createUser failed', authError);
    return {
      status: 'error',
      message: traduireErreur(authError?.message ?? ''),
    };
  }

  const userId = data.user.id;
  const profileRole = role === 'visitor' ? 'client' : role;

  // 2. Insérer le profil
  const { error: profileError } = await adminClient.from('profiles').insert([
    {
      id: userId,
      full_name: fullName,
      email,
      role: profileRole,
    },
  ]);

  if (profileError) {
    console.error('[registerUser] profiles insert failed', profileError);
    // Rollback : supprimer l'utilisateur Auth pour éviter tout conflit futur
    await adminClient.auth.admin.deleteUser(userId);
    return {
      status: 'error',
      message:
        'Une erreur est survenue lors de la création de votre profil. Votre inscription a été annulée, vous pouvez réessayer.',
    };
  }

  return { status: 'success' };
}
