'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

interface CompanyCardProps {
  name: string;
  profileType: string;
  sector: string;
  city: string;
  logoUrl?: string;
  isVerified?: boolean;
  imageLoading?: 'eager' | 'lazy';
  onClick?: () => void;
}

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function CompanyCard({
  name,
  profileType,
  sector,
  city,
  logoUrl,
  isVerified = false,
  imageLoading = 'lazy',
  onClick,
}: CompanyCardProps) {
  return (
    <motion.article
      variants={cardVariants}
      onClick={onClick}
      className={`group relative rounded-xl border border-gray-200 bg-white p-4 transition-all duration-150 hover:border-gray-300 hover:shadow-sm ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="relative mb-4 aspect-video w-full overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={`Logo ${name}`}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
            loading={imageLoading}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-100 text-3xl font-bold text-gray-500">
            {(name.charAt(0) || 'E').toUpperCase()}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {profileType && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              {profileType}
            </span>
          )}
          {isVerified && (
            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1.667a1.5 1.5 0 0 1 1.294.742l.722 1.24 1.408.319a1.5 1.5 0 0 1 1.115 1.988l-.478 1.361.955 1.075a1.5 1.5 0 0 1-.087 2.087l-1.075.955.478 1.361a1.5 1.5 0 0 1-1.115 1.988l-1.408.32-.722 1.238a1.5 1.5 0 0 1-2.588 0l-.722-1.239-1.408-.319a1.5 1.5 0 0 1-1.115-1.988l.478-1.36-.955-.956a1.5 1.5 0 0 1 .087-2.087l1.075-.955-.478-1.361a1.5 1.5 0 0 1 1.115-1.988l1.408-.32.722-1.239A1.5 1.5 0 0 1 10 1.667Zm2.373 6.294a.75.75 0 1 0-1.11-1.005L9.14 9.298l-.404-.403a.75.75 0 1 0-1.06 1.06l.96.96a.75.75 0 0 0 1.085-.025l2.652-2.929Z" clipRule="evenodd" />
              </svg>
              Vérifié
            </span>
          )}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
          {name}
        </h3>

        <p className="line-clamp-1 text-sm text-gray-500">{sector}</p>
        <p className="line-clamp-1 text-xs text-gray-400">{city}</p>
      </div>
    </motion.article>
  );
}
