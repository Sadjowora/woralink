import Link from 'next/link';
import { computeProfileCompletionPercent } from '../../../lib/company-completion';
import { supabase } from '../../../lib/supabase';
import Navbar from '../../components/layout/Navbar';
import FeaturedCompaniesSidebar from './FeaturedCompaniesSidebar';
import SearchListItem from './SearchListItem';
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

type FeaturedCompany = {
  id: string;
  name: string;
  city: string;
  sector: string;
  slug: string;
  viewsCount: number;
  bravosCount: number;
};

type FeaturedAnalyticsRow = {
  slot: 'company_of_day' | 'champion_of_week' | 'pme_of_month';
  company_id: string;
  company_name: string;
  city: string | null;
  sector: string | null;
  slug: string;
  views_24h: number | null;
  bravos_7d: number | null;
  views_30d: number | null;
  bravos_30d: number | null;
};

function mapFeaturedCompany(company: Company): FeaturedCompany {
  return {
    id: company.id,
    name: company.name,
    city: company.city,
    sector: company.sector,
    slug: company.slug,
    viewsCount: Math.max(0, Number(company.views_count ?? 0) || 0),
    bravosCount: Math.max(0, Number(company.bigup ?? 0) || 0),
  };
}

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
  const featuredAnalyticsPromise = supabase.rpc('get_featured_companies_analytics');

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

  const byViews = [...companies].sort(
    (a, b) => (Number(b.views_count ?? 0) || 0) - (Number(a.views_count ?? 0) || 0),
  );
  const byBravos = [...companies].sort(
    (a, b) => (Number(b.bigup ?? 0) || 0) - (Number(a.bigup ?? 0) || 0),
  );

  const fallbackCompanyOfTheDay = byViews[0] ? mapFeaturedCompany(byViews[0]) : null;
  const fallbackChampionOfWeek = byBravos[0] ? mapFeaturedCompany(byBravos[0]) : null;

  const excludedIds = new Set(
    [fallbackCompanyOfTheDay?.id, fallbackChampionOfWeek?.id].filter(Boolean),
  );
  const comboCandidates = companies.filter((company) => !excludedIds.has(company.id));
  const fallbackPmeOfMonthSource =
    comboCandidates.sort((a, b) => {
      const aViews = Number(a.views_count ?? 0) || 0;
      const bViews = Number(b.views_count ?? 0) || 0;
      const aBravos = Number(a.bigup ?? 0) || 0;
      const bBravos = Number(b.bigup ?? 0) || 0;

      const aScore = aViews + aBravos * 20;
      const bScore = bViews + bBravos * 20;

      return bScore - aScore;
    })[0] ??
    byViews[0] ??
    null;

  const fallbackPmeOfMonth = fallbackPmeOfMonthSource
    ? mapFeaturedCompany(fallbackPmeOfMonthSource)
    : null;

  const { data: featuredAnalyticsData } = await featuredAnalyticsPromise;
  const featuredAnalyticsRows = (featuredAnalyticsData as FeaturedAnalyticsRow[] | null) ?? [];
  const analyticsBySlot = new Map(featuredAnalyticsRows.map((row) => [row.slot, row]));

  const analyticsCompanyOfDay = analyticsBySlot.get('company_of_day');
  const analyticsChampionOfWeek = analyticsBySlot.get('champion_of_week');
  const analyticsPmeOfMonth = analyticsBySlot.get('pme_of_month');

  const companyOfTheDay = analyticsCompanyOfDay
    ? {
        id: analyticsCompanyOfDay.company_id,
        name: analyticsCompanyOfDay.company_name,
        city: analyticsCompanyOfDay.city ?? 'Guinée',
        sector: analyticsCompanyOfDay.sector ?? 'Secteur non précisé',
        slug: analyticsCompanyOfDay.slug,
        viewsCount: Math.max(0, Number(analyticsCompanyOfDay.views_24h ?? 0) || 0),
        bravosCount: Math.max(0, Number(analyticsCompanyOfDay.bravos_7d ?? 0) || 0),
      }
    : fallbackCompanyOfTheDay;

  const championOfWeek = analyticsChampionOfWeek
    ? {
        id: analyticsChampionOfWeek.company_id,
        name: analyticsChampionOfWeek.company_name,
        city: analyticsChampionOfWeek.city ?? 'Guinée',
        sector: analyticsChampionOfWeek.sector ?? 'Secteur non précisé',
        slug: analyticsChampionOfWeek.slug,
        viewsCount: Math.max(0, Number(analyticsChampionOfWeek.views_24h ?? 0) || 0),
        bravosCount: Math.max(0, Number(analyticsChampionOfWeek.bravos_7d ?? 0) || 0),
      }
    : fallbackChampionOfWeek;

  const pmeOfMonth = analyticsPmeOfMonth
    ? {
        id: analyticsPmeOfMonth.company_id,
        name: analyticsPmeOfMonth.company_name,
        city: analyticsPmeOfMonth.city ?? 'Guinée',
        sector: analyticsPmeOfMonth.sector ?? 'Secteur non précisé',
        slug: analyticsPmeOfMonth.slug,
        viewsCount: Math.max(0, Number(analyticsPmeOfMonth.views_30d ?? 0) || 0),
        bravosCount: Math.max(0, Number(analyticsPmeOfMonth.bravos_30d ?? 0) || 0),
      }
    : fallbackPmeOfMonth;

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
    <div className="flex min-h-screen flex-col bg-gray-50 transition-colors duration-200 dark:bg-slate-950">
      <Navbar />

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white md:text-3xl">
            Rechercher un professionnel
          </h1>
          <p className="mt-1 text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
              <div className="space-y-3 sm:space-y-4 lg:col-span-8">
                {companies.map((company, index) => (
                  <SearchListItem key={company.id} company={company} index={index} />
                ))}
              </div>

              <FeaturedCompaniesSidebar
                companyOfTheDay={companyOfTheDay}
                championOfWeek={championOfWeek}
                pmeOfMonth={pmeOfMonth}
              />
            </div>
          ) : (
            <div className="py-12 sm:py-16">
              <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-5 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-colors duration-200 dark:bg-slate-800 dark:text-slate-400 sm:h-14 sm:w-14">
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
                <h2 className="mb-2 text-lg font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white sm:text-xl">
                  Aucun professionnel trouvé dans cette zone
                </h2>
                <p className="mb-6 text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
                  Vous êtes basé{cityFilter ? ` à ${cityFilter}` : ' en Guinée'} et vous proposez
                  des services ? Rejoignez Woralink pour être visible auprès de vos futurs clients.
                </p>

                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href={buildQuickHref({ city: 'Conakry' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:bg-slate-700 dark:hover:text-green-400"
                  >
                    Conakry
                  </Link>
                  <Link
                    href={buildQuickHref({ sector: 'Construction & BTP' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:bg-slate-700 dark:hover:text-green-400"
                  >
                    BTP
                  </Link>
                  <Link
                    href={buildQuickHref({ sector: 'Santé & Pharmacie' })}
                    className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-200 hover:border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:bg-slate-700 dark:hover:text-green-400"
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
