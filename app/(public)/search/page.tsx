import Link from 'next/link';
import { computeProfileCompletionPercent } from '../../../lib/company-completion';
import { supabase } from '../../../lib/supabase';
import Navbar from '../../components/layout/Navbar';
import SearchListItem from './SearchListItem';
import SimilarCompaniesRail from './SimilarCompaniesRail';
import SearchResultsShell from './search-results-shell';
const SECTORS = [
  'Commerce & Distribution',
  'Agriculture & Élevage',
  'Construction & BTP',
  'Restauration & Hôtellerie',
  'Transport & Logistique',
  'Santé & Pharmacie',
  'Éducation & Formation',
  'Finance & Assurance',
  'Tech & Numérique',
  'Mode & Textile',
  'Médias & Communication',
  'Artisanat & Art',
  'Énergie & Environnement',
  'Consultations & Services',
  'Logement & Immobilier',
  'Livraison & Domicile',
  'Autre',
] as const;

const GUINEA_CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Nzérékoré'] as const;

function escapeLikePattern(value: string): string {
  return value.replace(/[%_]/g, (char) => `\\${char}`);
}

function resolveCityFilter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const match = GUINEA_CITIES.find((city) => city.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

function resolveSectorFilter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const match = SECTORS.find((sector) => sector.toLowerCase() === trimmed.toLowerCase());
  return match ?? trimmed;
}

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  slug: string;
  logo_url?: string;
  is_verified?: boolean | null;
  views_count?: number | null;
  whatsapp?: string | null;
  website_url?: string | null;
  description?: string | null;
  company_story?: string | null;
  founder_message?: string | null;
  address?: string | null;
  bigup?: number | null;
};

type SearchPageProps = {
  searchParams: Promise<{
    city?: string;
    sector?: string;
    type?: string;
    q?: string;
    sort?: string;
  }>;
};

type SortOption = 'relevance' | 'views' | 'verified';

function resolveSort(value: string): SortOption {
  if (value === 'views') return 'views';
  if (value === 'verified') return 'verified';
  return 'relevance';
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { city = '', sector = '', type = '', q = '', sort = 'relevance' } = await searchParams;

  const cityFilter = resolveCityFilter(city);
  const sectorFilter = resolveSectorFilter(sector);
  const typeFilter = type.trim();
  const queryFilter = q.trim();
  const sortFilter = resolveSort(sort);

  let query = supabase
    .from('companies')
    .select(
      'id, name, profile_type, sector, city, slug, logo_url, is_verified, views_count, whatsapp, website_url, description, company_story, founder_message, address, bigup',
    )
    .order('views_count', { ascending: false, nullsFirst: false });
  if (cityFilter) query = query.ilike('city', `%${escapeLikePattern(cityFilter)}%`);
  if (sectorFilter) query = query.eq('sector', sectorFilter);
  if (typeFilter) query = query.eq('profile_type', typeFilter);
  if (queryFilter) {
    query = query.textSearch('fts_tokens', queryFilter, {
      config: 'french',
      type: 'websearch',
    });
  }

  const { data, error } = await query;
  const companies = ((data as Company[]) || []).sort((a, b) => {
    if (sortFilter === 'views') {
      return (b.views_count ?? 0) - (a.views_count ?? 0);
    }

    if (sortFilter === 'verified') {
      const verificationDiff = Number(Boolean(b.is_verified)) - Number(Boolean(a.is_verified));
      if (verificationDiff !== 0) return verificationDiff;
      return (b.views_count ?? 0) - (a.views_count ?? 0);
    }

    const aViews = a.views_count ?? 0;
    const bViews = b.views_count ?? 0;
    if (bViews !== aViews) return bViews - aViews;

    const completionDiff = computeProfileCompletionPercent(b) - computeProfileCompletionPercent(a);
    return completionDiff;
  });

  let similarQuery = supabase
    .from('companies')
    .select('id, name, profile_type, sector, city, slug, is_verified, views_count')
    .order('is_verified', { ascending: false })
    .order('views_count', { ascending: false, nullsFirst: false })
    .limit(10);

  if (sectorFilter) {
    similarQuery = similarQuery.eq('sector', sectorFilter);
  } else if (cityFilter) {
    similarQuery = similarQuery.ilike('city', `%${escapeLikePattern(cityFilter)}%`);
  } else if (companies[0]?.sector) {
    similarQuery = similarQuery.eq('sector', companies[0].sector);
  }

  const { data: similarData } = await similarQuery;
  const displayedIds = new Set(companies.map((item) => item.id));
  const similarCompanies = ((similarData as Company[]) || [])
    .filter((item) => !displayedIds.has(item.id))
    .slice(0, 6);

  const hasResults = !error && companies.length > 0;

  const buildQuickHref = (params: { city?: string; sector?: string; q?: string }) => {
    const next = new URLSearchParams();
    if (params.q) next.set('q', params.q);
    if (params.city) next.set('city', params.city);
    if (params.sector) next.set('sector', params.sector);
    const search = next.toString();
    return search ? `/search?${search}` : '/search';
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
            Rechercher un professionnel
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Trouvez des professionnels vérifiés partout en Guinée — PME, artisans, freelances et
            startups de confiance.
          </p>
        </div>

        <SearchResultsShell
          city={cityFilter}
          sector={sectorFilter}
          type={typeFilter}
          q={queryFilter}
          sort={sortFilter}
          resultsCount={companies.length}
          errorMessage={error ? 'Impossible de charger les résultats. Réessayez.' : undefined}
        >
          {hasResults ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.35fr)_240px] lg:gap-6">
              <div className="space-y-3 sm:space-y-4">
                {companies.map((company, index) => (
                  <SearchListItem key={company.id} company={company} index={index} />
                ))}
              </div>

              <SimilarCompaniesRail items={similarCompanies} />
            </div>
          ) : (
            <div className="py-12 sm:py-16">
              <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-5 text-center sm:p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500 sm:h-14 sm:w-14">
                  <svg
                    className="h-6 w-6 sm:h-7 sm:w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
                    />
                  </svg>
                </div>
                <h2 className="mb-2 text-lg font-semibold tracking-tight text-gray-900 sm:text-xl">
                  Aucun professionnel trouvé dans cette zone
                </h2>
                <p className="mb-6 text-sm text-gray-500">
                  Vous êtes basé{cityFilter ? ` à ${cityFilter}` : ' en Guinée'} et vous proposez
                  des services ? Rejoignez Woralink pour être visible auprès de vos futurs clients.
                </p>

                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href={buildQuickHref({ city: 'Conakry' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-150 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    Conakry
                  </Link>
                  <Link
                    href={buildQuickHref({ sector: 'Construction & BTP' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-150 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    BTP
                  </Link>
                  <Link
                    href={buildQuickHref({ sector: 'Santé & Pharmacie' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-150 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                  >
                    Santé
                  </Link>
                </div>

                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
                >
                  Inscrivez votre entreprise
                </Link>
              </div>
            </div>
          )}
        </SearchResultsShell>
      </div>
    </div>
  );
}
