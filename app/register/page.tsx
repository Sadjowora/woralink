'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaFacebookF, FaGoogle, FaLinkedinIn } from 'react-icons/fa';
import AuthShell from '../components/auth/AuthShell';
import { registerUser } from './actions';
import { buildAuthRedirectTo, supabase } from '@/lib/supabase';

function mapSignUpError(message: string) {
  if (/already registered|already exists|email.*exist/i.test(message)) {
    return 'Un compte avec cette adresse e-mail existe deja. Connectez-vous ou utilisez une autre adresse.';
  }
  return "Une erreur est survenue lors de l'inscription. Veuillez reessayer.";
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'company' | 'visitor'>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      `[RegisterPage] Starting OAuth flow for provider: ${provider}`,
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
      console.error('[RegisterPage] OAuth connection failed', {
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

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await registerUser(fullName, email, password, role);

      if (result.status === 'error') {
        setError(result.message);
        return;
      }

      if (result.status === 'success') {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(
            'Compte créé, mais la connexion automatique a échoué. Connectez-vous pour continuer.',
          );
          router.push('/login');
          return;
        }

        router.push(role === 'visitor' ? '/dashboard/client' : '/onboarding');
        return;
      }

      setError('Inscription impossible pour le moment. Veuillez reessayer.');
    } catch (err) {
      console.error('Erreur générale:', err);
      setError(mapSignUpError(err instanceof Error ? err.message : ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Inscription"
      title="Créez votre présence Woralink"
      description="Ouvrez votre espace professionnel, renseignez votre fiche entreprise et gérez votre visibilité locale depuis un dashboard pensé pour aller vite."
      footerText="Vous avez déjà un compte ?"
      footerLinkLabel="Se connecter"
      footerLinkHref="/login"
    >
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-8">
        <div className="mb-5 sm:mb-6">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">
            Création de compte
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary sm:text-3xl">
            Rejoindre Woralink
          </h2>
          <p className="mt-2 text-xs text-gray-500 sm:text-sm">
            Créez votre compte puis complétez votre profil pour publier votre fiche entreprise.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3"
              placeholder="Votre nom complet"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3"
              placeholder="vous@entreprise.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3"
              placeholder="Choisissez un mot de passe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3"
              placeholder="Répétez votre mot de passe"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'company' | 'visitor')}
              required
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:px-4 sm:py-3"
            >
              <option value="visitor">Visiteur</option>
              <option value="company">PME, Entreprise, Artisan, Freelance, Startup</option>
            </select>
            <p className="mt-2 text-xs text-gray-500">Tous les champs sont obligatoires.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
          >
            {loading ? 'Inscription...' : 'Créer mon espace Woralink'}
          </button>

          <p className="text-xs leading-relaxed text-gray-500">
            En créant un compte, vous acceptez notre{' '}
            <Link
              href="/politique-confidentialite"
              className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
            >
              Politique de confidentialité
            </Link>{' '}
            et nos{' '}
            <Link
              href="/conditions-utilisation"
              className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
            >
              Conditions d&apos;utilisation
            </Link>
            .
          </p>
        </form>

        {role !== 'visitor' && (
          <div className="mt-5 sm:mt-6">
            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  OU
                </span>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-medium text-gray-700">Connexion sociale</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 group-hover:text-green-700">
                    <FaGoogle className="h-4 w-4" />
                  </span>
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 group-hover:text-green-700">
                    <FaFacebookF className="h-4 w-4" />
                  </span>
                  Facebook
                </button>
                <button
                  type="button"
                  onClick={() => handleSocialLogin('linkedin_oidc')}
                  disabled={loading}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center text-gray-500 group-hover:text-green-700">
                    <FaLinkedinIn className="h-4 w-4" />
                  </span>
                  LinkedIn
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 rounded-2xl bg-gray-50 p-3 text-sm text-gray-600 sm:mt-6 sm:p-4">
          Une fois inscrit, vous serez redirigé vers votre onglet profil pour finaliser votre fiche
          entreprise.
          <div className="mt-2">
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Déjà inscrit ? Accéder à mon espace
            </Link>
          </div>
        </div>
      </div>
    </AuthShell>
  );
}
