'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaFacebookF, FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import { buildAuthRedirectTo, supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const FACEBOOK_REDIRECT_URL = 'https://woralink.com/auth/callback';

  const isUnauthorizedDomainError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('domain') ||
      normalized.includes('redirect_uri') ||
      normalized.includes('url blocked') ||
      normalized.includes('not allowed') ||
      normalized.includes('app domain') ||
      normalized.includes('invalid redirect')
    );
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setError('');

    const linkedInRedirectUrl =
      typeof window !== 'undefined'
        ? window.location.origin + '/auth/callback'
        : buildAuthRedirectTo('/auth/callback');

    const redirectUrl =
      provider === 'facebook'
        ? FACEBOOK_REDIRECT_URL
        : provider === 'linkedin_oidc'
          ? linkedInRedirectUrl
          : buildAuthRedirectTo('/auth/callback');
    console.info(
      `[LoginPage] Starting OAuth flow for provider: ${provider}`,
      `| Redirect URL: ${redirectUrl}`,
    );

    const { error: oauthError } =
      provider === 'facebook'
        ? await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: {
              redirectTo: FACEBOOK_REDIRECT_URL,
            },
          })
        : provider === 'linkedin_oidc'
          ? await supabase.auth.signInWithOAuth({
              provider: 'linkedin_oidc',
              options: {
                redirectTo: window.location.origin + '/auth/callback',
              },
            })
          : await supabase.auth.signInWithOAuth({
              provider: provider as 'google' | 'facebook' | 'linkedin_oidc',
              options: {
                redirectTo: redirectUrl,
                ...(provider === 'google' && {
                  queryParams: { prompt: 'select_account' },
                }),
              },
            });

    if (oauthError) {
      console.error('[LoginPage] OAuth connection failed', {
        provider,
        errorMessage: oauthError.message,
        errorStatus: oauthError.status,
        errorCode: oauthError.code,
        redirectUrl,
      });

      if (provider === 'facebook' && isUnauthorizedDomainError(oauthError.message)) {
        alert(
          'Facebook a refuse la connexion: domaine ou URL de redirection non autorise. Verifiez la console Meta (App Domains / Valid OAuth Redirect URIs) et la configuration du code.',
        );
      }

      setError('Connexion sociale indisponible pour le moment. Veuillez reessayer.');
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(`Erreur de connexion: ${signInError.message}`);
        return;
      }

      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur inattendue s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-12 transition-colors duration-200 dark:bg-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-md border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-7">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
              Connexion
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tighter text-primary">
              Se connecter
            </h1>
            <p className="mt-2 text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
              Accédez à votre espace Woralink pour gérer votre présence en ligne.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                placeholder="vous@entreprise.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-900"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-gray-500 transition-colors hover:text-primary dark:text-slate-400"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10.58 10.58a2 2 0 102.83 2.83"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.88 5.09A10.94 10.94 0 0112 4.9c5 0 9.27 3.11 11 7.5a12.38 12.38 0 01-3.11 4.57"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6.62 6.62A12.3 12.3 0 001 12.4c1.73 4.39 6 7.5 11 7.5a10.9 10.9 0 004.29-.84"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path
                        d="M1 12.4c1.73-4.39 6-7.5 11-7.5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.79 1 12.4z"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                      />
                      <circle cx="12" cy="12.4" r="3" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Connexion...' : 'Entrer dans mon espace Woralink'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 transition-colors duration-200 dark:bg-slate-900 dark:text-slate-400">
                  OU
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-gray-700 transition-colors duration-200 dark:text-slate-300">
                Connexion sociale
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-green-400"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 transition-colors duration-150 group-hover:text-green-700 dark:text-slate-400 dark:group-hover:text-green-400">
                    <FaGoogle className="h-4 w-4" />
                  </span>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-green-400"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 transition-colors duration-150 group-hover:text-green-700 dark:text-slate-400 dark:group-hover:text-green-400">
                    <FaFacebookF className="h-4 w-4" />
                  </span>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('linkedin_oidc')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-green-400"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 transition-colors duration-150 group-hover:text-green-700 dark:text-slate-400 dark:group-hover:text-green-400">
                    <FaLinkedinIn className="h-4 w-4" />
                  </span>
                  LinkedIn
                </button>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
            Vous n&apos;avez pas encore de compte ?{' '}
            <Link href="/register" className="font-semibold text-black hover:opacity-90">
              Créer un compte
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
