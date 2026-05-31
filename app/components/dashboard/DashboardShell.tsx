'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CircleHelp,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
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
  {
    label: 'Apercu',
    href: '/dashboard',
    icon: LayoutDashboard,
    match: (pathname: string) => pathname === '/dashboard',
  },
  {
    label: 'Profil',
    href: '/dashboard/profile',
    icon: UserRound,
    match: (pathname: string) => pathname === '/dashboard/profile',
  },
  {
    label: 'Galerie',
    href: '/dashboard/gallery',
    icon: ImageIcon,
    match: (pathname: string) => pathname === '/dashboard/gallery',
  },
  {
    label: 'Media',
    href: '/dashboard/media',
    icon: QrCode,
    match: (pathname: string) => pathname === '/dashboard/media',
  },
  {
    label: 'Messagerie',
    href: '/dashboard/messages',
    icon: MessageSquareText,
    match: (pathname: string) => pathname === '/dashboard/messages',
  },
  {
    label: 'Configuration',
    href: '/dashboard/setup',
    icon: Settings,
    match: (pathname: string) => pathname === '/dashboard/setup',
  },
  {
    label: 'Explorer',
    href: '/search',
    icon: Search,
    match: (pathname: string) => pathname === '/search',
  },
];

export default function DashboardShell({
  title,
  subtitle,
  actions,
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [entityName, setEntityName] = useState('Woralink');
  const [entityMeta, setEntityMeta] = useState('Dashboard');
  const [entityLogoUrl, setEntityLogoUrl] = useState('');

  const activeNav = useMemo(
    () => navItems.find((item) => item.match(pathname))?.label ?? 'Apercu',
    [pathname],
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsSidebarOpen(false);
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    let mounted = true;

    const loadEntityIdentity = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted || !user) return;

      const { data } = await supabase
        .from('companies')
        .select('name, sector, logo_url')
        .eq('user_id', user.id)
        .maybeSingle<{ name: string | null; sector: string | null; logo_url: string | null }>();

      if (!mounted || !data) return;

      setEntityName((data.name || 'Woralink').trim() || 'Woralink');
      setEntityMeta((data.sector || 'Dashboard').trim() || 'Dashboard');
      setEntityLogoUrl(data.logo_url || '');
    };

    void loadEntityIdentity();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-600 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-300">
      <div
        className={`fixed inset-0 z-30 bg-white/80 backdrop-blur-sm transition-opacity duration-150 dark:bg-slate-950/80 lg:hidden ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 border-r border-gray-200 bg-white transition-transform duration-150 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5">
          <Link href="/" className="flex items-center gap-3 text-gray-900 dark:text-slate-100">
            <span
              className={`inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold ${
                entityLogoUrl
                  ? 'border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                  : 'bg-green-50 text-green-700'
              }`}
              style={
                entityLogoUrl
                  ? {
                      backgroundImage: `url(${entityLogoUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {!entityLogoUrl ? (entityName.charAt(0) || 'W').toUpperCase() : null}
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
                {entityName}
              </p>
              <p className="text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
                {entityMeta}
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
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
                      ? 'bg-green-50 font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 border-t border-gray-100 pt-5 dark:border-slate-800">
            <Link
              href="/comment-ca-marche"
              onClick={() => setIsSidebarOpen(false)}
              className="block rounded-xl border border-gray-200 bg-gray-50 p-4 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-sm font-semibold text-green-700">
                  <CircleHelp className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 transition-colors duration-200 dark:text-slate-100">
                    Aide ?
                  </p>
                  <p className="truncate text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
                    Voir comment ca marche
                  </p>
                </div>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Deconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors duration-150 hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 lg:hidden"
              aria-label="Ouvrir la navigation"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors duration-200 dark:text-slate-400">
                {activeNav}
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-slate-100">
                {title}
              </h1>
              {subtitle ? (
                <p className="hidden text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:block">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {actions ? <div className="hidden items-center gap-2 sm:flex">{actions}</div> : <div />}
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
