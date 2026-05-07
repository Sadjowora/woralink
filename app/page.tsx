import type { Metadata } from 'next';
import Image from 'next/image';
import NextLink from 'next/link';
import { supabase } from '../lib/supabase';
import CompanyCard from './components/company/CompanyCard';
import CoupDeCoeur from './components/CoupDeCoeur';
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
  slug: string;
  logo_url?: string;
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
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

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
        .select('id, name, sector, city, slug, logo_url, views_count, company_story, founder_message')
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

  const { data: trendItemsData, error: trendItemsError } = await supabase.rpc('get_trending_items', {
    sample_size: 12,
  });

  if (trendItemsError) {
    console.error('[Home/Tendances] Erreur RPC get_trending_items:', trendItemsError.message);
  }

  const trendingGalleryItems: TrendingGalleryItem[] = (trendItemsData as TrendingGalleryItem[]) ?? [];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="relative border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-20 pb-16 sm:pt-28 md:pt-36 md:pb-32 text-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
            Plateforme locale de confiance
          </span>

          <h1 className="mt-6 sm:mt-8 text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tighter text-gray-900">
            Trouvez les meilleures PME, startups, artisans et freelances de Guinée
          </h1>

          <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-sm sm:text-base md:text-lg leading-relaxed text-gray-600">
            Découvrez des professionnels vérifiés près de chez vous, comparez rapidement les profils
            et contactez-les facilement. Woralink vous aide à choisir en toute confiance.
          </p>

          <form action="/search" method="GET" className="mx-auto mt-10 max-w-2xl">
            <input
              type="text"
              name="q"
              placeholder="Nom d'entreprise, service ou secteur..."
              className="w-full rounded-md border border-gray-200 bg-white px-3 sm:px-4 py-2.5 sm:py-3.5 text-xs sm:text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <NextLink href="/search" className="w-full sm:w-auto rounded-md border border-gray-300 bg-white px-4 py-2.5 sm:py-2 text-gray-700 transition-colors hover:bg-gray-100 font-medium">
               Explorer tous les profils
            </NextLink>
            <NextLink href="/register" className="w-full sm:w-auto rounded-md bg-primary px-4 py-2.5 sm:py-2 text-white transition-colors hover:bg-primary/90 font-medium">
               Rejoindre Woralink 
            </NextLink>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Secteurs populaires</h2>
          <NextLink href="/search" className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium">
            Voir tout
          </NextLink>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
          {POPULAR_CATEGORIES.map((category) => (
            <NextLink
              key={category.label}
              href={`/search?sector=${encodeURIComponent(category.sector)}`}
              className="group rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-5 text-center hover:border-primary hover:shadow-sm sm:hover:shadow-md transition-all"
            >
              <div className="text-2xl sm:text-3xl mb-1.5 sm:mb-2">{category.icon}</div>
              <p className="font-semibold text-xs sm:text-sm text-gray-800 group-hover:text-primary line-clamp-2">{category.label}</p>
            </NextLink>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16 md:pb-20">
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Dernières entreprises</h2>
          <NextLink href="/search" className="text-xs sm:text-sm text-primary hover:text-primary/80 font-medium">
            Voir les resultats
          </NextLink>
        </div>

        {featuredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCompanies.map((company, index) => (
              <NextLink key={company.id} href={`/pme/${company.slug}`}>
                <CompanyCard
                  name={company.name}
                  profileType={company.profile_type}
                  sector={company.sector}
                  city={company.city}
                  logoUrl={company.logo_url}
                  isVerified={Boolean(company.is_verified)}
                  imageLoading={index === 0 ? 'eager' : 'lazy'}
                />
              </NextLink>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-8 text-center">
            <p className="text-gray-600">
              Aucune entreprise affichée pour le moment. Soyez le premier à rejoindre Woralink.
            </p>
            <NextLink href="/register" className="mt-4 inline-block rounded-md bg-primary px-5 py-2 sm:py-2.5 font-medium text-sm text-white transition-colors hover:bg-primary/90">
             Créer mon profil
            </NextLink>
          </div>
        )}
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20 md:pb-24">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Tendances</h2>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">
            Découvrez les dernières réalisations d&apos;artisans et PME proches de vous.
          </p>
        </div>

        {trendingGalleryItems.length > 0 ? (
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
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
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 via-black/20 to-transparent px-3 py-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="line-clamp-1 text-xs font-medium text-white">{item.name}</p>
                  </div>
                </NextLink>
              </div>
            ))}
          </div>
        ) : null}
      </section>
      
      {coupDeCoeur && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex items-end justify-between mb-4 sm:mb-6">
            <div>
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Coup de Cœur</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">L&apos;entreprise qui fait parler d&apos;elle cette semaine.</p>
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
