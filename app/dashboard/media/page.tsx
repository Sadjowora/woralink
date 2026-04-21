'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import DashboardTabs from '../../components/dashboard/DashboardTabs';
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
        setError(err instanceof Error ? err.message : 'Impossible de charger vos médias.');
      } finally {
        setChecking(false);
      }
    };

    void loadMedia();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-white">
        <DashboardTabs />
        <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
          <div className="rounded-md border border-gray-200 bg-white p-8">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-600">
              Chargement de vos médias...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardTabs />
      <div className="mx-auto w-full px-4 py-8 lg:w-3/4">
        <div className="w-full rounded-md border border-primary/20 bg-white p-8 transition-colors hover:border-primary">
          {error && (
            <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary">
          <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Synthèse média</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tighter text-primary">Votre identité visuelle</h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {company
              ? 'Mettez en avant votre logo et vos meilleures photos pour inspirer confiance et améliorer votre page publique.'
              : 'Créez d\'abord votre fiche entreprise pour commencer à publier vos médias sur Woralink.'}
          </p>

          <div className="mt-6 overflow-hidden rounded-md border border-gray-200">
            <ul className="tabular-nums">
              <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                <span className="text-xs uppercase tracking-widest text-gray-500">Entreprise</span>
                <span className="text-sm font-medium text-gray-900 text-right">{company?.name || 'À renseigner'}</span>
              </li>
              <li className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-3 hover:bg-gray-50">
                <span className="text-xs uppercase tracking-widest text-gray-500">Ville</span>
                <span className="text-sm font-medium text-gray-900 text-right">{company?.city || 'À renseigner'}</span>
              </li>
              <li className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50">
                <span className="text-xs uppercase tracking-widest text-gray-500">Secteur</span>
                <span className="text-sm font-medium text-gray-900 text-right">{company?.sector || 'À renseigner'}</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 space-y-3">
            <Link
              href="/dashboard/profile?focus=gallery&mode=edit"
              className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
            >
              Ajouter des photos
            </Link>
            <Link
              href="/dashboard/profile?mode=edit"
              className="inline-flex w-full items-center justify-center rounded-md border border-primary bg-white px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Modifier le logo et le profil
            </Link>
            <Link
              href={company ? `/pme/${company.slug}` : '/dashboard/profile'}
              className="inline-flex w-full items-center justify-center rounded-md border border-primary bg-white px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
            >
              Voir ma page publique
            </Link>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Logo</p>
                <h3 className="mt-2 text-xl font-semibold text-black">Logo de votre entreprise</h3>
              </div>
              <span className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                {company?.logo_url ? 'Ajouté' : 'En attente'}
              </span>
            </div>

            <div className="mt-5 flex min-h-48 items-center justify-center rounded-md border border-gray-200 bg-gray-50 p-6">
              {company?.logo_url ? (
                <Image
                  src={company.logo_url}
                  alt={`Logo ${company.name}`}
                  width={180}
                  height={180}
                  className="h-auto max-h-40 w-auto object-contain"
                />
              ) : (
                <p className="text-sm text-gray-500">Aucun logo ajouté pour le moment.</p>
              )}
            </div>
          </div>

          <div className="rounded-md border border-primary/20 bg-white p-6 transition-colors hover:border-primary">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Galerie</p>
                <h3 className="mt-2 text-xl font-semibold text-black">Photos de votre fiche</h3>
              </div>
              <span className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 tabular-nums">
                {galleryUrls.length}/5 photos
              </span>
            </div>

            {galleryUrls.length > 0 ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryUrls.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative h-32 overflow-hidden rounded-md bg-gray-50">
                    <Image
                      src={url}
                      alt={`Photo ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">
                Aucune photo disponible pour le moment. Ajoutez une galerie complète pour améliorer votre présentation.
              </div>
            )}
          </div>
        </section>
      </div>
        </div>
      </div>
    </div>
  );
}