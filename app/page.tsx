import type { Metadata } from 'next';
import Image from 'next/image';
import NextLink from 'next/link';
import { supabase } from '../lib/supabase';
import CoupDeCoeur from './components/CoupDeCoeur';
import SearchListItem from './(public)/search/SearchListItem';
import HeroSection from './components/home/HeroSection';
import ProCTASection from './components/home/ProCTASection';
import Navbar from './components/layout/Navbar';

export const metadata: Metadata = {
  title: "Woralink | L'annuaire des professionnels en Guinée",
  description:
    'Trouvez rapidement des PME, startups, artisans et freelances en Guinée. Explorez des profils locaux par ville et secteur pour contacter les meilleurs professionnels près de chez vous.',
};

export const revalidate = 60;

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  address?: string | null;
  slug: string;
  logo_url?: string;
  company_story?: string | null;
  views_count?: number | null;
  bigup?: number | null;
  is_verified?: boolean | null;
};

type TrendingGalleryItem = {
  url: string;
  slug: string;
  name: string;
};

type CoupDeCoeurCompany = {
  id: string;
  name: string;
  sector: string;
  city: string;
  slug: string;
  logo_url?: string | null;
  views_count?: number | null;
  company_story?: string | null;
  founder_message?: string | null;
};

const POPULAR_CATEGORIES = [
  { label: 'BTP', sector: 'Construction & BTP', icon: '🏗️' },
  { label: 'Numérique', sector: 'Tech & Numérique', icon: '💻' },
  { label: 'Artisanat', sector: 'Artisanat & Art', icon: '🎨' },
  { label: 'Santé', sector: 'Santé & Pharmacie', icon: '🩺' },
  { label: 'Transport', sector: 'Transport & Logistique', icon: '🚚' },
];

export default async function Home() {
  const { data, error } = await supabase
    .from('companies')
    .select(
      'id, name, profile_type, sector, city, address, company_story, slug, logo_url, bigup, views_count, is_verified',
    )
    .order('created_at', { ascending: false })
    .limit(5);

  const featuredCompanies: Company[] = error ? [] : ((data as Company[]) ?? []);

  // Coup de Cœur: top views, fallback to most recent with photo
  let coupDeCoeur: (CoupDeCoeurCompany & { photo_url?: string | null }) | null = null;
  {
    const { data: topViewed } = await supabase
      .from('companies')
      .select('id, name, sector, city, slug, logo_url, views_count, company_story, founder_message')
      .not('logo_url', 'is', null)
      .order('views_count', { ascending: false })
      .limit(1)
      .single();

    if (topViewed && (topViewed.views_count ?? 0) > 0) {
      const { data: photo } = await supabase
        .from('company_photos')
        .select('url')
        .eq('company_id', topViewed.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      coupDeCoeur = { ...topViewed, photo_url: photo?.url ?? null };
    } else {
      // fallback: most recently registered company with a logo
      const { data: recent } = await supabase
        .from('companies')
        .select(
          'id, name, sector, city, slug, logo_url, views_count, company_story, founder_message',
        )
        .not('logo_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (recent) {
        const { data: photo } = await supabase
          .from('company_photos')
          .select('url')
          .eq('company_id', recent.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        coupDeCoeur = { ...recent, photo_url: photo?.url ?? null };
      }
    }
  }

  const { data: trendItemsData, error: trendItemsError } = await supabase.rpc(
    'get_trending_items',
    {
      sample_size: 12,
    },
  );

  if (trendItemsError) {
    console.error('[Home/Tendances] Erreur RPC get_trending_items:', trendItemsError.message);
  }

  const trendingGalleryItems: TrendingGalleryItem[] =
    (trendItemsData as TrendingGalleryItem[]) ?? [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <HeroSection />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        <div className="mb-4 flex items-end justify-between sm:mb-6">
          <h2 className="text-lg font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
            Secteurs populaires
          </h2>
          <NextLink
            href="/search"
            className="text-xs font-medium text-primary hover:text-primary/80 sm:text-sm"
          >
            Voir tout
          </NextLink>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-5">
          {POPULAR_CATEGORIES.map((category) => (
            <NextLink
              key={category.label}
              href={`/search?sector=${encodeURIComponent(category.sector)}`}
              className="group rounded-xl border border-gray-200 bg-white p-3 text-center transition-all hover:border-primary hover:shadow-sm sm:rounded-2xl sm:p-5 sm:hover:shadow-md"
            >
              <div className="mb-1.5 text-2xl sm:mb-2 sm:text-3xl">{category.icon}</div>
              <p className="line-clamp-2 text-xs font-semibold text-gray-800 group-hover:text-primary sm:text-sm">
                {category.label}
              </p>
            </NextLink>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16 md:pb-20">
        <div className="mb-4 flex items-end justify-between sm:mb-6">
          <h2 className="text-lg font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
            Dernières entreprises
          </h2>
          <NextLink
            href="/search"
            className="text-xs font-medium text-primary hover:text-primary/80 sm:text-sm"
          >
            Voir les resultats
          </NextLink>
        </div>

        {featuredCompanies.length > 0 ? (
          <div className="space-y-4 sm:space-y-5">
            <div className="space-y-3 sm:space-y-4">
              {featuredCompanies.map((company, index) => (
                <SearchListItem key={company.id} company={company} index={index} compact />
              ))}
            </div>

            <NextLink
              href="/search"
              className="group flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-5 py-4 transition-all duration-150 hover:border-green-700 hover:bg-white hover:shadow-sm sm:px-6 sm:py-5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors duration-150 group-hover:text-green-700">
                  Explorer davantage
                </p>
                <p className="mt-1 text-base font-semibold tracking-tight text-gray-900 sm:text-lg">
                  Découvrir plus de professionnels partout en Guinée
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  PME, startups, artisans et freelances vérifiés vous attendent.
                </p>
              </div>

              <span className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 group-hover:bg-green-800">
                Voir toute la sélection
                <span
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </span>
            </NextLink>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center sm:p-8">
            <p className="text-gray-600">
              Aucune entreprise affichée pour le moment. Soyez le premier à rejoindre Woralink.
            </p>
            <NextLink
              href="/register"
              className="mt-4 inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90 sm:py-2.5"
            >
              Créer mon profil
            </NextLink>
          </div>
        )}
      </section>

      <ProCTASection />

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 md:pb-24">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
            Tendances
          </h2>
          <p className="mt-2 text-xs text-gray-600 sm:text-sm">
            Découvrez les dernières réalisations d&apos;artisans et PME proches de vous.
          </p>
        </div>

        {trendingGalleryItems.length > 0 ? (
          <div className="columns-2 gap-4 space-y-4 md:columns-3 lg:columns-4">
            {trendingGalleryItems.map((item, index) => (
              <div key={`${item.slug}-${item.url}-${index}`} className="break-inside-avoid">
                <NextLink
                  href={`/pme/${item.slug}`}
                  className="group relative block overflow-hidden rounded-xl border border-gray-200"
                >
                  <Image
                    src={item.url}
                    alt={`Réalisation de ${item.name}`}
                    width={1000}
                    height={1200}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="h-auto w-full object-cover"
                  />
                  <div className="bg-linear-to-t pointer-events-none absolute inset-x-0 bottom-0 from-black/60 via-black/20 to-transparent px-3 py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="line-clamp-1 text-xs font-medium text-white">{item.name}</p>
                  </div>
                </NextLink>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {coupDeCoeur && (
        <div className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="mb-4 flex items-end justify-between sm:mb-6">
            <div>
              <h2 className="text-lg font-bold tracking-tighter text-primary sm:text-2xl md:text-3xl">
                Coup de Cœur
              </h2>
              <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                L&apos;entreprise qui fait parler d&apos;elle cette semaine.
              </p>
            </div>
          </div>
        </div>
      )}
      {coupDeCoeur && (
        <CoupDeCoeur
          name={coupDeCoeur.name}
          sector={coupDeCoeur.sector}
          city={coupDeCoeur.city}
          slug={coupDeCoeur.slug}
          logoUrl={coupDeCoeur.logo_url}
          photoUrl={coupDeCoeur.photo_url}
          viewsCount={coupDeCoeur.views_count ?? 0}
          description={coupDeCoeur.company_story ?? coupDeCoeur.founder_message ?? null}
        />
      )}
    </div>
  );
}
