'use client';

import Link from 'next/link';
import { ReactNode, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

type DashboardShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

const navItems = [
  { label: 'Apercu', href: '/dashboard', icon: LayoutDashboard, match: (pathname: string) => pathname === '/dashboard' },
  { label: 'Profil', href: '/dashboard/profile', icon: UserRound, match: (pathname: string) => pathname === '/dashboard/profile' },
  { label: 'Galerie', href: '/dashboard/gallery', icon: ImageIcon, match: (pathname: string) => pathname === '/dashboard/gallery' },
  { label: 'Media', href: '/dashboard/media', icon: QrCode, match: (pathname: string) => pathname === '/dashboard/media' },
  { label: 'Configuration', href: '/dashboard/setup', icon: Settings, match: (pathname: string) => pathname === '/dashboard/setup' },
  { label: 'Explorer', href: '/search', icon: Search, match: (pathname: string) => pathname === '/search' },
];

export default function DashboardShell({ title, subtitle, actions, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activeNav = useMemo(
    () => navItems.find((item) => item.match(pathname))?.label ?? 'Apercu',
    [pathname]
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsSidebarOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600">
      <div
        className={`fixed inset-0 z-30 bg-white/80 backdrop-blur-sm transition-opacity duration-150 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-gray-200 bg-white transition-transform duration-150 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Link href="/" className="flex items-center gap-3 text-gray-900">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-sm font-semibold text-green-700">W</span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-gray-900">Woralink</p>
              <p className="text-xs text-gray-500">Dashboard</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 lg:hidden"
            aria-label="Fermer la navigation"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-4rem)] flex-col justify-between px-4 py-5">
          <nav className="space-y-1" aria-label="Navigation du dashboard">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 border-t border-gray-100 pt-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-sm font-semibold text-green-700">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">Espace professionnel</p>
                  <p className="truncate text-xs text-gray-500">Navigation unifiee</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Deconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 lg:hidden"
              aria-label="Ouvrir la navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{activeNav}</p>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h1>
              {subtitle ? <p className="hidden text-sm text-gray-500 sm:block">{subtitle}</p> : null}
            </div>
          </div>

          {actions ? <div className="hidden items-center gap-2 sm:flex">{actions}</div> : <div />}
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}