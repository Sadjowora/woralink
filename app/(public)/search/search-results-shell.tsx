'use client';

import Link from 'next/link';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import SearchFilters from './SearchFilters';

const CITY_QUICK_LINKS = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Nzérékoré', 'Boké', 'Faranah'] as const;

type SearchResultsShellProps = {
	children: React.ReactNode;
	city: string;
	sector: string;
	q: string;
	resultsCount: number;
	errorMessage?: string;
};

export default function SearchResultsShell({
	children,
	city,
	sector,
	q,
	resultsCount,
	errorMessage,
}: SearchResultsShellProps) {
	const [filtersOpen, setFiltersOpen] = useState(false);

	const getCityHref = (nextCity: string) => {
		const params = new URLSearchParams();

		if (q.trim()) params.set('q', q.trim());
		if (sector.trim()) params.set('sector', sector.trim());
		params.set('city', nextCity);

		return `/search?${params.toString()}`;
	};

	const isCityActive = (candidateCity: string) => {
		return city.trim().toLowerCase() === candidateCity.toLowerCase();
	};

	return (
		<div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-start">
			<aside className={`${filtersOpen ? 'block' : 'hidden'} w-full shrink-0 md:sticky md:top-20 md:block md:w-64`}>
				<SearchFilters city={city} sector={sector} />
			</aside>

			<main className="min-w-0 flex-1">
				<div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:mb-5 sm:p-4">
					<div className="flex items-center gap-2 sm:gap-3">
						<form action="/search" method="get" className="w-full flex-1">
							{city ? <input type="hidden" name="city" value={city} /> : null}
							{sector ? <input type="hidden" name="sector" value={sector} /> : null}
							<div className="relative">
								<button
									type="submit"
									aria-label="Rechercher"
									className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:text-gray-700"
								>
									<Search className="h-4.5 w-4.5" />
								</button>
								<input
									name="q"
									type="search"
									defaultValue={q}
									placeholder="Rechercher une entreprise, un secteur ou une ville"
									className="h-11 w-full rounded-xl border border-black/10 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-300/60"
								/>
							</div>
						</form>

						<button
							type="button"
							onClick={() => setFiltersOpen((current) => !current)}
							aria-expanded={filtersOpen}
							aria-controls="search-filters-panel"
							className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 md:hidden"
						>
							<SlidersHorizontal className="h-4.5 w-4.5" />
						</button>
					</div>

					<div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500 sm:mt-4 sm:text-sm">
						<p>
							{resultsCount} resultat{resultsCount > 1 ? 's' : ''}
						</p>
						{(city || sector) ? (
							<p className="hidden text-right text-gray-400 sm:block">
								{city ? `Ville: ${city}` : null}
								{city && sector ? ' · ' : null}
								{sector ? `Secteur: ${sector}` : null}
							</p>
						) : null}
					</div>

					<div className="mt-3 border-t border-gray-100 pt-3">
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
							<p className="text-[11px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
								Quick Links Villes
							</p>
							<div className="flex flex-wrap gap-1.5 sm:justify-end sm:gap-2">
								{CITY_QUICK_LINKS.map((cityQuickLink) => (
									(() => {
										const active = isCityActive(cityQuickLink);
										return (
									<Link
										key={cityQuickLink}
										href={getCityHref(cityQuickLink)}
										aria-current={active ? 'page' : undefined}
										className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors sm:text-xs ${
											active
												? 'border-primary/40 bg-primary/10 text-primary'
												: 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-primary'
										}`}
									>
										{cityQuickLink}
									</Link>
										);
									})()
								))}
							</div>
						</div>
					</div>
				</div>

				<div id="search-filters-panel" className={`${filtersOpen ? 'mb-4 block' : 'hidden'} md:hidden`}>
					<SearchFilters city={city} sector={sector} />
				</div>

				{errorMessage ? (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
						{errorMessage}
					</div>
				) : null}

				{children}
			</main>
		</div>
	);
}