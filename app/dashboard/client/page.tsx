'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HeartHandshake,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import SkeletonHome from '../../components/dashboard/SkeletonHome';
import SearchListItem from '../../(public)/search/SearchListItem';
import { startChatRoom } from '../../(public)/contact/actions';
import { supabase } from '@/lib/supabase';

type Company = {
  id: string;
  user_id?: string | null;
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

type ChatMessage = {
  id: string;
  room_id: string;
  company_id?: string | null;
  client_id?: string | null;
  sender_id: string;
  message: string;
  created_at: string;
};

type Conversation = {
  company_id: string;
  company_name: string;
  company_slug: string | null;
  company_logo_url: string | null;
  last_message: string;
  last_at: string;
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

function formatChatTime(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function ClientDashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [galleryFeed, setGalleryFeed] = useState<GalleryFeedItem[]>([]);
  const [fullName, setFullName] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [activeSector, setActiveSector] = useState('Tous');

  // Chat state
  const [selectedChatCompanyId, setSelectedChatCompanyId] = useState<string | null>(null);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatRoomLoading, setChatRoomLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationList, setConversationList] = useState<Conversation[]>([]);
  const [freshConversationIds, setFreshConversationIds] = useState<string[]>([]);
  const [favoriteChatStartingId, setFavoriteChatStartingId] = useState<string | null>(null);
  const [chatToast, setChatToast] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const freshBadgeTimersRef = useRef<Record<string, number>>({});
  const urlTab = searchParams.get('tab');
  const companyParam = searchParams.get('company');
  const urlCompanyId = companyParam;
  const activeChatCompanyId = urlCompanyId ?? selectedChatCompanyId;
  const effectiveActiveTab: ActiveTab =
    urlTab === 'messages' || Boolean(urlCompanyId) ? 'messages' : activeTab;

  const markConversationAsNew = useCallback((companyId: string) => {
    if (!companyId) return;

    setFreshConversationIds((prev) => {
      if (prev.includes(companyId)) return prev;
      return [...prev, companyId];
    });

    const existingTimer = freshBadgeTimersRef.current[companyId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    freshBadgeTimersRef.current[companyId] = window.setTimeout(() => {
      setFreshConversationIds((prev) => prev.filter((id) => id !== companyId));
      delete freshBadgeTimersRef.current[companyId];
    }, 8000);
  }, []);

  useEffect(() => {
    const timers = freshBadgeTimersRef.current;

    return () => {
      Object.values(timers).forEach((timerId) => {
        window.clearTimeout(timerId);
      });
    };
  }, []);

  useEffect(() => {
    if (!chatToast) return;
    const timer = window.setTimeout(() => setChatToast(''), 3200);
    return () => window.clearTimeout(timer);
  }, [chatToast]);

  useEffect(() => {
    let cancelled = false;

    const loadClientDashboard = async () => {
      setIsLoading(true);
      setError('');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cancelled) {
          setIsLoading(false);
          router.push('/login');
        }
        return;
      }

      const userId = session.user.id;
      if (!cancelled) setCurrentUserId(userId);
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
          setIsLoading(false);
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
        setIsLoading(false);
      }
    };

    void loadClientDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  // Résout le room_id du duo (client + company) à partir de l'URL/conversation active.
  useEffect(() => {
    const targetCompanyId = companyParam ?? activeChatCompanyId;
    if (!targetCompanyId || !currentUserId) {
      return;
    }

    let cancelled = false;

    const resolveRoomId = async () => {
      setChatRoomLoading(true);
      const startResult = await startChatRoom(currentUserId, targetCompanyId);
      if (!cancelled) {
        if ('error' in startResult) {
          setChatToast(startResult.error);
          setActiveRoomId(null);
          setChatRoomLoading(false);
          return;
        }

        console.log('🎯 Salon actif trouvé et connecté :', startResult.roomId);
        setActiveRoomId(startResult.roomId);
        setChatRoomLoading(false);
      }
    };

    void resolveRoomId();

    return () => {
      cancelled = true;
    };
  }, [companyParam, activeChatCompanyId, currentUserId]);

  // Charge l'historique des messages à partir du room_id actif.
  useEffect(() => {
    if (!activeRoomId) return;

    let cancelled = false;

    const fetchMessages = async () => {
      setChatLoading(true);
      setChatMessages([]);

      const { data, error: historyError } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, message, created_at')
        .eq('room_id', activeRoomId)
        .order('created_at', { ascending: true });

      if (!cancelled) {
        if (historyError) {
          setChatToast('Impossible de charger les messages.');
          setChatMessages([]);
        } else {
          setChatMessages((data as ChatMessage[] | null) ?? []);
        }
        setChatLoading(false);
      }
    };

    void fetchMessages();

    return () => {
      cancelled = true;
    };
  }, [activeRoomId]);

  // Realtime: écoute des inserts sur le room_id actif.
  useEffect(() => {
    if (!activeRoomId) return;

    const channel = supabase
      .channel(`chat-room-${activeRoomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoomId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          if (activeChatCompanyId) {
            markConversationAsNew(activeChatCompanyId);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeRoomId, activeChatCompanyId, markConversationAsNew]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || chatSending) {
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    const currentUser = authData?.user ?? null;

    if (authError || !currentUser?.id) {
      console.error(
        "❌ Utilisateur non authentifié pour l'envoi:",
        authError?.message ?? 'missing user',
      );
      setChatToast('Session invalide. Veuillez vous reconnecter.');
      return;
    }

    let roomIdToUse = activeRoomId;
    if (!roomIdToUse) {
      const targetCompanyId = companyParam ?? activeChatCompanyId;
      if (!targetCompanyId) {
        console.error('❌ Aucun room_id actif et aucune entreprise sélectionnée.');
        return;
      }

      const startResult = await startChatRoom(currentUser.id, targetCompanyId);
      if ('error' in startResult) {
        console.error('❌ Impossible de résoudre le salon avant envoi:', startResult.error);
        setChatToast(startResult.error);
        return;
      }

      roomIdToUse = startResult.roomId;
      setActiveRoomId(roomIdToUse);
      console.log('🎯 Salon actif trouvé et connecté :', roomIdToUse);
    }

    const textToSend = newMessage;
    setNewMessage('');
    setChatSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: roomIdToUse,
          sender_id: currentUser.id,
          message: textToSend,
        })
        .select('id, room_id, sender_id, message, created_at')
        .single<ChatMessage>();

      if (error) {
        console.error("❌ Erreur Supabase lors de l'envoi :", error.message);
        setNewMessage(textToSend);
        setChatToast("Impossible d'envoyer le message.");
      } else {
        setChatMessages((prev) => {
          if (!data || prev.some((message) => message.id === data.id)) return prev;
          return [...prev, data];
        });

        setConversationList((prev) => {
          if (!activeChatCompanyId) return prev;

          const fallbackCompany = companies.find((company) => company.id === activeChatCompanyId);
          const nextConversation: Conversation = {
            company_id: activeChatCompanyId,
            company_name: fallbackCompany?.name ?? 'Entreprise',
            company_slug: fallbackCompany?.slug ?? null,
            company_logo_url: fallbackCompany?.logo_url ?? null,
            last_message: textToSend,
            last_at: data?.created_at ?? new Date().toISOString(),
          };

          const withoutSame = prev.filter((conversation) => {
            return conversation.company_id !== nextConversation.company_id;
          });

          return [nextConversation, ...withoutSame];
        });

        if (activeChatCompanyId) {
          markConversationAsNew(activeChatCompanyId);
        }

        console.log('✅ Message inséré avec succès :', data);
      }
    } finally {
      setChatSending(false);
    }
  };

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

  const handleRemoveFavorite = async (companyId: string) => {
    if (!currentUserId) return;
    await supabase
      .from('company_votes')
      .delete()
      .eq('user_id', currentUserId)
      .eq('company_id', companyId);
    setCompanies((prev) => prev.filter((c) => c.id !== companyId));
  };

  const handleStartChatFromFavorite = async (company: Company) => {
    if (!currentUserId || !company.id) return;
    if (company.user_id && currentUserId === company.user_id) return;
    setFavoriteChatStartingId(company.id);
    setChatToast('');
    const result = await startChatRoom(currentUserId, company.id);
    setFavoriteChatStartingId(null);
    if ('error' in result) {
      setChatToast(result.error);
      return;
    }

    setActiveTab('messages');
    setSelectedChatCompanyId(company.id);
    router.push(`/dashboard/client?tab=messages&company=${company.id}`);
  };

  // Deduplicated conversation list derived from contact_messages (one entry per company)
  const conversations = useMemo<Conversation[]>(() => {
    const seen = new Set<string>();
    return messages
      .filter((m) => {
        if (!m.company_id || seen.has(m.company_id)) return false;
        seen.add(m.company_id);
        return true;
      })
      .map((m) => ({
        company_id: m.company_id as string,
        company_name: resolveCompanyName(m),
        company_slug: m.company_slug ?? null,
        company_logo_url: m.company_logo_url ?? null,
        last_message: m.body,
        last_at: m.created_at,
      }));
  }, [messages]);

  useEffect(() => {
    setConversationList((prev) => {
      const byCompany = new Map<string, Conversation>();

      for (const conversation of prev) {
        byCompany.set(conversation.company_id, conversation);
      }

      for (const conversation of conversations) {
        const existing = byCompany.get(conversation.company_id);
        if (!existing) {
          byCompany.set(conversation.company_id, conversation);
          continue;
        }

        const existingTime = new Date(existing.last_at).getTime();
        const nextTime = new Date(conversation.last_at).getTime();
        if (Number.isNaN(existingTime) || nextTime >= existingTime) {
          byCompany.set(conversation.company_id, conversation);
        }
      }

      return Array.from(byCompany.values()).sort((a, b) => {
        return new Date(b.last_at).getTime() - new Date(a.last_at).getTime();
      });
    });
  }, [conversations]);

  const activeConversation = useMemo(() => {
    const fromMessages = conversationList.find((c) => c.company_id === activeChatCompanyId) ?? null;
    if (fromMessages) return fromMessages;

    if (!activeChatCompanyId) return null;
    const fallbackCompany = companies.find((c) => c.id === activeChatCompanyId);
    if (!fallbackCompany) return null;

    return {
      company_id: fallbackCompany.id,
      company_name: fallbackCompany.name,
      company_slug: fallbackCompany.slug,
      company_logo_url: fallbackCompany.logo_url ?? null,
      last_message: '',
      last_at: new Date().toISOString(),
    } satisfies Conversation;
  }, [conversationList, activeChatCompanyId, companies]);

  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-slate-950">
      {chatToast && (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {chatToast}
        </div>
      )}

      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 rounded-xl border border-gray-200 bg-white p-6 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 transition-colors duration-200 dark:text-slate-400">
                Bienvenue
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white md:text-4xl">
                {fullName || 'Utilisateur'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400 sm:text-base">
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
          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Bravos</span>
                <span className="hidden sm:inline">Bravos Distribués</span>
              </p>
              <span className="rounded-lg bg-green-50 p-1.5 text-green-700 sm:p-2">
                <HeartHandshake className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white sm:mt-3 sm:text-2xl">
              {supportedCount}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Messages</span>
                <span className="hidden sm:inline">Messages Envoyés</span>
              </p>
              <span className="rounded-lg bg-blue-50 p-1.5 text-blue-700 sm:p-2">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white sm:mt-3 sm:text-2xl">
              {messageCount}
            </p>
          </article>

          <article className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:rounded-xl sm:p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium leading-tight text-gray-500 transition-colors duration-200 dark:text-slate-400 sm:text-sm sm:font-normal">
                <span className="sm:hidden">Impact</span>
                <span className="hidden sm:inline">Impact Local</span>
              </p>
              <span className="rounded-lg bg-amber-50 p-1.5 text-amber-700 sm:p-2">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tracking-tight text-gray-900 transition-colors duration-200 dark:text-white sm:mt-3 sm:text-2xl">
              {impactedRegions}
            </p>
          </article>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab('home');
              setSelectedChatCompanyId(null);
              setActiveRoomId(null);
              setChatMessages([]);
              router.push('/dashboard/client');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              effectiveActiveTab === 'home'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
            }`}
          >
            Accueil
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('favorites');
              setSelectedChatCompanyId(null);
              setActiveRoomId(null);
              setChatMessages([]);
              router.push('/dashboard/client');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              effectiveActiveTab === 'favorites'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
            }`}
          >
            Mes Favoris
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('messages');
              router.push('/dashboard/client?tab=messages');
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 ${
              effectiveActiveTab === 'messages'
                ? 'bg-green-700 text-white'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800'
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
          {effectiveActiveTab === 'home' ? (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isLoading ? (
                  <motion.div
                    key="home-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SkeletonHome />
                  </motion.div>
                ) : galleryFeed.length === 0 ? (
                  <motion.div
                    key="home-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-gray-200 bg-white p-10 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors duration-200 dark:bg-slate-800 dark:text-slate-500">
                      <Sparkles className="h-7 w-7" aria-hidden="true" />
                    </div>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400">
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
                  </motion.div>
                ) : (
                  <motion.div
                    key="home-feed"
                    className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
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
                          className="cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:shadow-none"
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
                              <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-gray-50 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800">
                                {item.company_logo_url ? (
                                  <Image
                                    src={item.company_logo_url}
                                    alt={item.company_name}
                                    width={32}
                                    height={32}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-500 transition-colors duration-200 dark:text-slate-400">
                                    {item.company_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
                                  {item.company_name}
                                </p>
                                {item.company_city ? (
                                  <p className="truncate text-xs text-gray-500 transition-colors duration-200 dark:text-slate-400">
                                    {item.company_city}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="text-xs text-gray-400 transition-colors duration-200 dark:text-slate-500">
                                {formatFeedDate(item.created_at)}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-medium text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                                {item.indexInCompany}/{item.totalInCompany}
                              </span>
                            </div>
                          </div>

                          {/* Image */}
                          <div className="relative w-full overflow-hidden">
                            <span className="absolute right-2 top-2 z-10 inline-flex items-center rounded-full border border-gray-200 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-gray-600 backdrop-blur-sm transition-colors duration-200 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
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
                            <div className="border-t border-gray-100 px-4 py-3 transition-colors duration-200 dark:border-slate-800">
                              <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-400 transition-colors duration-200 dark:text-slate-500">
                                Légende
                              </p>
                              <p className="text-sm leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400">
                                {item.caption}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          ) : effectiveActiveTab === 'favorites' ? (
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200 ${
                      activeSector === sector
                        ? 'border-green-700 bg-green-700 text-white'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>

              {filteredCompanies.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors duration-200 dark:bg-slate-800 dark:text-slate-500">
                    <Sparkles className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400">
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
                    <div key={company.id}>
                      <SearchListItem
                        company={{
                          ...company,
                          logo_url: company.logo_url ?? undefined,
                        }}
                        index={index}
                        compact
                      />
                      {/* Barre d'actions attachée à la card */}
                      <div className="flex items-center justify-end gap-2 rounded-b-xl border border-t-0 border-gray-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
                        {company.user_id && currentUserId && company.user_id !== currentUserId && (
                          <button
                            type="button"
                            onClick={() => handleStartChatFromFavorite(company)}
                            disabled={favoriteChatStartingId === company.id}
                            title="Contacter ce professionnel"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors duration-150 hover:border-green-700 hover:text-green-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-green-500 dark:hover:text-green-400"
                          >
                            {favoriteChatStartingId === company.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            ) : (
                              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            Contacter
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(company.id)}
                          title="Retirer des favoris"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors duration-150 hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-red-600 dark:hover:text-red-400"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Retirer
                        </button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.section>
          ) : (
            /* ── Messages tab — Real-time Chat Interface ── */
            <motion.section
              key="messages"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {conversationList.length === 0 && !activeChatCompanyId ? (
                /* Empty state */
                <div className="rounded-xl border border-gray-200 bg-white p-10 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors duration-200 dark:bg-slate-800 dark:text-slate-500">
                    <MessageSquareText className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400">
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
                /* Two-column chat layout */
                <div className="lg:h-170 overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 lg:flex">
                  {/* ── Left: Conversations list ── */}
                  <aside
                    className={`shrink-0 border-b border-gray-200 transition-colors duration-200 dark:border-slate-800 lg:w-72 lg:border-b-0 lg:border-r xl:w-80 ${
                      activeChatCompanyId ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
                    }`}
                  >
                    <div className="border-b border-gray-100 px-4 py-4 dark:border-slate-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
                        Conversations recentes
                      </p>
                      <p className="mt-0.5 text-base font-semibold text-gray-900 dark:text-white">
                        {conversationList.length} contact{conversationList.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <ul className="flex-1 overflow-y-auto">
                      {conversationList.map((conv) => {
                        const isActive = activeChatCompanyId === conv.company_id;
                        return (
                          <li key={conv.company_id}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveTab('messages');
                                setSelectedChatCompanyId(conv.company_id);
                                setFreshConversationIds((prev) => {
                                  return prev.filter((id) => id !== conv.company_id);
                                });
                                router.push(
                                  `/dashboard/client?tab=messages&company=${conv.company_id}`,
                                );
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ${
                                isActive
                                  ? 'bg-green-50 dark:bg-green-950/30'
                                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                              }`}
                            >
                              {/* Avatar */}
                              <div
                                className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-full border transition-colors duration-200 ${
                                  isActive
                                    ? 'border-green-300 dark:border-green-700'
                                    : 'border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                {conv.company_logo_url ? (
                                  <Image
                                    src={conv.company_logo_url}
                                    alt={conv.company_name}
                                    fill
                                    sizes="40px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                    {conv.company_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500 dark:border-slate-900" />
                              </div>

                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-sm font-semibold ${
                                    isActive
                                      ? 'text-green-700 dark:text-green-400'
                                      : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  {conv.company_name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">
                                  {conv.last_message.slice(0, 48)}
                                  {conv.last_message.length > 48 ? '…' : ''}
                                </p>
                              </div>

                              {/* Date */}
                              <div className="shrink-0 text-right">
                                {freshConversationIds.includes(conv.company_id) && (
                                  <span className="mb-1 inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    Nouveau
                                  </span>
                                )}
                                <span className="block text-[10px] text-gray-400 dark:text-slate-500">
                                  {formatFeedDate(conv.last_at)}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </aside>

                  {/* ── Right: Chat area ── */}
                  <div
                    className={`min-w-0 flex-1 flex-col ${
                      activeChatCompanyId ? 'flex' : 'hidden lg:flex'
                    }`}
                  >
                    {!activeChatCompanyId ? (
                      /* Desktop placeholder when no conversation selected */
                      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                          <MessageSquareText className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                          Sélectionnez une conversation pour afficher les messages.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Chat header */}
                        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 transition-colors duration-200 dark:border-slate-800">
                          {/* Back button (mobile) */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedChatCompanyId(null);
                              setActiveRoomId(null);
                              router.push('/dashboard/client?tab=messages');
                            }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                            aria-label="Retour"
                          >
                            <svg
                              viewBox="0 0 20 20"
                              fill="none"
                              className="h-5 w-5"
                              aria-hidden="true"
                            >
                              <path
                                d="M12 4l-6 6 6 6"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>

                          {/* Company avatar */}
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
                            {activeConversation?.company_logo_url ? (
                              <Image
                                src={activeConversation.company_logo_url}
                                alt={activeConversation.company_name}
                                fill
                                sizes="36px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                {activeConversation?.company_name.charAt(0).toUpperCase() ?? '?'}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                              {activeConversation?.company_name ?? ''}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              Conversation en direct
                            </p>
                          </div>

                          <span className="hidden rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 sm:inline-flex">
                            {chatRoomLoading
                              ? 'Salon: chargement...'
                              : activeRoomId
                                ? `Salon: ${activeRoomId.slice(0, 8)}...`
                                : 'Salon: non trouve'}
                          </span>

                          {activeConversation?.company_slug && (
                            <Link
                              href={`/pme/${activeConversation.company_slug}`}
                              className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                              Voir la fiche
                            </Link>
                          )}
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                          {chatRoomLoading || chatLoading ? (
                            <div className="flex h-full items-center justify-center">
                              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-emerald-600 dark:border-slate-700 dark:border-t-emerald-500" />
                            </div>
                          ) : chatMessages.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                                <MessageSquareText className="h-6 w-6 text-gray-400 dark:text-slate-500" />
                              </div>
                              <p className="text-sm text-gray-500 dark:text-slate-400">
                                Aucun message pour l&apos;instant. Commencez la conversation !
                              </p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => {
                              const isMe = msg.sender_id === currentUserId;
                              return (
                                <div
                                  key={msg.id}
                                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                  {/* Company avatar (received side only) */}
                                  {!isMe && (
                                    <div className="mb-1 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
                                      {activeConversation?.company_logo_url ? (
                                        <Image
                                          src={activeConversation.company_logo_url}
                                          alt=""
                                          width={28}
                                          height={28}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                          {activeConversation?.company_name
                                            .charAt(0)
                                            .toUpperCase() ?? '?'}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Bubble */}
                                  <div
                                    className={`flex max-w-[72%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                                  >
                                    <div
                                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                        isMe
                                          ? 'rounded-br-sm bg-emerald-600 text-white'
                                          : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
                                      }`}
                                    >
                                      {msg.message}
                                    </div>
                                    <span
                                      className={`px-1 text-[10px] text-gray-400 dark:text-slate-500 ${isMe ? 'text-right' : 'text-left'}`}
                                    >
                                      {formatChatTime(msg.created_at)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          {/* Scroll anchor */}
                          <div ref={chatBottomRef} />
                        </div>

                        {/* Input bar */}
                        <div className="border-t border-gray-100 p-3 transition-colors duration-200 dark:border-slate-800">
                          <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition-colors duration-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Écrivez votre message…"
                              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                            />
                            <button
                              type="submit"
                              disabled={!newMessage.trim() || chatSending || chatRoomLoading}
                              className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-40"
                              aria-label={chatSending ? 'Envoi du message' : 'Envoyer'}
                            >
                              {chatSending ? (
                                <>
                                  <Loader2
                                    className="h-3.5 w-3.5 animate-spin"
                                    aria-hidden="true"
                                  />
                                  <span className="text-[11px] font-medium">Envoi...</span>
                                </>
                              ) : (
                                <Send className="h-4 w-4" aria-hidden="true" />
                              )}
                            </button>
                          </form>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense>
      <ClientDashboardPageInner />
    </Suspense>
  );
}
