import Link from 'next/link';
import Image from 'next/image';
import BigUpButton from './BigUpButton';

type SearchListItemProps = {
  company: {
    id: string;
    name: string;
    profile_type: string;
    sector: string;
    city: string;
    slug: string;
    logo_url?: string | undefined;
    is_verified?: boolean | null;
    address?: string | null;
    description?: string | null;
    company_story?: string | null;
    views_count?: number | null;
    bigup?: number | null;
  };
  index: number;
  compact?: boolean;
};

function getSnippet(company: SearchListItemProps['company']) {
  const base = company.company_story || company.description || '';
  return base.trim();
}

export default function SearchListItem({ company, index, compact = false }: SearchListItemProps) {
  const snippet = getSnippet(company);
  const rank = index + 1;
  const profileType = company.profile_type;
  const viewsCount = Math.max(0, Number(company.views_count ?? 0) || 0);
  const cardPadding = compact ? 'p-4' : 'p-5';
  const footerPadding = compact ? 'px-4 py-2.5' : 'px-5 py-3';

  const typeBadgeClass =
    profileType === 'PME'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : profileType === 'Freelance'
        ? 'border-green-200 bg-green-50 text-green-700'
        : profileType === 'Artisan'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-gray-200 bg-gray-100 text-gray-500';

  return (
    <article className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-none">
      <div className="bg-linear-to-r pointer-events-none absolute inset-0 from-green-50/0 via-green-50/40 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 dark:via-green-900/20" />
      <Link
        href={`/pme/${company.slug}`}
        className="absolute inset-0 z-10 rounded-xl"
        aria-label={`Ouvrir le profil de ${company.name}`}
      />

      <div className={`relative z-0 flex items-start gap-4 ${cardPadding}`}>
        <div className="flex min-w-10 flex-col items-center pt-1">
          <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 transition-colors duration-200 group-hover:text-green-700 dark:text-slate-500 dark:group-hover:text-green-400">
            RANG
          </span>
          <span className="text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
            #{rank}
          </span>
        </div>

        <div className="h-13 w-13 relative shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50 transition-all duration-200 group-hover:border-green-200 group-hover:bg-green-50 dark:border-slate-700 dark:bg-slate-800 dark:group-hover:border-green-700 dark:group-hover:bg-slate-700">
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={`Logo ${company.name}`}
              fill
              sizes="52px"
              className="object-cover transition-transform duration-150 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-gray-500 transition-colors duration-200 group-hover:text-green-700 dark:text-slate-300 dark:group-hover:text-green-400">
              {(company.name.charAt(0) || 'E').toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 text-[15px] font-medium text-gray-900 transition-colors duration-200 group-hover:text-green-700 dark:text-white dark:group-hover:text-green-400">
              {company.name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${typeBadgeClass}`}
            >
              {profileType}
            </span>
            {company.is_verified ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verifie
              </span>
            ) : null}
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-3.5 w-3.5 text-gray-400 dark:text-slate-500"
              >
                <path d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0015.5 2h-11zM6 5h2v2H6V5zm3 0h2v2H9V5zm3 0h2v2h-2V5zM6 8h2v2H6V8zm3 0h2v2H9V8zm3 0h2v2h-2V8zM6 11h2v2H6v-2zm3 0h2v2H9v-2zm3 0h2v2h-2v-2zM8 14h4v4H8v-4z" />
              </svg>
              <span>{company.sector}</span>
            </span>
            <span aria-hidden="true" className="text-gray-400 dark:text-slate-500">
              •
            </span>
            {company.address ? (
              <>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-slate-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9.69 18.933a.75.75 0 00.62 0c.075-.034 7.5-3.438 7.5-9.183a7.5 7.5 0 10-15 0c0 5.745 7.425 9.15 7.5 9.183zM10 11a2.25 2.25 0 100-4.5A2.25 2.25 0 0010 11z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="line-clamp-1">{company.address}</span>
                </span>
                <span aria-hidden="true" className="text-gray-400 dark:text-slate-500">
                  •
                </span>
              </>
            ) : null}
            <span className="inline-flex items-center">
              <span>{company.city}</span>
            </span>
          </div>

          {snippet ? (
            <p className="line-clamp-2 text-[13px] leading-relaxed text-gray-500 transition-colors duration-200 group-hover:text-gray-600 dark:text-slate-400 dark:group-hover:text-slate-300">
              {snippet}
            </p>
          ) : (
            <p className="text-[16px] text-gray-500 transition-colors duration-200 dark:text-slate-400">
              {company.description?.trim() || ''}
            </p>
          )}
        </div>
      </div>

      <div
        className={`relative z-20 flex items-center justify-between border-t border-gray-100 transition-colors duration-200 group-hover:border-gray-200 dark:border-slate-800 dark:group-hover:border-slate-700 ${footerPadding}`}
      >
        <div className="text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="mb-1 inline-block h-3 w-3 text-gray-400 dark:text-slate-500"
          >
            <path d="M2.94 10.53a1 1 0 010-1.06C4.32 7.13 6.9 4.5 10 4.5s5.68 2.63 7.06 4.97a1 1 0 010 1.06C15.68 12.87 13.1 15.5 10 15.5s-5.68-2.63-7.06-4.97zM10 13a3 3 0 100-6 3 3 0 000 6zm0-1.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
          </svg>
          <span className="ml-1">
            {viewsCount} vue{viewsCount > 1 ? 's' : ''}
          </span>
        </div>
        <BigUpButton companyId={company.id} initialCount={company.bigup} />
      </div>
    </article>
  );
}
