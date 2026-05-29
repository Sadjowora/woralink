'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

const GUINEA_CITIES = [
  'Conakry',
  'Labé',
  'Kankan',
  "N'Zérékoré",
  'Kindia',
  'Mamou',
  'Boké',
  'Faranah',
];
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
const PROFILE_TYPES = ['PME', 'Startup', 'Freelance', 'Artisan'] as const;
const QUICK_LINKS = [
  'Plomberie',
  'Menuiserie',
  'Assurance',
  'Livraison',
  'Électricité',
  'Nettoyage',
] as const;

type SearchFiltersProps = {
  city?: string;
  sector?: string;
  type?: string;
};

export default function SearchFilters({ city = '', sector = '', type = '' }: SearchFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateParam = (key: 'city' | 'sector' | 'q' | 'type', value: string) => {
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
    const next = new URLSearchParams(searchParams.toString());
    next.delete('city');
    next.delete('sector');
    next.delete('type');
    next.delete('q');

    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div className="space-y-3 md:sticky md:top-20">
      <section className="rounded-lg border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 transition-colors duration-200 dark:text-slate-500">
          Quick Links
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => updateParam('q', item)}
              className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-500 transition-colors duration-200 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-4 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-gray-400 transition-colors duration-200 dark:text-slate-500">
          Filtres
        </p>

        <div className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor="city"
              className="block text-xs font-medium text-gray-600 transition-colors duration-200 dark:text-slate-400"
            >
              Ville
            </label>
            <select
              id="city"
              name="city"
              value={city}
              onChange={(e) => updateParam('city', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-200 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
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
            <label
              htmlFor="sector"
              className="block text-xs font-medium text-gray-600 transition-colors duration-200 dark:text-slate-400"
            >
              Secteur d&apos;activité
            </label>
            <select
              id="sector"
              name="sector"
              value={sector}
              onChange={(e) => updateParam('sector', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-200 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Tous les secteurs</option>
              {SECTORS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="type"
              className="block text-xs font-medium text-gray-600 transition-colors duration-200 dark:text-slate-400"
            >
              Type de profil
            </label>
            <select
              id="type"
              name="type"
              value={type}
              onChange={(e) => updateParam('type', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 transition-colors duration-200 focus:border-green-700 focus:outline-none focus:ring-2 focus:ring-green-700/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Tous les profils</option>
              {PROFILE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={clearAll}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-500 transition-colors duration-200 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Effacer les filtres
        </button>
      </section>
    </div>
  );
}
