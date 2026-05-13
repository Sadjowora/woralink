import type { ReactNode } from 'react';

export const metadata = {
  title: 'Créer votre profil | Woralink',
  description: 'Configurez votre fiche professionnelle pour apparaître sur Woralink.',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <span className="text-lg font-bold tracking-tight text-gray-900">
            Wora<span className="text-green-700">link</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Création de profil
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
