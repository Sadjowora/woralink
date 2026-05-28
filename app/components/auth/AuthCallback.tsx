'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

async function resolveRedirectPath(userId: string): Promise<'/dashboard' | '/onboarding'> {
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[AuthCallback] resolveRedirectPath error:', error.message);
  }

  return data?.id ? '/dashboard' : '/onboarding';
}

export default function AuthCallback() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasRedirected = useRef(false);

  useEffect(() => {
    const redirectWithError = (message: string) => {
      if (hasRedirected.current) return;

      hasRedirected.current = true;
      setErrorMessage(message);
      const encoded = encodeURIComponent(message);
      router.replace(`/login?error=${encoded}`);
    };

    const redirectAfterAuth = async (userId: string) => {
      if (hasRedirected.current) return;

      hasRedirected.current = true;
      const destination = await resolveRedirectPath(userId);
      router.replace(destination);
    };

    const timeoutId = window.setTimeout(() => {
      redirectWithError('Aucune session detectee apres 5 secondes. Veuillez vous reconnecter.');
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.info(
        '[AuthCallback] Auth state change:',
        event,
        '| Session:',
        session?.user?.email ?? 'none',
      );

      if (session?.user) {
        window.clearTimeout(timeoutId);
        void redirectAfterAuth(session.user.id);
      }
    });

    // Vérification immédiate de la session existante au montage
    const checkExistingSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('[AuthCallback] getSession error:', {
          message: error.message,
          status: error.status,
        });
        window.clearTimeout(timeoutId);
        redirectWithError(
          'Erreur lors de la verification de votre session. Veuillez vous reconnecter.',
        );
        return;
      }

      if (session?.user) {
        window.clearTimeout(timeoutId);
        await redirectAfterAuth(session.user.id);
      }
    };

    void checkExistingSession();

    return () => {
      window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [router]);

  if (errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4 transition-colors duration-200 dark:bg-slate-950">
        <div className="w-full max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center transition-colors duration-200 dark:border-red-900/50 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-700">{errorMessage}</p>
          <a
            href="/login"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white transition-colors duration-200 dark:bg-slate-950">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-700 dark:border-slate-700"
        role="status"
        aria-label="Chargement en cours"
      />
      <p className="text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
        Connexion en cours, veuillez patienter…
      </p>
    </div>
  );
}
