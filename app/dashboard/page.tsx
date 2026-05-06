'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Eye,
  Globe,
  ImageIcon,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  QrCode,
  Search,
  Settings,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Company = {
  id: string;
  name: string;
  sector: string;
  city: string;
  slug: string;
  profile_type: string;
  is_verified?: boolean | null;
  views_count?: number | null;
  address?: string | null;
  website_url?: string | null;
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  isActive?: boolean;
};

type StatusBadgeTone = 'brand' | 'muted';

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const navItems: NavItem[] = [
  { label: 'Apercu', href: '/dashboard', icon: LayoutDashboard, isActive: true },
  { label: 'Profil', href: '/dashboard/profile', icon: UserRound },
  { label: 'Galerie', href: '/dashboard/gallery', icon: ImageIcon },
  { label: 'Media', href: '/dashboard/media', icon: QrCode },
  { label: 'Configuration', href: '/dashboard/setup', icon: Settings },
  { label: 'Explorer', href: '/search', icon: Search },
];

function StatusBadge({ label, tone }: { label: string; tone: StatusBadgeTone }) {
  const toneClassName = tone === 'brand'
    ? 'border-green-200 bg-green-50 text-green-700'
    : 'border-gray-200 bg-gray-100 text-gray-500';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClassName}`}>
      {label}
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [viewsIncreased, setViewsIncreased] = useState(false);
  const [error, setError] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copiedProfileLink, setCopiedProfileLink] = useState(false);

  const publicProfileUrl = useMemo(() => {
    if (!company?.slug) return '';

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
    if (siteUrl) {
      return `${siteUrl}/pme/${company.slug}`;
    }

    if (typeof window !== 'undefined') {
      return `${window.location.origin}/pme/${company.slug}`;
    }

    return `/pme/${company.slug}`;
  }, [company?.slug]);

  const shareMessage = useMemo(() => {
    if (!company?.name || !publicProfileUrl) return '';
    return `Bonjour ! Decouvrez le profil de ${company.name} sur Woralink : ${publicProfileUrl}`;
  }, [company?.name, publicProfileUrl]);

  const whatsappHref = useMemo(
    () => (shareMessage ? `https://wa.me/?text=${encodeURIComponent(shareMessage)}` : '#'),
    [shareMessage]
  );

  const facebookHref = useMemo(
    () => (publicProfileUrl ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicProfileUrl)}` : '#'),
    [publicProfileUrl]
  );

  const handleCopyProfileLink = useCallback(async () => {
    if (!publicProfileUrl) return;

    try {
      await navigator.clipboard.writeText(publicProfileUrl);
      setCopiedProfileLink(true);
      window.setTimeout(() => setCopiedProfileLink(false), 1800);
    } catch {
      setCopiedProfileLink(false);
    }
  }, [publicProfileUrl]);

  const handleDownloadQrCode = useCallback(() => {
    if (!company?.slug) return;

    const canvas = document.getElementById('woralink-company-qrcode') as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `qrcode-${company.slug}.png`;
    link.click();
  }, [company?.slug]);

  const handlePrintQrCode = useCallback(() => {
    const canvas = document.getElementById('woralink-company-qrcode') as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const companyName = company?.name || 'Woralink';
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code ${companyName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 32px; text-align: center; }
            img { width: 320px; height: 320px; }
            h1 { margin: 0 0 12px; font-size: 20px; }
            p { margin: 8px 0 0; color: #555; word-break: break-all; }
          </style>
        </head>
        <body>
          <h1>${companyName}</h1>
          <img src="${dataUrl}" alt="QR Code ${companyName}" />
          <p>${publicProfileUrl}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [company?.name, publicProfileUrl]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsSidebarOpen(false);
    router.push('/');
    router.refresh();
  }, [router]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setChecking(false);
          return;
        }

        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, sector, city, slug, profile_type, is_verified, views_count, address, website_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (companyError) throw companyError;

        const nextCompany = (companyData as Company | null) ?? null;
        setCompany(nextCompany);

        if (nextCompany?.id) {
          const storageKey = `woralink:last_views:${nextCompany.id}`;
          const currentViews = Number(nextCompany.views_count ?? 0);
          const previousRaw = window.localStorage.getItem(storageKey);

          if (previousRaw !== null) {
            const previousViews = Number(previousRaw);
            setViewsIncreased(Number.isFinite(previousViews) && currentViews > previousViews);
          }

          window.localStorage.setItem(storageKey, String(currentViews));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger votre dashboard.');
      } finally {
        setChecking(false);
      }
    };

    void loadDashboard();
  }, []);

  const statusLabel = company ? 'Actif' : 'En attente';
  const verificationLabel = company?.is_verified ? 'Verifie' : 'En attente';
  const companyName = company?.name || 'Votre entreprise';
  const companyInitial = companyName.charAt(0).toUpperCase() || 'W';

  const statCards = [
    {
      label: 'Vues du profil',
      value: String(company?.views_count ?? 0),
      hint: viewsIncreased ? 'Visibilite en hausse' : 'Suivi en temps reel',
      icon: Eye,
    },
    {
      label: 'Statut de fiche',
      value: statusLabel,
      hint: company ? 'Votre page publique est accessible' : 'Completez votre fiche pour publier',
      icon: Building2,
    },
    {
      label: 'Ville',
      value: company?.city || 'Non renseignee',
      hint: 'Zone principale de visibilite',
      icon: MapPin,
    },
    {
      label: 'Verification',
      value: verificationLabel,
      hint: company?.is_verified ? 'Badge de confiance actif' : 'Validation en attente',
      icon: BadgeCheck,
    },
  ];

  const profileRows = [
    { label: 'Nom', value: company?.name || 'A renseigner' },
    { label: 'Type', value: company?.profile_type || 'A renseigner' },
    { label: 'Ville', value: company?.city || 'A renseigner' },
    { label: 'Secteur', value: company?.sector || 'A renseigner' },
    { label: 'Adresse', value: company?.address || 'A renseigner' },
  ];

  const actionRows = [
    { label: 'Modifier mon profil', href: '/dashboard/profile?mode=edit', meta: 'Mettez a jour vos informations' },
    { label: 'Voir ma page publique', href: company ? `/pme/${company.slug}` : '/dashboard/profile', meta: 'Controlez le rendu visible' },
    { label: 'Gerer la galerie', href: '/dashboard/gallery', meta: 'Ajoutez des photos a votre vitrine' },
    { label: 'Finaliser la configuration', href: '/dashboard/setup', meta: 'Ajustez vos informations essentielles' },
  ];

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
              const activeClassName = item.isActive
                ? 'bg-green-50 text-green-700 font-medium'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150 ${activeClassName}`}
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
                  {companyInitial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{companyName}</p>
                  <p className="truncate text-xs text-gray-500">Espace professionnel</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
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
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Vue d&apos;ensemble</p>
              <h1 className="text-lg font-semibold tracking-tight text-gray-900">Tableau de bord</h1>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <Link
              href={company ? `/pme/${company.slug}` : '/dashboard/profile'}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
            >
              Voir ma fiche
            </Link>
            <Link
              href="/dashboard/profile?mode=edit"
              className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
            >
              Modifier le profil
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {checking ? (
            <div className="rounded-xl border border-gray-200 bg-white p-8">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500">
                Verification de votre espace professionnel...
              </div>
            </div>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
              {error && (
                <motion.div variants={fadeInUp} className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                  {error}
                </motion.div>
              )}

              <motion.section variants={staggerContainer} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <motion.div
                      key={card.label}
                      variants={fadeInUp}
                      className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow duration-150 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">{card.label}</p>
                          <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{card.value}</p>
                          <p className="mt-2 text-xs font-medium text-green-700">{card.hint}</p>
                        </div>
                        <span className="rounded-lg bg-green-50 p-2 text-green-700">
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
                <motion.section variants={fadeInUp} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Fiche entreprise</p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">{companyName}</h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {company
                            ? 'Votre vitrine est prete a recevoir du trafic local. Gardez vos informations a jour pour inspirer confiance.'
                            : 'Finalisez votre fiche pour apparaitre dans l annuaire Woralink.'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge label={statusLabel} tone={company ? 'brand' : 'muted'} />
                        <StatusBadge label={verificationLabel} tone={company?.is_verified ? 'brand' : 'muted'} />
                      </div>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                    Informations principales
                  </div>
                  <div>
                    {profileRows.map((row, index) => (
                      <div
                        key={row.label}
                        className={`flex flex-col gap-2 px-5 py-4 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between ${index === profileRows.length - 1 ? '' : 'border-b border-gray-50'}`}
                      >
                        <span className="font-medium text-gray-500">{row.label}</span>
                        <span className="max-w-xl text-gray-900 sm:text-right">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-2 px-5 py-4 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-medium text-gray-500">Site web</span>
                      {company?.website_url ? (
                        <a
                          href={company.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 hover:underline sm:justify-end"
                        >
                          <Globe className="h-4 w-4" aria-hidden="true" />
                          Ouvrir le site
                        </a>
                      ) : (
                        <span className="text-gray-900">A renseigner</span>
                      )}
                    </div>
                  </div>
                </motion.section>

                <div className="space-y-6">
                  <motion.section variants={fadeInUp} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Actions rapides</p>
                      <h2 className="mt-2 text-lg font-semibold text-gray-900">Gerer ma presence</h2>
                    </div>
                    <div>
                      {actionRows.map((action, index) => (
                        <Link
                          key={action.label}
                          href={action.href}
                          className={`flex items-center justify-between gap-4 px-5 py-4 text-sm text-gray-600 transition-colors duration-150 hover:bg-gray-50 ${index === actionRows.length - 1 ? '' : 'border-b border-gray-50'}`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{action.label}</p>
                            <p className="mt-1 text-sm text-gray-500">{action.meta}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                        </Link>
                      ))}
                    </div>
                  </motion.section>

                  <motion.section variants={fadeInUp} className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow duration-150 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Performance</p>
                        <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{company?.views_count ?? 0}</p>
                        <p className="mt-2 text-xs font-medium text-green-700">
                          {viewsIncreased ? 'Votre fiche gagne en visibilite.' : 'Continuez a enrichir votre profil pour accelerer la decouverte.'}
                        </p>
                      </div>
                      <span className="rounded-lg bg-green-50 p-2 text-green-700">
                        <Eye className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </div>
                  </motion.section>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                <motion.section variants={fadeInUp} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Diffusion</p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900">Partager votre profil</h2>
                  </div>

                  <div className="px-5 py-4">
                    <p className="text-sm text-gray-600">
                      Envoyez votre lien public pour attirer des clients depuis WhatsApp, Facebook ou un simple copier-coller.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
                      >
                        Partager sur WhatsApp
                      </a>
                      <a
                        href={facebookHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
                      >
                        Partager sur Facebook
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyProfileLink}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
                      >
                        {copiedProfileLink ? 'Lien copie' : 'Copier le lien'}
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="truncate text-sm text-gray-500">{publicProfileUrl || 'Votre lien public apparaitra ici.'}</p>
                    </div>
                  </div>
                </motion.section>

                <motion.section variants={fadeInUp} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <div className="border-b border-gray-100 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">QR Code</p>
                    <h2 className="mt-2 text-lg font-semibold text-gray-900">Impression et diffusion locale</h2>
                  </div>

                  <div className="px-5 py-4">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Code de partage</p>
                          <p className="mt-1 text-sm text-gray-500">Affichez-le sur vos supports pour rediriger vos visiteurs vers votre vitrine.</p>
                        </div>
                        <span className="rounded-lg bg-green-50 p-2 text-green-700">
                          <QrCode className="h-5 w-5" aria-hidden="true" />
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => setIsQrModalOpen(true)}
                          disabled={!company || !publicProfileUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Voir le QR Code
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadQrCode}
                          disabled={!company || !publicProfileUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Telecharger
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      {isQrModalOpen && company && publicProfileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Mon QR Code">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Partage rapide</p>
                <h3 className="mt-2 text-xl font-semibold tracking-tight text-gray-900">QR Code de votre profil</h3>
                <p className="mt-2 text-sm text-gray-600">Scannez ce code pour ouvrir votre vitrine Woralink.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 flex justify-center rounded-xl border border-gray-200 bg-gray-50 p-5">
              <QRCodeCanvas
                id="woralink-company-qrcode"
                value={publicProfileUrl}
                size={220}
                level="H"
                fgColor="#15803d"
                bgColor="#FFFFFF"
                includeMargin
                imageSettings={{
                  src: '/logowlink.png',
                  width: 42,
                  height: 42,
                  excavate: true,
                }}
              />
            </div>

            <p className="mt-3 truncate text-center text-xs text-gray-500">{publicProfileUrl}</p>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handlePrintQrCode}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
              >
                Imprimer
              </button>
              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
              >
                Telecharger le QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}