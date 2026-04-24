'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FaEye } from 'react-icons/fa';
import { QRCodeCanvas } from 'qrcode.react';
import DashboardTabs from '../components/dashboard/DashboardTabs';
import ShareProfile from '../components/ShareProfile';
import { supabase } from '../../lib/supabase';

type Company = {
  id: string;
  name: string;
  sector: string;
  city: string;
  slug: string;
  profile_type: string;
  views_count?: number | null;
  address?: string | null;
  website_url?: string | null;
};

export default function DashboardPage() {
  const [checking, setChecking] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [viewsIncreased, setViewsIncreased] = useState(false);
  const [error, setError] = useState('');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
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
          .select('id, name, sector, city, slug, profile_type, views_count, address, website_url')
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

  if (checking) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardTabs />
        <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
          <div className="rounded-md border border-gray-200 bg-white p-8">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              Verification de votre espace professionnel...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardTabs />
      <div className="mx-auto w-full px-0 py-2 sm:px-4 sm:py-8 lg:w-3/4">
        <div className="w-full rounded-none border-0 bg-white p-2 transition-colors sm:rounded-md sm:border sm:border-primary/20 sm:p-8 sm:hover:border-primary">

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Vue d&apos;ensemble</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary">Votre présence sur Woralink</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {company
              ? 'Votre fiche est active. Vous pouvez mettre à jour vos informations, enrichir votre galerie et vérifier la page publique visible par vos visiteurs.'
              : 'Votre fiche entreprise n\'est pas encore finalisée. Complétez votre profil pour apparaître dans l\'annuaire Woralink.'}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Statut</p>
              <p className="mt-2 text-3xl font-medium tracking-tighter text-black">{company ? 'En ligne' : 'À configurer'}</p>
            </div>
            <div className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Ville</p>
              <p className="mt-2 text-3xl font-medium tracking-tighter text-black">{company?.city || 'Non renseignee'}</p>
            </div>
            <div className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Secteur</p>
              <p className="mt-2 text-3xl font-medium tracking-tighter text-black">{company?.sector || 'Non renseigne'}</p>
            </div>
          </div>
        </section>

        <section className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Actions rapides</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary">Gérer ma fiche</h2>

          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard/profile?mode=edit"
              className="flex items-center justify-between rounded-md bg-primary px-5 py-4 text-white transition-colors hover:bg-primary/90"
            >
              <span>
                <span className="block text-sm text-gray-300">Mise à jour</span>
                <span className="block text-base font-semibold">Modifier mon profil</span>
              </span>
              <span className="text-xl">→</span>
            </Link>

            <Link
              href={company ? `/pme/${company.slug}` : '/dashboard/profile'}
              className="flex items-center justify-between rounded-md border border-primary bg-white px-5 py-4 text-primary transition-colors hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm text-gray-500">Visibilité</span>
                <span className="block text-base font-semibold">Voir ma page publique</span>
              </span>
              <span className="text-xl">→</span>
            </Link>

            <Link
              href="/dashboard/gallery"
              className="flex items-center justify-between rounded-md border border-primary bg-white px-5 py-4 text-primary transition-colors hover:bg-primary/5"
            >
              <span>
                <span className="block text-sm text-gray-500">Galerie</span>
                <span className="block text-base font-semibold">Gérer la galerie</span>
              </span>
              <span className="text-xl">→</span>
            </Link>

            {company && publicProfileUrl && (
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="flex w-full items-center justify-between rounded-md border border-primary bg-white px-5 py-4 text-left text-primary transition-colors hover:bg-primary/5"
              >
                <span>
                  <span className="block text-sm text-gray-500">Impression</span>
                    <span className="block text-base font-semibold">Générer mon QR Code</span>
                </span>
                <span className="text-xl">→</span>
              </button>
            )}
          </div>
        </section>

        <section className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary lg:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Fiche entreprise</p>
              <h3 className="mt-2 text-xl font-semibold text-black">
                {company ? company.name : 'Aucune fiche encore publiée'}
              </h3>
            </div>

            <Link
              href="/dashboard/profile"
              className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Ouvrir mon profil
            </Link>
            <Link
              href="/dashboard/gallery"
              className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Gérer ma galerie
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Nom</p>
              <p className="mt-2 text-base font-semibold text-black">{company?.name || 'À renseigner'}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Type</p>
              <p className="mt-2 text-base font-semibold text-black">{company?.profile_type || 'À renseigner'}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Ville</p>
              <p className="mt-2 text-base font-semibold text-black">{company?.city || 'À renseigner'}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Secteur</p>
              <p className="mt-2 text-base font-semibold text-black">{company?.sector || 'À renseigner'}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Adresse</p>
              <p className="mt-2 text-base font-semibold text-black line-clamp-2">{company?.address || 'À renseigner'}</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Site web</p>
              {company?.website_url ? (
                <a
                  href={company.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-primary hover:underline"
                >
                  Visiter
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <p className="mt-2 text-base font-semibold text-black">À renseigner</p>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary lg:col-span-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Statistiques</p>
              <h3 className="mt-2 text-xl font-semibold text-black">Performance de votre profil</h3>
            </div>
            <div className="inline-flex items-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3">
              <span className="rounded-md bg-primary/10 p-2 text-primary">
                <FaEye className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Total vues</p>
                <p className="text-3xl font-medium tracking-tighter text-black">{company?.views_count ?? 0}</p>
              </div>
            </div>
          </div>

          {viewsIncreased && (
            <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Votre profil gagne en visibilité ! Continuez à l&apos;enrichir pour attirer encore plus de visiteurs.
            </p>
          )}
        </section>

        {company && publicProfileUrl && (
          <section className="lg:col-span-2">
            <ShareProfile
              companyName={company.name}
              profileUrl={publicProfileUrl}
              message="Partagez votre vitrine professionnelle pour attirer plus de clients !"
            />
          </section>
        )}
      </div>
        </div>
      </div>

      {isQrModalOpen && company && publicProfileUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-label="Mon QR Code"
        >
          <div className="w-full max-w-md rounded-md border border-gray-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500">Partage rapide</p>
                <h3 className="mt-2 text-xl font-semibold text-black">QR Code de votre profil</h3>
                <p className="mt-2 text-sm text-gray-600">Scannez ce code pour ouvrir votre vitrine Woralink.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="rounded-md border border-primary bg-white px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/5"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 flex justify-center rounded-md border border-gray-200 bg-white p-4">
              <QRCodeCanvas
                id="woralink-company-qrcode"
                value={publicProfileUrl}
                size={220}
                level="H"
                fgColor="#059669"
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
                className="inline-flex items-center justify-center rounded-md border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Imprimer mon QR Code
              </button>
              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Télécharger mon QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}