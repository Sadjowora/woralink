import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import CompanyCard from '../../components/company/CompanyCard';
import Navbar from '../../components/layout/Navbar';
import SearchFilters from './SearchFilters';

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

	const cityFilter = city.trim();
	const sectorFilter = sector.trim();
	const queryFilter = q.trim();

	let query = supabase.from('companies').select('*, profiles(*)');
	if (cityFilter) query = query.eq('city', cityFilter);
	if (sectorFilter) query = query.eq('sector', sectorFilter);
	if (queryFilter) query = query.ilike('name', `%${queryFilter}%`);

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

				<div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
					<aside className="w-full md:w-64 shrink-0 md:sticky md:top-20">
						<SearchFilters city={cityFilter} sector={sectorFilter} q={queryFilter} />
					</aside>

					<main className="flex-1 min-w-0">
						{error && (
							<div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
								Impossible de charger les résultats. Réessayez.
							</div>
						)}

						{hasResults ? (
							<>
								<p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
									{companies.length} résultat{companies.length > 1 ? 's' : ''}
								</p>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
									{companies.map((company) => (
										<Link key={company.id} href={`/pme/${company.slug}`}>
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
							</>
						) : (
							<div className="py-12 sm:py-16">
								<div className="max-w-2xl mx-auto rounded-2xl border border-blue-100 bg-white shadow-sm p-5 sm:p-8 text-center">
									<div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4">
										🔍
									</div>
									<h2 className="mb-2 text-lg sm:text-xl font-semibold tracking-tighter text-primary">
										Aucun professionnel trouvé dans cette zone
									</h2>
									<p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
										Vous êtes basé{cityFilter ? ` à ${cityFilter}` : ' en Guinée'} et vous proposez des services ?
										 Rejoignez Woralink pour être visible auprès de vos futurs clients.
									</p>
									<Link
										href="/register"
										className="inline-flex items-center justify-center rounded-md bg-primary px-5 sm:px-6 py-2 sm:py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
									>
										Inscrivez votre entreprise
									</Link>
								</div>
							</div>
						)}
					</main>
				</div>
			</div>
		</div>
	);
}
