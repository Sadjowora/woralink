'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const GUINEA_CITIES = ['Conakry', 'Kindia', 'Labé', 'Kankan', 'Mamou', 'Nzérékoré'];
const SECTORS = ['BTP', 'Informatique', 'Artisanat', 'Commerce', 'Santé'];

type SearchFiltersProps = {
	city?: string;
	sector?: string;
	q?: string;
};

export default function SearchFilters({ city = '', sector = '', q = '' }: SearchFiltersProps) {
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
		<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4 md:sticky md:top-6">
			<h2 className="font-semibold tracking-tighter text-primary">Filtres</h2>

			<div className="space-y-1">
				<label htmlFor="q" className="block text-sm font-medium text-gray-700">
					Nom de l&apos;entreprise
				</label>
				<input
					id="q"
					name="q"
					type="text"
					defaultValue={q}
					placeholder="Ex: Tech Guinée"
					onChange={(e) => updateParam('q', e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
				/>
			</div>

			<div className="space-y-1">
				<label htmlFor="city" className="block text-sm font-medium text-gray-700">
					Ville
				</label>
				<select
					id="city"
					name="city"
					value={city}
					onChange={(e) => updateParam('city', e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
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
				<label htmlFor="sector" className="block text-sm font-medium text-gray-700">
					Secteur d&apos;activité
				</label>
				<select
					id="sector"
					name="sector"
					value={sector}
					onChange={(e) => updateParam('sector', e.target.value)}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
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
				className="w-full rounded-md border border-primary bg-white py-2 text-center font-medium text-primary transition-colors hover:bg-primary/5"
			>
				Effacer les filtres
			</button>
		</div>
	);
}
