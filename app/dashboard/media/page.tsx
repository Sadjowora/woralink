'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { supabase } from '../../../lib/supabase';

type Company = {
  id: string;
  name: string;
  city: string;
  sector: string;
  slug: string;
  logo_url?: string | null;
};

export default function DashboardMediaPage() {
  const [checking, setChecking] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMedia = async () => {
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
          .select('id, name, city, sector, slug, logo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (companyError) throw companyError;

        const resolvedCompany = (companyData as Company | null) ?? null;
        setCompany(resolvedCompany);

        if (!resolvedCompany?.id) {
          setGalleryUrls([]);
          return;
        }

        const { data: photosData, error: photosError } = await supabase
          .from('company_photos')
          .select('*')
          .eq('company_id', resolvedCompany.id);

        if (photosError) throw photosError;

        const urls = (photosData || [])
          .map((row: Record<string, unknown>) => {
            const value = row.photo_url ?? row.url;
            return typeof value === 'string' ? value : null;
          })
          .filter((url): url is string => Boolean(url))
          .slice(0, 5);

        setGalleryUrls(urls);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Impossible de charger votre espace visuel.');
      } finally {
        setChecking(false);
      }
    };

    void loadMedia();
  }, []);

  if (checking) {
    return (
      <DashboardShell title="Media" subtitle="Surveillez votre identite visuelle et vos photos.">
        <div className="rounded-xl border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Chargement de votre espace visuel...
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title="Media"
      subtitle="Pilotez logo, galerie et coherence visuelle de votre fiche."
      actions={
        <>
          <Link
            href="/dashboard/gallery"
            className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            Gerer la galerie
          </Link>
          <Link
            href="/dashboard/profile?mode=edit"
            className="inline-flex items-center justify-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
          >
            Modifier le profil
          </Link>
        </>
      }
    >
      <div className="w-full rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary dark:border-primary/30 dark:bg-slate-900 sm:p-6">
            <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
              Synthèse visuelle
            </p>
            <h2 className="mt-2 text-xl font-bold tracking-tighter text-primary sm:text-2xl">
              Votre identité visuelle
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-300 sm:text-sm">
              {company
                ? 'Mettez en avant votre logo et vos meilleures photos pour inspirer confiance et améliorer votre page publique.'
                : "Créez d'abord votre fiche entreprise pour commencer à publier votre galerie sur Woralink."}
            </p>

            <div className="mt-6 overflow-hidden rounded-md border border-gray-200 transition-colors duration-200 dark:border-slate-700">
              <ul className="tabular-nums">
                <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-xs">
                    Entreprise
                  </span>
                  <span className="text-right text-xs font-medium text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-sm">
                    {company?.name || 'À renseigner'}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50 dark:border-slate-800 dark:hover:bg-slate-800">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-xs">
                    Ville
                  </span>
                  <span className="text-right text-xs font-medium text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-sm">
                    {company?.city || 'À renseigner'}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800">
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-xs">
                    Secteur
                  </span>
                  <span className="text-right text-xs font-medium text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-sm">
                    {company?.sector || 'À renseigner'}
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-3">
              <Link
                href="/dashboard/gallery"
                className="inline-flex w-full items-center justify-center rounded-lg bg-green-700 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-green-800 sm:px-4 sm:py-3 sm:text-sm"
              >
                Gérer la galerie
              </Link>
              <Link
                href="/dashboard/profile?mode=edit"
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:px-4 sm:py-3 sm:text-sm"
              >
                Modifier mon profil
              </Link>
              <Link
                href={company ? `/pme/${company.slug}` : '/dashboard/profile'}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 sm:px-4 sm:py-3 sm:text-sm"
              >
                Voir ma page publique
              </Link>
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary dark:border-primary/30 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Logo
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-black sm:text-xl">
                    Logo de votre entreprise
                  </h3>
                </div>
                <span className="whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-3 sm:py-1 sm:text-xs">
                  {company?.logo_url ? 'Ajouté' : 'En attente'}
                </span>
              </div>

              <div className="mt-4 flex min-h-40 items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-4 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 sm:mt-5 sm:min-h-48 sm:p-6">
                {company?.logo_url ? (
                  <Image
                    src={company.logo_url}
                    alt={`Logo ${company.name}`}
                    width={180}
                    height={180}
                    className="h-auto max-h-40 w-auto object-contain"
                  />
                ) : (
                  <p className="text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
                    Aucun logo ajouté pour le moment.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-md border border-primary/20 bg-white p-4 transition-colors hover:border-primary dark:border-primary/30 dark:bg-slate-900 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-gray-500 transition-colors duration-200 dark:text-slate-300 sm:text-[10px]">
                    Galerie
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-black sm:text-xl">
                    Photos de votre fiche
                  </h3>
                </div>
                <span className="whitespace-nowrap rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-semibold tabular-nums text-gray-700 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 sm:px-3 sm:py-1 sm:text-xs">
                  {galleryUrls.length}/5 photos
                </span>
              </div>

              {galleryUrls.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:grid-cols-3 sm:gap-3">
                  {galleryUrls.map((url, index) => (
                    <div
                      key={`${url}-${index}`}
                      className="relative h-28 overflow-hidden rounded-md bg-gray-50 transition-colors duration-200 dark:bg-slate-800 sm:h-32"
                    >
                      <Image
                        src={url}
                        alt={`Photo ${index + 1}`}
                        fill
                        sizes="(max-width: 640px) calc(50vw - 8px), (max-width: 1024px) calc(33vw - 8px), 220px"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-4 text-xs text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:mt-5 sm:p-6 sm:text-sm">
                  Aucune photo disponible pour le moment. Ajoutez une galerie complète pour
                  améliorer votre présentation.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
