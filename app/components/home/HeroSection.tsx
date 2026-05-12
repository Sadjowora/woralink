'use client';

import NextLink from 'next/link';
import { useEffect, useState } from 'react';

const PLACEHOLDERS = [
  'Rechercher un menuisier a Conakry...',
  'Trouver une clinique a Labe...',
  'Chercher un developpeur web en Guinee...',
  'Trouver un mecanicien a Kindia...',
  "Chercher une imprimerie a N'Zerekore...",
];

const TRUST_STATS = [
  { value: '50+', label: 'Entreprises inscrites' },
  { value: '8+', label: 'Villes couvertes' },
  { value: '10+', label: "Secteurs d'activite" },
];

export default function HeroSection() {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  return (
    <section className="relative border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 md:pb-32 md:pt-36">
        <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
          Plateforme locale de confiance
        </span>

        <h1 className="mt-6 text-center text-4xl font-bold tracking-tight text-gray-900 sm:mt-8 md:text-5xl lg:text-6xl">
          Le meilleur professionnel de Guinee{' '}
          <span className="text-green-700">est peut-etre à côté de chez vous</span>
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-base leading-relaxed text-gray-500 md:text-lg">
          Decouvrez des PME, artisans et freelances verifiés partout en Guinee. Comparez, contactez,
          faites confiance.
        </p>

        <form action="/search" method="GET" className="mx-auto mt-10 w-full max-w-2xl">
          <div className="flex w-full items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm transition-all duration-150 focus-within:border-green-700 focus-within:ring-2 focus-within:ring-green-700/10">
            <svg
              className="h-4 w-4 shrink-0 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              name="q"
              placeholder={PLACEHOLDERS[placeholderIndex]}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />

            <button
              type="submit"
              className="shrink-0 rounded-lg bg-green-700 px-4 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
            >
              Rechercher
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-6 md:gap-10">
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold tracking-tight text-gray-900">{stat.value}</span>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col flex-wrap items-center justify-center gap-2 text-xs sm:mt-7 sm:flex-row sm:gap-3 sm:text-sm">
          <NextLink
            href="/search"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-100 sm:w-auto sm:py-2"
          >
            Explorer tous les profils
          </NextLink>
          <NextLink
            href="/register"
            className="w-full rounded-md bg-green-700 px-4 py-2.5 font-medium text-white transition-colors hover:bg-green-800 sm:w-auto sm:py-2"
          >
            Rejoindre Woralink
          </NextLink>
        </div>
      </div>
    </section>
  );
}
