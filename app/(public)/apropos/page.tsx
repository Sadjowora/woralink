import type { Metadata } from 'next';
import Image from 'next/image';
import { Eye, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import ContactForm from '../contact/ContactForm';

export const metadata: Metadata = {
  title: "À propos | Woralink",
  description:
    "Découvrez la mission de Woralink : connecter les artisans, PME et freelances de Guinée au reste du monde grâce à une vitrine digitale professionnelle.",
};

const VALUES = [
  {
    icon: Eye,
    title: 'Visibilité',
    description:
      "Chaque professionnel mérite d'être vu. Woralink donne à chaque artisan et PME une vitrine numérique professionnelle accessible depuis n'importe où dans le monde.",
  },
  {
    icon: ShieldCheck,
    title: 'Confiance',
    description:
      "Les profils vérifiés, les avis clients et les galeries de réalisations permettent aux visiteurs de choisir en toute confiance le bon professionnel.",
  },
  {
    icon: Zap,
    title: 'Accessibilité',
    description:
      "Créer son profil en quelques minutes, sans compétence technique. Woralink est conçu pour être simple, rapide et adapté aux réalités du terrain guinéen.",
  },
] as const;

export default function AproposPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />

      {/* ── Hero image ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="relative h-75 sm:h-95 md:h-115 overflow-hidden rounded-2xl border border-gray-200">
          <Image
            src="/width_1032.png"
            alt="Alliance entre artisanat guinéen et technologie moderne"
            fill
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1024px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
            <h2 className="max-w-2xl text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tighter text-white">
              Woralink : Le pont entre le talent guinéen et le monde
            </h2>
          </div>
        </div>
      </section>

      {/* ── Hero / Présentation ─────────────────────────────────────── */}
      <section className="border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600">
            Notre mission
          </span>
          <h1 className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold leading-[1.08] tracking-tighter text-gray-900">
            Woralink&nbsp;: Connecter le talent<br className="hidden sm:block" /> guinéen au reste du monde.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-gray-500">
            Woralink est la plateforme de référence pour découvrir les artisans et PME en Guinée.
            Nous offrons une visibilité digitale professionnelle à ceux qui font bouger l&apos;économie
            locale — menuisiers, coiffeurs, mécaniciens, agences web, startups et bien plus encore.
          </p>
        </div>
      </section>

      {/* ── Visuels / Illustratifs ──────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Placeholder artisanat */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-4/3">
            <Image
              src="/width_1032.png"
              alt="Artisan guinéen au travail"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
              <span className="text-3xl">🛠️</span>
              <p className="text-xs font-medium text-gray-500 tracking-widest uppercase">Artisanat local</p>
            </div>
          </div>

          {/* Placeholder innovation */}
          <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 aspect-4/3">
            <Image
              src="/width_944.webp"
              alt="Innovation et numérique en Guinée"
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-100">
              <span className="text-3xl">💡</span>
              <p className="text-xs font-medium text-gray-500 tracking-widest uppercase">Innovation</p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-400 italic">
          Ces visuels utilisent des fichiers locaux existants ({' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">public/width_1032.png</code>{' '}
          et{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">public/width_944.webp</code>).
        </p>
      </section>

      {/* ── Nos valeurs ─────────────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Ce qui nous guide</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tighter text-gray-900">
              Nos valeurs
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {VALUES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tighter text-gray-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Section chiffres ────────────────────────────────────────── */}
      <section className="border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white shadow-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { value: '100%', label: 'Gratuit pour démarrer' },
              { value: 'Guinée', label: 'Réseau local & national' },
              { value: 'WhatsApp', label: 'Contact direct instantané' },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 px-6 py-8 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tighter text-primary">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Formulaire de contact ────────────────────────────────────── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-20">
          <div className="text-center mb-10">
            <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">Nous écrire</p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tighter text-gray-900">
              Une question&nbsp;? Écrivez-nous.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-gray-500">
              Notre équipe vous répond en 24 à 48h. Partenariat, support ou signalement — nous sommes à l&apos;écoute.
            </p>
          </div>

          <div className="mx-auto max-w-xl rounded-xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-gray-500">
          © 2026 Woralink — Connecter les professionnels de Guinée.
        </div>
      </footer>
    </div>
  );
}
