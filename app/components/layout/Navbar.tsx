'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<object | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session actuelle
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
          <Image src="/woralink.png" alt="Woralink" width={160} height={40} className="h-auto w-auto object-contain" />
          <div className="h-9 w-36 animate-shimmer rounded-md border border-gray-100 bg-[linear-gradient(110deg,var(--color-accents-2),var(--color-accents-1),var(--color-accents-2))] bg-size-[200%_100%]"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link
          href="/"
          className="transition-opacity hover:opacity-80"
        >
<Image src="/woralink.png" alt="Woralink" width={160} height={40} className="h-auto w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
          >
            Rechercher
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
              >
                Dashboard
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
              >
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-1 py-2 text-sm font-medium text-gray-500 transition-colors hover:text-black"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}