'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HeartHandshake, Mail, MapPin, MessageSquareText, Sparkles } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import SearchListItem from '../../(public)/search/SearchListItem';
import { supabase } from '@/lib/supabase';

type Company = {
  id: string;
  name: string;
  profile_type: string;
  sector: string;
  city: string;
  slug: string;
  logo_url?: string | null;
  is_verified?: boolean | null;
  address?: string | null;
  description?: string | null;
  company_story?: string | null;
  views_count?: number | null;
  bigup?: number | null;
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

type ActiveTab = 'home' | 'favorites' | 'messages';

type GalleryFeedItem = {
  id: string;
  url: string;
  caption: string | null;
  created_at: string;
  company_id: string;
  company_name: string;
  company_city: string;
  company_logo_url: string | null;
  company_slug: string;
  indexInCompany: number;
  totalInCompany: number;
};

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

function formatFeedDate(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
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
  const [galleryFeed, setGalleryFeed] = useState<GalleryFeedItem[]>([]);
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
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

      // Gallery feed — photos from all companies, newest first.
      // We keep the query simple to avoid failing on implicit relation naming.
      const { data: photosData, error: photosError } = await supabase
        .from('company_photos')
        .select('id, url, caption, created_at, company_id')
        .order('created_at', { ascending: false })
        .limit(60);

      if (photosError) {
        console.error('[ClientDashboard] gallery feed query failed:', photosError.message);
      }

      const rawPhotos = (photosData as Array<Record<string, unknown>> | null) ?? [];

      const galleryCompanyIds = Array.from(
        new Set(rawPhotos.map((row) => String(row.company_id ?? '')).filter(Boolean)),
      );

      let galleryCompaniesMap = new Map<
        string,
        {
          name?: string | null;
          city?: string | null;
          logo_url?: string | null;
          slug?: string | null;
        }
      >();

      if (galleryCompanyIds.length > 0) {
        const { data: galleryCompaniesData, error: galleryCompaniesError } = await supabase
          .from('companies')
          .select('id, name, city, logo_url, slug')
          .in('id', galleryCompanyIds);

        if (galleryCompaniesError) {
          console.error(
            '[ClientDashboard] gallery companies lookup failed:',
            galleryCompaniesError.message,
          );
        } else {
          galleryCompaniesMap = new Map(
            (
              (galleryCompaniesData as Array<{
                id: string;
                name?: string | null;
                city?: string | null;
                logo_url?: string | null;
                slug?: string | null;
              }> | null) ?? []
            ).map((company) => [
              company.id,
              {
                name: company.name ?? null,
                city: company.city ?? null,
                logo_url: company.logo_url ?? null,
                slug: company.slug ?? null,
              },
            ]),
          );
        }
      }

      // Compute per-company totals from the fetched batch
      const perCompanyIds = new Map<string, string[]>();
      rawPhotos.forEach((row) => {
        const cid = String(row.company_id ?? '');
        if (!perCompanyIds.has(cid)) perCompanyIds.set(cid, []);
        perCompanyIds.get(cid)!.push(String(row.id ?? ''));
      });

      const feedItems: GalleryFeedItem[] = rawPhotos
        .filter((row) => {
          const val = row.url;
          return typeof val === 'string' && val.trim();
        })
        .map((row) => {
          const val = row.url;
          const urlStr = String(val);
          const cid = String(row.company_id ?? '');
          const company = galleryCompaniesMap.get(cid);
          const ids = perCompanyIds.get(cid) ?? [];
          const idx = ids.indexOf(String(row.id ?? ''));

          return {
            id: String(row.id ?? ''),
            url: urlStr,
            caption:
              typeof row.caption === 'string' && row.caption.trim() ? row.caption.trim() : null,
            created_at: String(row.created_at ?? ''),
            company_id: cid,
            company_name: typeof company?.name === 'string' ? company.name : 'Entreprise',
            company_city: typeof company?.city === 'string' ? company.city : '',
            company_logo_url: typeof company?.logo_url === 'string' ? company.logo_url : null,
            company_slug: typeof company?.slug === 'string' ? company.slug : '',
            indexInCompany: idx + 1,
            totalInCompany: ids.length,
          };
        });

      if (!cancelled) {
        if (photosError) {
          setError('Le fil accueil est indisponible temporairement. Reessayez dans un instant.');
        }
        setFullName((profile?.full_name ?? '').trim());
        setCompanies(mappedCompanies);
        setMessages(mappedMessages);
        setGalleryFeed(feedItems);
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
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Bienvenue</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">
                {fullName || 'Utilisateur'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 sm:text-base">
                Retrouvez ici vos professionnels favoris et vos messages. Découvrez les dernières
                photos publiées par les entreprises de votre région.
              </p>
            </div>
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4"
        >
          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Bravos</span>
                <span className="hidden sm:inline">Bravos Distribués</span>
              </p>
              <span className="rounded-lg bg-green-50 p-1.5 text-green-700 sm:p-2">
                <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 sm:mt-3 sm:text-2xl">
              {supportedCount}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Messages</span>
                <span className="hidden sm:inline">Messages Envoyés</span>
              </p>
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-700 sm:p-2">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 sm:mt-3 sm:text-2xl">
              {messageCount}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Impact</span>
                <span className="hidden sm:inline">Impact Local</span>
              </p>
              <span className="rounded-lg bg-amber-50 p-1.5 text-amber-700 sm:p-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 sm:mt-3 sm:text-2xl">
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
            onClick={() => setActiveTab('home')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              activeTab === 'home'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            Accueil
          </button>
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
          {activeTab === 'home' ? (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {galleryFeed.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <Sparkles className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
                    Aucune photo publiée pour l&apos;instant. Les professionnels de Woralink
                    alimenteront ce fil au fur et à mesure.
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
                <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
                  {galleryFeed.map((item) => (
                    <motion.div
                      key={item.id}
                      className="mb-6 break-inside-avoid"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                      whileHover={{ y: -2 }}
                    >
                      <div
                        className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-150 hover:border-gray-300 hover:shadow-lg"
                        onClick={() =>
                          item.company_slug && router.push(`/pme/${item.company_slug}`)
                        }
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ' ') && item.company_slug) {
                            router.push(`/pme/${item.company_slug}`);
                          }
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50">
                              {item.company_logo_url ? (
                                <Image
                                  src={item.company_logo_url}
                                  alt={item.company_name}
                                  width={32}
                                  height={32}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500">
                                  {item.company_name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {item.company_name}
                              </p>
                              {item.company_city ? (
                                <p className="truncate text-xs text-gray-500">
                                  {item.company_city}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-xs text-gray-400">
                              {formatFeedDate(item.created_at)}
                            </span>
                            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                              {item.indexInCompany}/{item.totalInCompany}
                            </span>
                          </div>
                        </div>

                        {/* Image */}
                        <div className="relative w-full overflow-hidden">
                          <span className="absolute right-2 top-2 z-10 inline-flex items-center rounded-full border border-gray-200 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-gray-600 backdrop-blur-sm">
                            {item.indexInCompany}/{item.totalInCompany}
                          </span>
                          <Image
                            src={item.url}
                            alt={item.caption ?? item.company_name}
                            width={600}
                            height={400}
                            className="w-full object-cover"
                            style={{ height: 'auto' }}
                          />
                        </div>

                        {/* Footer */}
                        {item.caption ? (
                          <div className="border-t border-gray-100 px-4 py-3">
                            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400">
                              Légende
                            </p>
                            <p className="text-sm leading-relaxed text-gray-600">{item.caption}</p>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          ) : activeTab === 'favorites' ? (
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
                  className="space-y-3 sm:space-y-4"
                >
                  {filteredCompanies.map((company, index) => (
                    <SearchListItem
                      key={company.id}
                      company={{
                        ...company,
                        logo_url: company.logo_url ?? undefined,
                      }}
                      index={index}
                      compact
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
                          className={`flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-150 ${
                            canOpenCompany
                              ? 'cursor-pointer hover:border-gray-300 hover:shadow-md'
                              : ''
                          }`}
                        >
                          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <div className="h-8 w-8 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                {message.company_logo_url ? (
                                  <Image
                                    src={message.company_logo_url}
                                    alt={`Logo ${resolveCompanyName(message)}`}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase text-gray-500">
                                    {resolveCompanyName(message).charAt(0)}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                                  <h3 className="truncate text-sm font-semibold text-gray-900">
                                    {resolveCompanyName(message)}
                                  </h3>
                                  <span className="text-xs text-gray-400">•</span>
                                  <p className="truncate text-sm text-gray-500">
                                    {message.subject}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                            {message.body}
                          </p>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            {canOpenCompany ? (
                              <p className="text-xs font-medium text-green-700">
                                Voir la fiche entreprise
                              </p>
                            ) : (
                              <span aria-hidden="true" />
                            )}
                            <span className="text-xs text-gray-500">
                              {formatMessageDateTime(message.created_at)}
                            </span>
                          </div>
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
