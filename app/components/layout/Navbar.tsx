'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type UserData = {
  email?: string;
  user_metadata?: Record<string, unknown> & { avatar_url?: string; full_name?: string };
};

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Vérifier la session actuelle
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser((session?.user as UserData) ?? null);
      setLoading(false);
    };

    getSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser((session?.user as UserData) ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (menuOpen || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen, mobileMenuOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <Image src="/woralink.png" alt="Woralink" width={114} height={29} className="h-auto w-auto object-contain" />
          <div className="h-9 w-32 animate-shimmer rounded-md border border-gray-100 bg-[linear-gradient(110deg,var(--color-accents-2),var(--color-accents-1),var(--color-accents-2))] bg-size-[200%_100%]"></div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 transition-opacity hover:opacity-80"
        >
<Image src="/woralink.png" alt="Woralink" width={114} height={29} className="h-auto w-auto object-contain" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex sm:items-center sm:gap-6">
          <Link
            href="/search"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
          >
            Rechercher
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 hover:border-gray-300 transition-colors relative"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {user.user_metadata?.avatar_url ? (
                  <Image
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    fill
                    className="rounded-full object-cover"
                    sizes="40px"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-700">
                    {(user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U').toUpperCase()}
                  </span>
                )}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="absolute bottom-0 right-0 h-4 w-4 text-gray-600 bg-white rounded-full"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-md border border-gray-200 bg-white p-1 shadow-md">
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Ma page
                  </Link>
                  <button
                    onClick={() => {
                      const profileUrl = window.location.href;
                      if (navigator.share) {
                        navigator.share({
                          title: 'Découvrez ce profil',
                          url: profileUrl,
                        });
                      } else {
                        navigator.clipboard.writeText(profileUrl);
                        alert('Lien copié dans le presse-papiers');
                      }
                      setMenuOpen(false);
                    }}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Partager mon profil
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
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

        {/* Mobile Hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-700"
            aria-label="Ouvrir le menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3"
        >
          <Link
            href="/search"
            className="block rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Rechercher
          </Link>

          {user ? (
            <>
              <Link
                href="/dashboard"
                className="block rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ma page
              </Link>
              <button
                onClick={() => {
                  const profileUrl = window.location.href;
                  if (navigator.share) {
                    navigator.share({
                      title: 'Découvrez ce profil',
                      url: profileUrl,
                    });
                  } else {
                    navigator.clipboard.writeText(profileUrl);
                    alert('Lien copié dans le presse-papiers');
                  }
                  setMobileMenuOpen(false);
                }}
                className="block w-full rounded-md px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Partager mon profil
              </button>
              <button
                onClick={handleSignOut}
                className="block w-full rounded-md px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="block rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
                onClick={() => setMobileMenuOpen(false)}
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}