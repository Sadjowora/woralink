'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-md border border-gray-200 bg-white p-8">
          <div className="mb-7">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Connexion</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tighter text-primary">Se connecter</h1>
            <p className="mt-2 text-sm text-gray-500">
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
                className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
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
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 pr-11 text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-white"
                  placeholder="Votre mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute inset-y-0 right-0 inline-flex items-center justify-center px-3 text-gray-500 transition-colors hover:text-primary"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                      <path d="M10.58 10.58a2 2 0 102.83 2.83" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M9.88 5.09A10.94 10.94 0 0112 4.9c5 0 9.27 3.11 11 7.5a12.38 12.38 0 01-3.11 4.57" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M6.62 6.62A12.3 12.3 0 001 12.4c1.73 4.39 6 7.5 11 7.5a10.9 10.9 0 004.29-.84" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                      <path d="M1 12.4c1.73-4.39 6-7.5 11-7.5s9.27 3.11 11 7.5c-1.73 4.39-6 7.5-11 7.5S2.73 16.79 1 12.4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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

          <p className="mt-6 text-center text-sm text-gray-500">
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