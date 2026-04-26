'use client';

import Image from 'next/image';

interface CompanyCardProps {
  name: string;
  profileType: string;
  sector: string;
  city: string;
  logoUrl?: string;
  isVerified?: boolean;
  onClick?: () => void;
}

export default function CompanyCard({
  name,
  profileType,
  sector,
  city,
  logoUrl,
  isVerified = false,
  onClick,
}: CompanyCardProps) {
  return (
    <article
      onClick={onClick}
      className={`group rounded-md border border-primary/20 bg-white p-4 transition-colors duration-200 hover:border-primary ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative mb-4 aspect-16/10 w-full overflow-hidden rounded-md border border-primary/20 bg-accents-1">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`Logo ${name}`}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover grayscale-45 transition duration-300 group-hover:grayscale-0"
            priority={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl font-bold text-gray-700">
            {(name.charAt(0) || 'E').toUpperCase()}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        {profileType && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
              {profileType}
            </p>
            {isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-gray-500" aria-hidden="true">
                  <path fillRule="evenodd" d="M10 1.667a1.5 1.5 0 0 1 1.294.742l.722 1.24 1.408.319a1.5 1.5 0 0 1 1.115 1.988l-.478 1.361.955 1.075a1.5 1.5 0 0 1-.087 2.087l-1.075.955.478 1.361a1.5 1.5 0 0 1-1.115 1.988l-1.408.32-.722 1.238a1.5 1.5 0 0 1-2.588 0l-.722-1.239-1.408-.319a1.5 1.5 0 0 1-1.115-1.988l.478-1.36-.955-.956a1.5 1.5 0 0 1 .087-2.087l1.075-.955-.478-1.361a1.5 1.5 0 0 1 1.115-1.988l1.408-.32.722-1.239A1.5 1.5 0 0 1 10 1.667Zm2.373 6.294a.75.75 0 1 0-1.11-1.005L9.14 9.298l-.404-.403a.75.75 0 1 0-1.06 1.06l.96.96a.75.75 0 0 0 1.085-.025l2.652-2.929Z" clipRule="evenodd" />
                </svg>
                Vérifié
              </span>
            )}
          </div>
        )}

        <h3 className="line-clamp-2 text-base font-semibold text-black">
          {name}
        </h3>

        <p className="line-clamp-1 text-sm font-medium text-gray-500">{sector}</p>
        <p className="line-clamp-1 text-sm text-gray-400">{city}</p>
      </div>
    </article>
  );
}
