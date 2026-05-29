'use client';

import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import SearchFilters from './SearchFilters';

const CITY_QUICK_LINKS = [
  'Conakry',
  'Kindia',
  'Labé',
  'Kankan',
  'Mamou',
  'Nzérékoré',
  'Boké',
  'Faranah',
] as const;

type SearchResultsShellProps = {
  children: React.ReactNode;
  city: string;
  sector: string;
  type: string;
  q: string;
  sort: 'relevance' | 'views' | 'verified';
  resultsCount: number;
  errorMessage?: string;
};

export default function SearchResultsShell({
  children,
  city,
  sector,
  type,
  q,
  sort,
  resultsCount,
  errorMessage,
}: SearchResultsShellProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const getCityHref = (nextCity: string) => {
    const params = new URLSearchParams();

    if (q.trim()) params.set('q', q.trim());
    if (sector.trim()) params.set('sector', sector.trim());
    if (sort !== 'relevance') params.set('sort', sort);
    params.set('city', nextCity);

    return `/search?${params.toString()}`;
  };

  const isCityActive = (candidateCity: string) => {
    return city.trim().toLowerCase() === candidateCity.toLowerCase();
  };

  const getSortHref = (nextSort: 'relevance' | 'views' | 'verified') => {
    const params = new URLSearchParams();

    if (q.trim()) params.set('q', q.trim());
    if (city.trim()) params.set('city', city.trim());
    if (sector.trim()) params.set('sector', sector.trim());
    if (nextSort !== 'relevance') params.set('sort', nextSort);

    const query = params.toString();
    return query ? `/search?${query}` : '/search';
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start">
      <aside
        className={`${filtersOpen ? 'block' : 'hidden'} w-full shrink-0 md:sticky md:top-20 md:block md:w-64`}
      >
        <SearchFilters city={city} sector={sector} type={type} />
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:mb-5 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <form action="/search" method="get" className="w-full flex-1">
              {city ? <input type="hidden" name="city" value={city} /> : null}
              {sector ? <input type="hidden" name="sector" value={sector} /> : null}
              {type ? <input type="hidden" name="type" value={type} /> : null}
              {sort !== 'relevance' ? <input type="hidden" name="sort" value={sort} /> : null}
              <div className="relative">
                <button
                  type="submit"
                  aria-label="Rechercher"
                  className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors duration-200 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-200"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>
                <input
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Rechercher une activité, une ville, une adresse (ex: boulangerie sonfonia, électricien Labé)..."
                  className="h-11 w-full rounded-lg border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 transition-colors duration-200 placeholder:text-gray-400 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500"
                />
              </div>
            </form>

            <button
              type="button"
              onClick={() => setFiltersOpen((current) => !current)}
              aria-expanded={filtersOpen}
              aria-controls="search-filters-panel"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors duration-200 hover:border-gray-300 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white md:hidden"
            >
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:mt-4 sm:text-sm">
            <p>
              <span className="font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                {resultsCount}
              </span>{' '}
              résultat
              {resultsCount > 1 ? 's' : ''}
            </p>
            {city || sector || type ? (
              <p className="hidden text-right text-gray-400 transition-colors duration-200 dark:text-slate-500 sm:block">
                {city ? `Ville: ${city}` : null}
                {city && sector ? ' · ' : null}
                {sector ? `Secteur: ${sector}` : null}
                {(city || sector) && type ? ' · ' : null}
                {type ? `Type: ${type}` : null}
              </p>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 transition-colors duration-200 dark:border-slate-800">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors duration-200 dark:text-slate-400">
              Tri
            </span>
            {[
              { label: 'Pertinence', value: 'relevance' as const },
              { label: 'Plus vus', value: 'views' as const },
              { label: 'Verifies', value: 'verified' as const },
            ].map((option) => {
              const active = sort === option.value;
              return (
                <Link
                  key={option.value}
                  href={getSortHref(option.value)}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-200 ${
                    active
                      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'border-gray-200 bg-gray-100 text-gray-500 hover:border-green-200 hover:text-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:text-green-400'
                  }`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3 transition-colors duration-200 dark:border-slate-800">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors duration-200 dark:text-slate-400">
                Quick Links Villes
              </p>
              <div className="flex flex-wrap gap-1.5 sm:justify-end sm:gap-2">
                {CITY_QUICK_LINKS.map((cityQuickLink) =>
                  (() => {
                    const active = isCityActive(cityQuickLink);
                    return (
                      <Link
                        key={cityQuickLink}
                        href={getCityHref(cityQuickLink)}
                        aria-current={active ? 'page' : undefined}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200 ${
                          active
                            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'border-gray-200 bg-gray-100 text-gray-500 hover:border-green-200 hover:text-green-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-green-700 dark:hover:text-green-400'
                        }`}
                      >
                        {cityQuickLink}
                      </Link>
                    );
                  })(),
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          id="search-filters-panel"
          className={`${filtersOpen ? 'mb-4 block' : 'hidden'} md:hidden`}
        >
          <SearchFilters city={city} sector={sector} type={type} />
        </div>

        {errorMessage ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 transition-colors duration-200 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {errorMessage}
          </div>
        ) : null}

        {children}
      </main>
    </div>
  );
}
