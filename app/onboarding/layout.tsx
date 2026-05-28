import type { ReactNode } from 'react';

export const metadata = {
  title: 'Créer votre profil | Woralink',
  description: 'Configurez votre fiche professionnelle pour apparaître sur Woralink.',
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white transition-colors duration-200 dark:bg-slate-950">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
