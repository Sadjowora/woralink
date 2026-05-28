'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

type UserData = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type CompanyIdentity = {
  name: string;
  logo_url: string | null;
};

type ProfileIdentity = {
  full_name: string | null;
};

function getInitials(fullName: string | null | undefined, email: string | undefined): string {
  const normalizedName = typeof fullName === 'string' ? fullName.trim() : '';

  if (normalizedName) {
    const parts = normalizedName.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase());
    if (initials.length > 0) {
      return initials.join('');
    }
  }

  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  if (normalizedEmail) {
    return normalizedEmail.charAt(0).toUpperCase();
  }

  return 'U';
}

function UserAvatar({
  logoUrl,
  initials,
  displayName,
}: {
  logoUrl: string | null;
  initials: string;
  displayName: string;
}) {
  return (
    <div className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-100">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`Logo de ${displayName}`}
          fill
          className="rounded-full object-cover"
          sizes="40px"
        />
      ) : (
        <span className="text-sm font-semibold text-gray-700">{initials}</span>
      )}
    </div>
  );
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [companyIdentity, setCompanyIdentity] = useState<CompanyIdentity | null>(null);
  const [profileIdentity, setProfileIdentity] = useState<ProfileIdentity | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadProfileIdentity = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle<ProfileIdentity>();

      if (profile) {
        setProfileIdentity({
          full_name:
            typeof profile.full_name === 'string' && profile.full_name.trim()
              ? profile.full_name.trim()
              : null,
        });
      } else {
        setProfileIdentity(null);
      }
    };

    const loadCompanyIdentity = async (userId: string) => {
      const { data: company } = await supabase
        .from('companies')
        .select('name, logo_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (company) {
        setCompanyIdentity({
          name:
            typeof company.name === 'string' && company.name.trim()
              ? company.name.trim()
              : 'Entreprise',
          logo_url:
            typeof company.logo_url === 'string' && company.logo_url.trim()
              ? company.logo_url.trim()
              : null,
        });
      } else {
        setCompanyIdentity(null);
      }
    };

    // Vérifier la session actuelle
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = (session?.user as UserData) ?? null;
      setUser(currentUser);

      // Affiche rapidement la navbar, puis hydrate les infos entreprise en arrière-plan.
      setLoading(false);

      if (currentUser?.id) {
        void loadProfileIdentity(currentUser.id);
        void loadCompanyIdentity(currentUser.id);
      } else {
        setProfileIdentity(null);
        setCompanyIdentity(null);
      }
    };

    getSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = (session?.user as UserData) ?? null;
      setUser(currentUser);

      setLoading(false);

      if (currentUser?.id) {
        void loadProfileIdentity(currentUser.id);
        void loadCompanyIdentity(currentUser.id);
      } else {
        setProfileIdentity(null);
        setCompanyIdentity(null);
      }
    });

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
    setCompanyIdentity(null);
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const userInitials = getInitials(profileIdentity?.full_name, user?.email);
  const avatarDisplayName = profileIdentity?.full_name || user?.email || 'Utilisateur';

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <Image
            src="/woralink.png"
            alt="Woralink"
            width={102}
            height={26}
            priority
            style={{ width: 'auto', height: 'auto' }}
            className="object-contain"
          />
          <div className="h-9 w-32 animate-pulse rounded-md border border-gray-100 bg-gray-100" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
            <Image
              src="/woralink.png"
              alt="Woralink"
              width={102}
              height={26}
              priority
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain"
            />
          </Link>
          <Link
            href="/search"
            className="hidden text-[15px] font-semibold text-gray-500 transition-colors hover:text-black sm:inline-flex"
          >
            Explorer
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden sm:flex sm:items-center sm:gap-6">
          <Link
            href="/apropos"
            className="text-[15px] font-semibold text-gray-500 transition-colors hover:text-black"
          >
            À propos
          </Link>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-100 transition-colors hover:border-gray-300"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <UserAvatar
                  logoUrl={companyIdentity?.logo_url ?? null}
                  initials={userInitials}
                  displayName={avatarDisplayName}
                />
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-white text-gray-600"
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
                href="/comment-ca-marche"
                className="px-1 py-2 text-[15px] font-semibold text-gray-600 transition-colors hover:text-primary"
              >
                Comment ça marche ?
              </Link>
              <Link
                href="/login"
                className="px-1 py-2 text-[15px] font-semibold text-gray-500 transition-colors hover:text-black"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-4 py-2 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-3 sm:hidden">
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
          className="space-y-3 border-t border-gray-100 bg-white px-4 py-4 sm:hidden"
        >
          <Link
            href="/search"
            className="block rounded-md px-4 py-2 text-[15px] font-semibold text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Explorer
          </Link>
          <Link
            href="/apropos"
            className="block rounded-md px-4 py-2 text-[15px] font-semibold text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            À propos
          </Link>
          <Link
            href="/comment-ca-marche"
            className="block rounded-md px-4 py-2 text-[15px] font-semibold text-gray-600 hover:bg-gray-100 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Comment ça marche ?
          </Link>
          {user ? (
            <>
              <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                <UserAvatar
                  logoUrl={companyIdentity?.logo_url ?? null}
                  initials={userInitials}
                  displayName={avatarDisplayName}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {profileIdentity?.full_name || 'Mon compte'}
                  </p>
                  <p className="truncate text-xs text-gray-500">{user?.email || ''}</p>
                </div>
              </div>
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
                className="block rounded-md px-4 py-2 text-[15px] font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="block rounded-md bg-primary px-4 py-2 text-[15px] font-semibold text-white hover:bg-primary/90"
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
