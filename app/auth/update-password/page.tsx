'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Notice = {
  type: 'success' | 'error';
  message: string;
};

export default function UpdatePasswordPage() {
  const [checking, setChecking] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const cached = window.sessionStorage.getItem('woralink:pending-new-password');
        if (cached && mounted) {
          setPassword(cached);
          setConfirmPassword(cached);
        }
      } catch {
        // Ignore storage access issues.
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setHasRecoverySession(Boolean(session?.user));
      setChecking(false);
    };

    void bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice(null);

    if (password.length < 8) {
      setNotice({
        type: 'error',
        message: 'Le mot de passe doit contenir au moins 8 caracteres.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({
        type: 'error',
        message: 'La confirmation ne correspond pas au mot de passe.',
      });
      return;
    }

    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password });
    setUpdating(false);

    if (error) {
      setNotice({
        type: 'error',
        message: 'Impossible de mettre a jour le mot de passe. Reessayez.',
      });
      return;
    }

    try {
      window.sessionStorage.removeItem('woralink:pending-new-password');
    } catch {
      // Ignore storage access issues.
    }

    setNotice({
      type: 'success',
      message: 'Mot de passe mis a jour. Vous pouvez retourner au dashboard.',
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10 transition-colors duration-200 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
              Mise a jour du mot de passe
            </h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Finalisez votre changement apres validation email.
            </p>
          </div>
        </div>

        {checking ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Verification de la session...
          </div>
        ) : !hasRecoverySession ? (
          <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
            <p>
              Session de recuperation introuvable. Relancez la procedure depuis la page
              Configuration.
            </p>
            <Link
              href="/dashboard/settings"
              className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              Retour a la configuration
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            {notice ? (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  notice.type === 'success'
                    ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300'
                    : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300'
                }`}
              >
                {notice.message}
              </div>
            ) : null}

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
              >
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400"
              >
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors duration-150 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {updating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Mise a jour...
                  </>
                ) : (
                  'Mettre a jour le mot de passe'
                )}
              </button>

              <Link
                href="/dashboard/settings"
                className="inline-flex rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                Retour a la configuration
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
