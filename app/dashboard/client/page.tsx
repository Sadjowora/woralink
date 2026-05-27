'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HeartHandshake, Mail, MapPin, MessageSquareText, Sparkles } from 'lucide-react';
import CompanyCard from '../../components/company/CompanyCard';
import Navbar from '../../components/layout/Navbar';
import { supabase } from '@/lib/supabase';

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  logo_url?: string | null;
  is_verified?: boolean | null;
  slug?: string | null;
};

type VoteRow = {
  company_id: string;
  companies: Company | Company[] | null;
};

type ContactMessage = {
  id: string;
  company_id?: string | null;
  company_name?: string | null;
  company_slug?: string | null;
  company_logo_url?: string | null;
  subject: string;
  body: string;
  created_at: string;
};

type Profile = {
  full_name?: string | null;
};

type ActiveTab = 'favorites' | 'messages';

function normalizeCompany(row: VoteRow): Company | null {
  const related = Array.isArray(row.companies) ? (row.companies[0] ?? null) : row.companies;
  if (!related?.id) return null;
  return related;
}

function resolveCompanyName(message: ContactMessage): string {
  if (typeof message.company_name === 'string' && message.company_name.trim()) {
    return message.company_name.trim();
  }

  return 'Entreprise non précisée';
}

function formatMessageDateTime(createdAt: string): string {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Date inconnue';
  }

  return parsedDate.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('favorites');
  const [activeSector, setActiveSector] = useState('Tous');

  useEffect(() => {
    let cancelled = false;

    const loadClientDashboard = async () => {
      setLoading(true);
      setError('');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cancelled) router.push('/login');
        return;
      }

      const userId = session.user.id;
      const [
        { data: profile },
        { data: votesData, error: votesError },
        { data: messagesData, error: messagesError },
      ] = await Promise.all([
        supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle<Profile>(),
        supabase.from('company_votes').select('company_id, companies(*)').eq('user_id', userId),
        supabase
          .from('contact_messages')
          .select('id, company_id, subject, message, created_at')
          .eq('sender_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      if (votesError || messagesError) {
        if (!cancelled) {
          setError('Impossible de charger votre espace client pour le moment.');
          setCompanies([]);
          setMessages([]);
          setLoading(false);
        }
        return;
      }

      const mappedCompanies = ((votesData as VoteRow[] | null) ?? [])
        .map(normalizeCompany)
        .filter((company): company is Company => Boolean(company));

      const rawMessages = ((messagesData as Array<Record<string, unknown>> | null) ?? []).map(
        (row) => ({
          id: String(row.id ?? ''),
          company_id: typeof row.company_id === 'string' ? row.company_id : null,
          subject: String(row.subject ?? ''),
          body: String(row.message ?? ''),
          created_at: String(row.created_at ?? ''),
        }),
      );

      const companyIds = Array.from(
        new Set(
          rawMessages
            .map((message) => message.company_id)
            .filter((id): id is string => Boolean(id)),
        ),
      );

      let companiesMap = new Map<
        string,
        { name?: string | null; slug?: string | null; logo_url?: string | null }
      >();

      if (companyIds.length > 0) {
        const { data: relatedCompanies } = await supabase
          .from('companies')
          .select('id, name, slug, logo_url')
          .in('id', companyIds);

        companiesMap = new Map(
          (
            (relatedCompanies as Array<{
              id: string;
              name?: string | null;
              slug?: string | null;
              logo_url?: string | null;
            }> | null) ?? []
          ).map((company) => [
            company.id,
            {
              name: company.name ?? null,
              slug: company.slug ?? null,
              logo_url: company.logo_url ?? null,
            },
          ]),
        );
      }

      const mappedMessages: ContactMessage[] = rawMessages.map((message) => {
        const relatedCompany = message.company_id
          ? companiesMap.get(message.company_id)
          : undefined;

        return {
          ...message,
          company_name: relatedCompany?.name ?? null,
          company_slug: relatedCompany?.slug ?? null,
          company_logo_url: relatedCompany?.logo_url ?? null,
        };
      });

      if (!cancelled) {
        setFullName((profile?.full_name ?? '').trim());
        setCompanies(mappedCompanies);
        setMessages(mappedMessages);
        setLoading(false);
      }
    };

    void loadClientDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const supportedCount = useMemo(() => companies.length, [companies]);
  const messageCount = useMemo(() => messages.length, [messages]);

  const impactedRegions = useMemo(() => {
    return new Set(companies.map((company) => company.city).filter(Boolean)).size;
  }, [companies]);

  const sectorFilters = useMemo(() => {
    const sectors = Array.from(new Set(companies.map((company) => company.sector).filter(Boolean)));
    return ['Tous', ...sectors];
  }, [companies]);

  const filteredCompanies = useMemo(() => {
    if (activeSector === 'Tous') return companies;
    return companies.filter((company) => company.sector === activeSector);
  }, [activeSector, companies]);

  const displayName = fullName || 'Client';

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Espace client
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
              Chargement de votre espace personnalisé...
            </h1>
            <p className="mt-3 text-sm text-gray-600">Vérification de votre session en cours.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Dashboard client
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
                Mon Espace Coup de Pouce
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                Bienvenue {displayName}, retrouvez ici vos professionnels favoris et vos messages.
              </p>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Bravos Distribués</p>
              <span className="rounded-lg bg-green-50 p-2 text-green-700">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{supportedCount}</p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Messages Envoyés</p>
              <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{messageCount}</p>
          </article>

          <article className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Impact Local</p>
              <span className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <MapPin className="h-5 w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
              {impactedRegions}
            </p>
          </article>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2"
        >
          <button
            type="button"
            onClick={() => setActiveTab('favorites')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'favorites'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mes Favoris
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'messages'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Mes Messages
          </button>
        </motion.section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'favorites' ? (
            <motion.section
              key="favorites"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-6 flex flex-wrap gap-2">
                {sectorFilters.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setActiveSector(sector)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      activeSector === sector
                        ? 'border-green-700 bg-green-700 text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Sparkles className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
                    Vous n&apos;avez pas encore distribué de Bravos. Parcourez l&apos;Explorer pour
                    soutenir des PME guinéennes !
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
                    >
                      Explorer les professionnels
                    </Link>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                  className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredCompanies.map((company, index) => (
                    <CompanyCard
                      key={company.id}
                      name={company.name}
                      profileType={company.profile_type}
                      sector={company.sector}
                      city={company.city}
                      logoUrl={company.logo_url ?? undefined}
                      isVerified={Boolean(company.is_verified)}
                      imageLoading={index < 3 ? 'eager' : 'lazy'}
                      onClick={() => router.push(company.slug ? `/pme/${company.slug}` : '/search')}
                    />
                  ))}
                </motion.div>
              )}
            </motion.section>
          ) : (
            <motion.section
              key="messages"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {messages.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <MessageSquareText className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
                    Vous n&apos;avez pas encore envoyé de message aux professionnels.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/search"
                      className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-800"
                    >
                      Explorer les professionnels
                    </Link>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                  className="space-y-4"
                >
                  {messages.map((message) =>
                    (() => {
                      const companySlug =
                        typeof message.company_slug === 'string' && message.company_slug.trim()
                          ? message.company_slug.trim()
                          : null;
                      const canOpenCompany = Boolean(message.company_id) && Boolean(companySlug);

                      return (
                        <motion.article
                          key={message.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          onClick={() => {
                            if (canOpenCompany && companySlug) {
                              router.push(`/pme/${companySlug}`);
                            }
                          }}
                          className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-150 ${
                            canOpenCompany
                              ? 'cursor-pointer hover:border-gray-300 hover:shadow-md'
                              : ''
                          }`}
                        >
                          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="h-9 w-9 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                {message.company_logo_url ? (
                                  <Image
                                    src={message.company_logo_url}
                                    alt={`Logo ${resolveCompanyName(message)}`}
                                    width={36}
                                    height={36}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-gray-500">
                                    {resolveCompanyName(message).charAt(0)}
                                  </div>
                                )}
                              </div>
                              <h3 className="text-sm font-semibold text-gray-900">
                                {resolveCompanyName(message)}
                              </h3>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatMessageDateTime(message.created_at)}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-gray-900">{message.subject}</p>
                          <p className="mt-2 text-sm leading-relaxed text-gray-600">
                            {message.body}
                          </p>
                          {canOpenCompany && (
                            <p className="mt-3 text-xs font-medium text-green-700">
                              Voir la fiche entreprise
                            </p>
                          )}
                        </motion.article>
                      );
                    })(),
                  )}
                </motion.div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
