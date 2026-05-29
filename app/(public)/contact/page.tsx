import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, MessageCircle } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import ContactForm from './ContactForm';

export const metadata: Metadata = {
  title: 'Contact | Woralink',
  description:
    "Contactez l'équipe Woralink pour toute question de support, demande de partenariat ou signalement.",
};

const WHATSAPP_NUMBER = '+224620027539'; // ← remplace par ton numéro pro

export default function ContactPage({ searchParams }: { searchParams?: { company?: string } }) {
  const targetCompanyName =
    typeof searchParams?.company === 'string' && searchParams.company.trim()
      ? searchParams.company.trim()
      : undefined;

  return (
    <div className="min-h-screen bg-white text-gray-900 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        {/* En-tête */}
        <div className="mb-10 text-center sm:mb-14">
          <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition-colors duration-200 dark:border-slate-700 dark:text-slate-300">
            Nous contacter
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tighter text-gray-900 transition-colors duration-200 dark:text-slate-100 sm:text-4xl md:text-5xl">
            Une question&nbsp;? On vous répond.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:text-base">
            Support, partenariats ou signalements — notre équipe est disponible pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Infos de contact */}
          <aside className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Nous trouver
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tighter text-gray-900 transition-colors duration-200 dark:text-slate-100">
                Woralink Guinée
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800">
                    <MapPin className="h-4 w-4 text-gray-600 transition-colors duration-200 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-gray-500">
                      Localisation
                    </p>
                    <p className="text-sm leading-relaxed text-gray-700 transition-colors duration-200 dark:text-slate-300">
                      Conakry, République de Guinée
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800">
                    <MessageCircle className="h-4 w-4 text-gray-600 transition-colors duration-200 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="mb-0.5 text-xs font-medium uppercase tracking-widest text-gray-500">
                      WhatsApp pro
                    </p>
                    <Link
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Bonjour Woralink, je vous contacte depuis le site.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      Démarrer une conversation
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-md border border-gray-100 bg-gray-50 p-4 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs leading-relaxed text-gray-500 transition-colors duration-200 dark:text-slate-400">
                  Délai de réponse habituel&nbsp;:{' '}
                  <span className="font-medium text-gray-700 transition-colors duration-200 dark:text-slate-300">
                    24 à 48h
                  </span>{' '}
                  en jours ouvrables.
                </p>
              </div>
            </div>
          </aside>

          {/* Formulaire */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <p className="text-[10px] font-medium uppercase tracking-widest text-gray-500">
                Formulaire
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tighter text-gray-900 transition-colors duration-200 dark:text-slate-100">
                Envoyer un message
              </h2>
              <p className="mt-1 text-sm text-gray-500 transition-colors duration-200 dark:text-slate-400">
                Remplissez les champs ci-dessous et nous vous répondrons rapidement.
              </p>

              <div className="mt-6">
                <ContactForm targetCompanyName={targetCompanyName} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
