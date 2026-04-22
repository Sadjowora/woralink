'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthShell from '../components/auth/AuthShell';
import { supabase } from '@/lib/supabase'; 

export default function RegisterPage() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Création du compte dans Auth
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                console.error("Erreur Auth:", error.message);
                setError(`Erreur d'inscription: ${error.message}`);
                return;
            }

            // 2. Si l'auth a réussi, on insère manuellement dans la table 'profiles'
            if (data.user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        { 
                            id: data.user.id, // Très important : utiliser l'ID généré par Auth
                            full_name: fullName, 
                            email: email,
                            role: role // 'company' ou 'visitor'
                        }
                    ]);
                
                if (profileError) {
                    console.error("Erreur Table Profiles:", profileError.message);
                    setError(`Erreur lors de la création du profil: ${profileError.message}`);
                    return;
                }

                router.push('/dashboard/profile');
            }
        } catch (err) {
            console.error("Erreur générale:", err);
            setError(err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite');
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
            <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm">
                <div className="mb-6">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-600">Création de compte</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tighter text-primary">Rejoindre Woralink</h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Créez votre compte puis complétez votre profil pour publier votre fiche entreprise.
                    </p>
                </div>
                
                {error && <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Nom complet</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Choisissez un mot de passe"
                        />
                    </div>
                    
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">Rôle</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            required
                            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="visitor"> Visiteur, Client </option>
                            <option value="company">Startup, PME, Artisan ou Freelance</option>
                        </select>
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                        {loading ? 'Inscription...' : 'Créer mon espace Woralink'}
                    </button>
                </form>

                <div className="mt-6 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
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