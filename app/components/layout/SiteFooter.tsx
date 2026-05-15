'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SiteFooter() {
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-5 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
        <p className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Accueil
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/search"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Explorer
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/comment-ca-marche"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Comment ca marche
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/apropos"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            A propos
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/contact"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Contact
          </Link>
        </p>

        <p className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/politique-confidentialite"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Politique de confidentialite
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/conditions-utilisation"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Conditions d utilisation
          </Link>
          <span className="text-gray-300">|</span>
          <Link
            href="/instructions-suppression-donnees"
            className="font-medium text-green-700 underline-offset-4 hover:text-green-800 hover:underline"
          >
            Suppression des donnees
          </Link>
        </p>
        <p> © 2026 Woralink - Connecter les professionnels de Guinée.</p>
      </div>
    </footer>
  );
}
