'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export type DashboardNavItem = {
  label: string;
  href: string;
  match?: (pathname: string) => boolean;
};

const defaultTabs: DashboardNavItem[] = [
  { label: 'Apercu', href: '/dashboard', match: (pathname: string) => pathname === '/dashboard' },
  {
    label: 'Profil',
    href: '/dashboard/profile',
    match: (pathname: string) => pathname === '/dashboard/profile' || pathname === '/dashboard/setup',
  },
  {
    label: 'Médias',
    href: '/dashboard/media',
    match: (pathname: string) => pathname === '/dashboard/media',
  }
];

type DashboardTabsProps = {
  links?: DashboardNavItem[];
};

export default function DashboardTabs({ links = defaultTabs }: DashboardTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userLabel, setUserLabel] = useState('Utilisateur');

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserLabel(
          user.user_metadata?.full_name?.trim() || user.email?.trim() || 'Utilisateur'
        );
      }

      setLoadingUser(false);
    };

    void loadUser();
  }, []);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const initial = useMemo(() => userLabel.charAt(0).toUpperCase() || 'U', [userLabel]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md" aria-label="Navigation du dashboard">
      <div className="grid h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4 px-6">
        <div className="flex items-center">
          <Link href="/" className="shrink-0 transition-opacity hover:opacity-80">
            <Image src="/woralink.png" alt="Woralink" width={140} height={36} className="h-auto w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center justify-center overflow-hidden">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => {
            const isActive = link.match ? link.match(pathname) : pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? 'page' : undefined}
                className={`inline-flex h-10 shrink-0 items-center rounded-md px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          </div>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Ouvrir le menu utilisateur"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white" aria-hidden="true">
              {initial}
            </span>
            <span className="hidden max-w-32 truncate text-sm sm:block">
              {loadingUser ? '...' : userLabel}
            </span>
            <svg className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.512a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              aria-label="Menu utilisateur"
              className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-gray-200 bg-white p-1 shadow-sm"
            >
              <Link
                href="/dashboard/profile"
                role="menuitem"
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Mon profil
              </Link>
              <Link
                href="/dashboard/media"
                role="menuitem"
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                Mes médias
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={handleSignOut}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Deconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}