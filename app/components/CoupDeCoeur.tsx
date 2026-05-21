import Image from 'next/image';
import NextLink from 'next/link';

type CoupDeCoeurProps = {
  name: string;
  sector: string;
  city: string;
  slug: string;
  logoUrl?: string | null;
  photoUrl?: string | null;
  viewsCount: number;
  description?: string | null;
};

export default function CoupDeCoeur({
  name,
  sector,
  city,
  slug,
  logoUrl,
  photoUrl,
  viewsCount,
  description,
}: CoupDeCoeurProps) {
  const imageUrl = photoUrl ?? logoUrl;

  return (
    <section
      className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16"
      style={{ animation: 'fadeInUp 0.6s ease both' }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="bg-linear-to-br relative overflow-hidden rounded-2xl border border-emerald-100 from-emerald-50 via-white to-teal-50 shadow-sm">
        <div className="min-h-65 flex flex-col md:flex-row">
          {/* Left – image */}
          <div className="min-h-50 relative w-full shrink-0 overflow-hidden rounded-t-2xl md:min-h-full md:w-5/12 md:rounded-l-2xl md:rounded-tr-none">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`Photo de ${name}`}
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-emerald-100">
                <span className="select-none text-7xl font-extrabold text-emerald-300">
                  {name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* subtle overlay */}
            <div className="bg-linear-to-r pointer-events-none absolute inset-0 from-transparent to-black/5" />
          </div>

          {/* Right – info */}
          <div className="flex flex-1 flex-col justify-center gap-4 px-6 py-8 md:px-10">
            {/* Badge */}
            <span
              className="inline-flex w-fit animate-shimmer items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, transparent 0%, rgba(253,224,71,0.6) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
              }}
            >
              ✨ Coup de Cœur de la semaine
            </span>

            {/* Company name */}
            <h2 className="text-2xl font-extrabold leading-tight tracking-tighter text-gray-900 sm:text-3xl md:text-4xl">
              {name}
            </h2>

            {/* Sector + city */}
            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              {sector && (
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 font-medium text-gray-700">
                  {sector}
                </span>
              )}
              {city && (
                <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1 text-gray-600">
                  📍 {city}
                </span>
              )}
            </div>

            {/* Views stat */}
            {viewsCount > 0 && (
              <p className="text-sm font-medium text-emerald-700">
                👁️ Déjà vue{' '}
                <span className="text-base font-extrabold">
                  {viewsCount.toLocaleString('fr-GN')}
                </span>{' '}
                fois
              </p>
            )}

            {/* Description */}
            {description && (
              <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">{description}</p>
            )}

            {/* CTA */}
            <NextLink
              href={`/pme/${slug}`}
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              Découvrir leur savoir-faire
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </NextLink>
          </div>
        </div>
      </div>
    </section>
  );
}
