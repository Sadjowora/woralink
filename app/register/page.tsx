'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '../components/auth/AuthShell';
import { supabase } from '@/lib/supabase';
import { registerUser } from './actions';

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'company' | 'visitor'>('company');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Inscription atomique via server action :
            // si le profil échoue, le compte Auth est supprimé automatiquement.
            const result = await registerUser(fullName, email, password);

            if (result.status === 'error') {
                setError(result.message);
                return;
            }

            // Ouvrir la session côté client après inscription réussie
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) {
                console.log('Erreur de connexion après inscription:', signInError);
                setError('Votre compte a été créé. La connexion automatique a échoué, veuillez vous connecter manuellement.');
                return;
            }

            router.push('/dashboard/profile');
        } catch (err) {
            console.error('Erreur générale:', err);
            setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
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
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">Création de compte</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary sm:text-3xl">Rejoindre Woralink</h2>
                    <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                        Créez votre compte puis complétez votre profil pour publier votre fiche entreprise.
                    </p>
                </div>
                
                {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:p-4">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        <label className="mb-1 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
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
                    </div>

                    {role === 'visitor' && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 sm:p-4">
                            <p className="font-semibold">Inscription non requise pour les visiteurs</p>
                            <p className="mt-1">
                                Notre plateforme vous permet de consulter librement les professionnels sans créer de compte.{' '}
                                <Link href="/search" className="font-semibold text-amber-900 underline hover:text-amber-700">
                                    Parcourir les professionnels
                                </Link>
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || role === 'visitor'}
                        className="w-full rounded-md bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-3"
                    >
                        {loading ? 'Inscription...' : 'Créer mon espace Woralink'}
                    </button>
                </form>

                <div className="mt-5 rounded-2xl bg-gray-50 p-3 text-sm text-gray-600 sm:mt-6 sm:p-4">
                    Une fois inscrit, vous serez redirigé vers votre onglet profil pour finaliser votre fiche entreprise.
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