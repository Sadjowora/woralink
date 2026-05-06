'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const GUINEA_CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Nzérékoré'];
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
];
const QUICK_LINKS: Array<{ label: string; sector: string }> = [
	{ label: 'Plomberie', sector: 'Construction & BTP' },
	{ label: 'Menuiserie', sector: 'Artisanat & Art' },
	{ label: 'Assurance', sector: 'Finance & Assurance' },
	{ label: 'Livraison', sector: 'Livraison & Domicile' },
	{ label: 'Électricité', sector: 'Énergie & Environnement' },
	{ label: 'Nettoyage', sector: 'Consultations & Services' },
];

type SearchFiltersProps = {
	city?: string;
	sector?: string;
};

export default function SearchFilters({ city = '', sector = '' }: SearchFiltersProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const updateParam = (key: 'city' | 'sector' | 'q', value: string) => {
		const next = new URLSearchParams(searchParams.toString());

		if (value.trim()) {
			next.set(key, value.trim());
		} else {
			next.delete(key);
		}

		const query = next.toString();
		router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
	};

	const clearAll = () => {
		router.replace(pathname, { scroll: false });
	};

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 space-y-3 sm:space-y-4 md:sticky md:top-20">
			<h2 className="text-base font-semibold tracking-tight text-gray-900">Filtres</h2>

			<div className="pt-1">
				<p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">Quick Links</p>
				<div className="flex flex-wrap gap-1.5 sm:gap-2">
					{QUICK_LINKS.map((item) => (
						<button
							key={item.label}
							type="button"
							onClick={() => updateParam('sector', item.sector)}
							className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-150 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
						 >
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="space-y-1">
				<label htmlFor="city" className="block text-xs font-medium text-gray-700">
					Ville
				</label>
				<select
					id="city"
					name="city"
					value={city}
					onChange={(e) => updateParam('city', e.target.value)}
					className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
				 >
					<option value="">Toutes les villes</option>
					{GUINEA_CITIES.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>

			<div className="space-y-1">
				<label htmlFor="sector" className="block text-xs font-medium text-gray-700">
					Secteur d&apos;activité
				</label>
				<select
					id="sector"
					name="sector"
					value={sector}
					onChange={(e) => updateParam('sector', e.target.value)}
					className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20"
				>
					<option value="">Tous les secteurs</option>
					{SECTORS.map((item) => (
						<option key={item} value={item}>
							{item}
						</option>
					))}
				</select>
			</div>

			<button
				type="button"
				onClick={clearAll}
				className="inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white py-2 text-xs font-medium text-gray-700 transition-colors duration-150 hover:bg-gray-50 hover:border-gray-300"
			 >
				Effacer les filtres
			</button>
		</div>
	);
}
