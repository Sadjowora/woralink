import Link from 'next/link';
import { Eye, Flame, Handshake, Trophy } from 'lucide-react';

type FeaturedCompany = {
  id: string;
  name: string;
  city: string;
  sector: string;
  slug: string;
  viewsCount: number;
  bravosCount: number;
};

type FeaturedCompaniesSidebarProps = {
  companyOfTheDay: FeaturedCompany | null;
  championOfWeek: FeaturedCompany | null;
  pmeOfMonth: FeaturedCompany | null;
};

function formatCount(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(Math.max(0, value));
}

function fallbackCompanyLabel(company: FeaturedCompany | null): string {
  if (company) return company.name;
  return 'Aucune entreprise pour le moment';
}

function buildHref(company: FeaturedCompany | null): string {
  if (!company?.id) return '/search';
  return `/companies/${company.id}`;
}

export default function FeaturedCompaniesSidebar({
  companyOfTheDay,
  championOfWeek,
  pmeOfMonth,
}: FeaturedCompaniesSidebarProps) {
  return (
    <aside className="hidden lg:col-span-4 lg:block">
      <div className="sticky top-6 space-y-6">
        <Link
          href={buildHref(companyOfTheDay)}
          className="block rounded-xl border border-green-200 bg-white p-5 transition-colors duration-200 hover:border-green-300 hover:shadow-sm dark:border-green-800 dark:bg-slate-900 dark:hover:border-green-700"
        >
          <span className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            TENDANCE FLASH
          </span>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                🌟 L&apos;Entreprise du Jour
              </p>
              <h3 className="mt-1 text-base font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                {fallbackCompanyLabel(companyOfTheDay)}
              </h3>
              <p className="mt-1 text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
                {companyOfTheDay?.city ?? 'Guinée'}
              </p>
            </div>
            <Flame className="h-5 w-5 shrink-0 text-green-700" aria-hidden="true" />
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors duration-200 dark:text-slate-300">
            <Eye className="h-4 w-4 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            {formatCount(companyOfTheDay?.viewsCount ?? 0)} vues cette info
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
            Découvrez le profil le plus consulté aujourd&apos;hui !
          </p>
        </Link>

        <Link
          href={buildHref(championOfWeek)}
          className="block rounded-xl border border-gray-200 bg-white p-5 transition-colors duration-200 hover:border-gray-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <span className="inline-flex items-center rounded-full border border-gray-300 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            TOP BRAVOS
          </span>
          <div className="mt-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                🏆 Le Champion de la Semaine
              </p>
              <h3 className="mt-1 text-base font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                {fallbackCompanyLabel(championOfWeek)}
              </h3>
              <p className="mt-1 text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
                {championOfWeek?.sector ?? 'Secteur non précisé'}
              </p>
            </div>
            <Trophy
              className="h-5 w-5 shrink-0 text-gray-500 dark:text-slate-400"
              aria-hidden="true"
            />
          </div>
          <p className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gray-700 transition-colors duration-200 dark:text-slate-300">
            <Handshake className="h-4 w-4 text-gray-500 dark:text-slate-400" aria-hidden="true" />
            {formatCount(championOfWeek?.bravosCount ?? 0)} Bravos cette semaine
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
            Encouragez cette entreprise avec votre coup de pouce.
          </p>
        </Link>

        <Link
          href={buildHref(pmeOfMonth)}
          className="block rounded-xl border border-gray-200 bg-gray-50 p-5 transition-colors duration-200 hover:border-gray-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
        >
          <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            LA VALEUR SURE
          </span>
          <div className="mt-3">
            <p className="text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
              🔥 La PME du Mois
            </p>
            <h3 className="mt-1 text-base font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
              {fallbackCompanyLabel(pmeOfMonth)}
            </h3>
          </div>
          <p className="mt-4 text-sm font-medium text-gray-700 transition-colors duration-200 dark:text-slate-300">
            👁️ {formatCount(pmeOfMonth?.viewsCount ?? 0)} vues • 👊{' '}
            {formatCount(pmeOfMonth?.bravosCount ?? 0)} Bravos
          </p>
          <p className="mt-2 text-xs leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
            Une entreprise qui confirme sa popularité avec un excellent équilibre visibilité et
            confiance.
          </p>
        </Link>
      </div>
    </aside>
  );
}
