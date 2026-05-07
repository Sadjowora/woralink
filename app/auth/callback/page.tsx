import type { Metadata } from 'next';
import AuthCallback from '@/app/components/auth/AuthCallback';

export const metadata: Metadata = {
    title: 'Connexion en cours… | Woralink',
};

export default function AuthCallbackPage() {
    return <AuthCallback />;
}
