import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import CompanyCard from '../../components/company/CompanyCard';
import Navbar from '../../components/layout/Navbar';
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
};

type SearchPageProps = {
	searchParams: Promise<{
		city?: string;
		sector?: string;
		q?: string;
	}>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
	const { city = '', sector = '', q = '' } = await searchParams;

	const cityFilter = resolveCityFilter(city);
	const sectorFilter = resolveSectorFilter(sector);
	const queryFilter = q.trim();

	let query = supabase.from('companies').select('*, profiles(*)');
	if (cityFilter) query = query.ilike('city', `%${escapeLikePattern(cityFilter)}%`);
	if (sectorFilter) query = query.eq('sector', sectorFilter);
	if (queryFilter) {
		const escapedQuery = escapeLikePattern(queryFilter);
		query = query.or([
			`name.ilike.%${escapedQuery}%`,
			`sector.ilike.%${escapedQuery}%`,
			`city.ilike.%${escapedQuery}%`,
		].join(','));
	}

	const { data, error } = await query;
	const companies = ((data as Company[]) || []);
	const hasResults = !error && companies.length > 0;

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col">
			<Navbar />

			<div className="max-w-7xl mx-auto w-full px-4 py-6 sm:py-8 flex-1">
				<div className="mb-4 sm:mb-6">
					<h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter text-primary">Rechercher un professionnel</h1>
					<p className="text-xs sm:text-sm text-gray-500 mt-1">
						Utilisez les filtres URL pour trouver rapidement un profil.
					</p>
				</div>

				<SearchResultsShell
					city={cityFilter}
					sector={sectorFilter}
					q={queryFilter}
					resultsCount={companies.length}
					errorMessage={error ? 'Impossible de charger les résultats. Réessayez.' : undefined}
				>
					{hasResults ? (
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
							{companies.map((company) => (
								<Link key={company.id} href={`/pme/${company.slug}`} className="block w-full">
									<CompanyCard
										name={company.name}
										profileType={company.profile_type}
										sector={company.sector}
										city={company.city}
										logoUrl={company.logo_url}
										isVerified={Boolean(company.is_verified)}
									/>
								</Link>
							))}
						</div>
					) : (
						<div className="py-12 sm:py-16">
							<div className="mx-auto max-w-2xl rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm sm:p-8">
								<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-2xl text-blue-600 sm:mb-4 sm:h-16 sm:w-16 sm:text-3xl">
									🔍
								</div>
								<h2 className="mb-2 text-lg font-semibold tracking-tighter text-primary sm:text-xl">
									Aucun professionnel trouvé dans cette zone
								</h2>
								<p className="mb-4 text-xs text-gray-600 sm:mb-6 sm:text-sm">
									Vous êtes basé{cityFilter ? ` à ${cityFilter}` : ' en Guinée'} et vous proposez des services ?
									 Rejoignez Woralink pour être visible auprès de vos futurs clients.
								</p>
								<Link
									href="/register"
									className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:px-6 sm:py-3"
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
