import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import CompanyCard from './components/company/CompanyCard';
import Navbar from './components/layout/Navbar';

export const metadata: Metadata = {
  title: "Woralink | L'annuaire des professionnels en Guinée",
  description:
    'Trouvez rapidement des PME, startups, artisans et freelances en Guinée. Explorez des profils locaux par ville et secteur pour contacter les meilleurs professionnels près de chez vous.',
};

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  slug: string;
  logo_url?: string;
  is_verified?: boolean | null;
};

const POPULAR_CATEGORIES = [
  { label: 'BTP', icon: '🏗️' },
  { label: 'Informatique', icon: '💻' },
  { label: 'Mecanique', icon: '🔧' },
  { label: 'Sante', icon: '🩺' },
  { label: 'Transport', icon: '🚚' },
];

export default async function Home() {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  const featuredCompanies: Company[] = error ? [] : ((data as Company[]) ?? []);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      <section className="relative border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-6xl px-6 pt-28 pb-24 text-center md:pt-36 md:pb-32">
          <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
            Plateforme locale de confiance
          </span>

          <h1 className="mt-8 text-5xl font-extrabold leading-[1.05] tracking-tighter text-gray-900 md:text-7xl">
            Trouvez les meilleures PME, startups, artisans et freelances de Guinée
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-relaxed text-gray-600 md:text-lg">
            Découvrez des professionnels vérifiés près de chez vous, comparez rapidement les profils
            et contactez-les facilement. Woralink vous aide à choisir en toute confiance.
          </p>

          <form action="/search" method="GET" className="mx-auto mt-10 max-w-2xl">
            <input
              type="text"
              name="q"
              placeholder="Nom d'entreprise, service ou secteur..."
              className="w-full rounded-md border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </form>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link href="/search" className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100">
              Explorer tous les profils
            </Link>
            <Link href="/register" className="rounded-md bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90">
              Rejoindre Woralink via WhatsApp
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-primary">Secteurs populaires</h2>
          <Link href="/search" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir tout
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {POPULAR_CATEGORIES.map((category) => (
            <Link
              key={category.label}
              href={`/search?sector=${encodeURIComponent(category.label)}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-center hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="text-3xl mb-2">{category.icon}</div>
              <p className="font-semibold text-gray-800 group-hover:text-blue-700">{category.label}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 md:pb-20">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tighter text-primary">Dernieres entreprises inscrites</h2>
          <Link href="/search" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir les resultats
          </Link>
        </div>

        {featuredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCompanies.map((company) => (
              <Link key={company.id} href={`/pme/${company.slug}`}>
                <CompanyCard
                  name={company.name}
                  profileType={company.profile_type}
                  sector={company.sector}
                  city={company.city}
                  logoUrl={company.logo_url}
                  isVerified={Boolean(company.is_verified)}
                />
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">
              Aucune entreprise affichée pour le moment. Soyez le premier à rejoindre Woralink.
            </p>
            <Link href="/register" className="mt-4 inline-block rounded-md bg-primary px-5 py-2.5 font-medium text-white transition-colors hover:bg-primary/90">
              Créer mon profil
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-6 text-center text-sm text-gray-500">
          © 2026 Woralink - Connecter les professionnels de Guinée.
        </div>
      </footer>
    </div>
  );
}
