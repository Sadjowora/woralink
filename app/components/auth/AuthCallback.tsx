'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

async function resolveRedirectPath(userId: string): Promise<'/dashboard' | '/dashboard/setup'> {
    const { data, error } = await supabase
        .from('companies')
        .select('id, name, sector, city, whatsapp')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error('[AuthCallback] Error checking company profile:', {
            message: error.message,
            code: error.code,
            userId,
        });
        // En cas d'erreur, on envoie vers le setup pour éviter un dashboard vide
        return '/dashboard/setup';
    }

    const isProfileComplete =
        data !== null &&
        typeof data.name === 'string' && data.name.trim().length > 0 &&
        typeof data.sector === 'string' && data.sector.trim().length > 0 &&
        typeof data.city === 'string' && data.city.trim().length > 0 &&
        typeof data.whatsapp === 'string' && data.whatsapp.trim().length > 0;

    console.info(
        '[AuthCallback] Company profile check:',
        isProfileComplete ? 'complete → /dashboard' : 'incomplete → /dashboard/setup',
        '| data:', data
    );

    return isProfileComplete ? '/dashboard' : '/dashboard/setup';
}

export default function AuthCallback() {
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                console.info('[AuthCallback] Auth state change:', event, '| Session:', session?.user?.email ?? 'none');

                if (session !== null) {
                    void resolveRedirectPath(session.user.id).then((path) => {
                        console.info(`[AuthCallback] Session detected, redirecting to ${path}`);
                        router.replace(path);
                    });
                    return;
                }

                if (event === 'SIGNED_OUT') {
                    console.warn('[AuthCallback] User signed out, redirecting to /login');
                    router.replace('/login');
                }
            }
        );

        // Vérification immédiate de la session existante au montage
        const checkExistingSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error('[AuthCallback] getSession error:', {
                    message: error.message,
                    status: error.status,
                });
                setErrorMessage('Erreur lors de la vérification de votre session. Veuillez réessayer.');
                return;
            }

            if (session) {
                const path = await resolveRedirectPath(session.user.id);
                console.info(`[AuthCallback] Existing session found, redirecting to ${path}`);
                router.replace(path);
            }
        };

        void checkExistingSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    if (errorMessage) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white px-4">
                <div className="w-full max-w-sm rounded-xl border border-red-200 bg-red-50 p-6 text-center">
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
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
            <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-green-700"
                role="status"
                aria-label="Chargement en cours"
            />
            <p className="text-sm text-gray-500">Connexion en cours, veuillez patienter…</p>
        </div>
    );
}

