import Link from 'next/link';

type SimilarCompany = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  slug: string;
  is_verified?: boolean | null;
};

type SimilarCompaniesRailProps = {
  items: SimilarCompany[];
};

export default function SimilarCompaniesRail({ items }: SimilarCompaniesRailProps) {
  if (!items.length) return null;

  return (
    <aside className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 lg:sticky lg:top-20">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Suggestions</p>
      <h2 className="mt-2 text-base font-semibold tracking-tight text-gray-900">
        Entreprises similaires
      </h2>
      <p className="mt-1 text-xs text-gray-500">
        Découvrez d&apos;autres profils proches de votre recherche.
      </p>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={`/pme/${item.slug}`}
              className="block rounded-lg border border-gray-200 bg-white p-3 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
            >
              <p className="line-clamp-1 text-sm font-semibold text-gray-900">{item.name}</p>
              <p className="mt-1 line-clamp-1 text-xs text-gray-500">
                {item.profile_type} · {item.sector} · {item.city}
              </p>
              {item.is_verified ? (
                <span className="mt-2 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                  Verifie
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
