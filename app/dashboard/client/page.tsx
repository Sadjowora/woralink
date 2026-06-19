'use client';

import Image from 'next/image';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { HeartHandshake, Loader2, Mail, MessageCircle, Send, Sparkles } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import SkeletonHome from '../../components/dashboard/SkeletonHome';
import ScrollToTopButton from '../../components/dashboard/ScrollToTopButton';
import SearchListItem from '../../(public)/search/SearchListItem';
import { getLatestMessagesByRoom } from '@/lib/chat';
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

type ContactMessage = {
  id: string;
  created_at: string;
  company_id?: string | null;
  name?: string | null;
  email?: string | null;
  subject?: string | null;
  message: string;
  target_company_name?: string | null;
};

type ChatRoom = {
  id: string;
  company_id: string;
  client_id: string;
  created_at: string;
  company?: RoomCompany | null;
};

type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type ConversationPreview = {
  room_id: string;
  company: RoomCompany;
  last_message: string;
  last_at: string;
};

type RoomCompany = {
  name: string;
  logo_url: string | null;
};

function getRoomCompany(room?: ChatRoom | null): RoomCompany {
  if (room?.company?.name) {
    return {
      name: room.company.name,
      logo_url: room.company.logo_url ?? null,
    };
  }

  return {
    name: 'Entreprise Woralink',
    logo_url: null,
  };
}

function formatChatTime(createdAt: string): string {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatChatDate(createdAt: string): string {
  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function ClientDashboardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabFromUrl = searchParams.get('tab') || 'bravos';
  const roomFromUrl = searchParams.get('room');

  const [activeTab, setActiveTab] = useState(activeTabFromUrl);
  const [votedCompanies, setVotedCompanies] = useState<Company[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(roomFromUrl);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const [globalLoading, setGlobalLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [chatMessagesLoading, setChatMessagesLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  const [conversationList, setConversationList] = useState<ConversationPreview[]>([]);
  const [freshConversationIds, setFreshConversationIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const freshBadgeTimersRef = useRef<Record<string, number>>({});

  const markConversationAsNew = useCallback((roomId: string) => {
    if (!roomId) return;
    setFreshConversationIds((prev) => (prev.includes(roomId) ? prev : [...prev, roomId]));

    const existingTimer = freshBadgeTimersRef.current[roomId];
    if (existingTimer) window.clearTimeout(existingTimer);

    freshBadgeTimersRef.current[roomId] = window.setTimeout(() => {
      setFreshConversationIds((prev) => prev.filter((id) => id !== roomId));
      delete freshBadgeTimersRef.current[roomId];
    }, 8000);
  }, []);

  useEffect(() => {
    const timers = freshBadgeTimersRef.current;
    return () => Object.values(timers).forEach(window.clearTimeout);
  }, []);

  useEffect(() => {
    if (activeTabFromUrl !== activeTab) {
      setActiveTab(activeTabFromUrl);
    }
  }, [activeTabFromUrl, activeTab]);

  useEffect(() => {
    if (roomFromUrl && roomFromUrl !== activeRoomId) {
      setActiveRoomId(roomFromUrl);
      setActiveTab('messages');
    }
  }, [roomFromUrl, activeRoomId]);

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      setGlobalLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMounted) router.push('/login');
        return;
      }

      if (isMounted) {
        setCurrentUserId(session.user.id);
        setGlobalLoading(false);
      }
    };

    void loadUserData();
    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (!currentUserId) return;
    let isMounted = true;

    const fetchTabData = async () => {
      setContentLoading(true);
      setErrorMessage('');

      try {
        if (activeTab === 'bravos') {
          const { data: voteData, error: voteError } = await supabase
            .from('company_votes')
            .select('company_id')
            .eq('user_id', currentUserId);

          if (voteError) throw voteError;

          const companyIds = ((voteData as Array<{ company_id: string }> | null) ?? [])
            .map((row) => row.company_id)
            .filter(Boolean);

          if (companyIds.length === 0) {
            if (isMounted) setVotedCompanies([]);
            return;
          }

          const { data, error } = await supabase.from('companies').select('*').in('id', companyIds);

          if (error) throw error;

          const comps = ((data as Company[] | null) ?? []).map((company) => ({
            ...company,
            logo_url: company.logo_url ?? null,
          }));

          if (isMounted) setVotedCompanies(comps);
        } else if (activeTab === 'contact') {
          const { data, error } = await supabase
            .from('contact_messages')
            .select('*')
            .eq('sender_id', currentUserId)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (isMounted) setContactMessages((data as ContactMessage[]) ?? []);
        } else if (activeTab === 'messages') {
          const { data: roomData, error: roomsError } = await supabase
            .from('chat_rooms')
            .select('id, company_id, client_id, created_at')
            .eq('client_id', currentUserId)
            .order('created_at', { ascending: false });

          if (roomsError) throw roomsError;

          const rawRooms = (roomData as ChatRoom[] | null) ?? [];
          const companyIds = [...new Set(rawRooms.map((room) => room.company_id).filter(Boolean))];

          const companiesById = new Map<string, RoomCompany>();
          if (companyIds.length > 0) {
            const { data: companiesData, error: companiesError } = await supabase
              .from('companies')
              .select('id, name, logo_url')
              .in('id', companyIds);

            if (companiesError) throw companiesError;

            for (const company of (companiesData as Array<{
              id: string;
              name: string;
              logo_url: string | null;
            }> | null) ?? []) {
              companiesById.set(company.id, {
                name: company.name,
                logo_url: company.logo_url ?? null,
              });
            }
          }

          const baseRooms = rawRooms.map((room) => ({
            ...room,
            company: companiesById.get(room.company_id) ?? {
              name: 'Entreprise Woralink',
              logo_url: null,
            },
          }));

          if (isMounted) {
            setChatRooms(baseRooms);
            if (baseRooms.length > 0 && !activeRoomId) {
              setActiveRoomId(baseRooms[0].id);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching tab data:', err);
        if (isMounted)
          setErrorMessage('Une erreur est survenue lors de la récupération des données.');
      } finally {
        if (isMounted) setContentLoading(false);
      }
    };

    void fetchTabData();
    return () => {
      isMounted = false;
    };
  }, [activeTab, currentUserId, activeRoomId]);

  const resolvedActiveRoomId = useMemo(() => {
    if (roomFromUrl && chatRooms.some((r) => r.id === roomFromUrl)) return roomFromUrl;
    return activeRoomId;
  }, [activeRoomId, roomFromUrl, chatRooms]);

  useEffect(() => {
    if (!resolvedActiveRoomId || activeTab !== 'messages') return;
    let isMounted = true;

    const loadMessages = async () => {
      setChatMessagesLoading(true);
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('id, room_id, sender_id, message, created_at')
          .eq('room_id', resolvedActiveRoomId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        if (isMounted) setChatMessages((data as ChatMessage[]) ?? []);
      } catch (err) {
        console.error('Error loading chat messages:', err);
      } finally {
        if (isMounted) setChatMessagesLoading(false);
      }
    };

    void loadMessages();
    return () => {
      isMounted = false;
    };
  }, [resolvedActiveRoomId, activeTab]);

  useEffect(() => {
    if (!chatRooms.length || activeTab !== 'messages') return;
    const knownRoomIds = new Set(chatRooms.map((r) => r.id));

    const channel = supabase
      .channel('client-messages-all-rooms')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const nextMessage = payload.new as ChatMessage;
          if (!knownRoomIds.has(nextMessage.room_id)) return;

          if (nextMessage.room_id === resolvedActiveRoomId) {
            setChatMessages((prev) =>
              prev.some((m) => m.id === nextMessage.id) ? prev : [...prev, nextMessage],
            );
          }

          setConversationList((prev) => {
            const currentConv = prev.find((c) => c.room_id === nextMessage.room_id);
            const fallbackRoom = chatRooms.find((r) => r.id === nextMessage.room_id);

            const nextConv: ConversationPreview = {
              room_id: nextMessage.room_id,
              company: currentConv?.company ?? getRoomCompany(fallbackRoom),
              last_message: nextMessage.message,
              last_at: nextMessage.created_at,
            };

            return [nextConv, ...prev.filter((c) => c.room_id !== nextMessage.room_id)];
          });

          if (nextMessage.room_id !== resolvedActiveRoomId) {
            markConversationAsNew(nextMessage.room_id);
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [chatRooms, resolvedActiveRoomId, activeTab, markConversationAsNew]);

  useEffect(() => {
    if (activeTab === 'messages') {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const roomIds = useMemo(() => chatRooms.map((r) => r.id), [chatRooms]);

  useEffect(() => {
    if (!chatRooms.length || !roomIds.length || activeTab !== 'messages') return;
    let isMounted = true;

    const buildConversationList = async () => {
      const { latestByRoom, error } = await getLatestMessagesByRoom(roomIds);
      if (error && isMounted) {
        setConversationList(
          chatRooms.map((r) => ({
            room_id: r.id,
            company: getRoomCompany(r),
            last_message: '',
            last_at: r.created_at,
          })),
        );
        return;
      }

      if (isMounted) {
        const next = chatRooms
          .map((r) => {
            const latest = latestByRoom.get(r.id);
            return {
              room_id: r.id,
              company: getRoomCompany(r),
              last_message: latest?.message ?? '',
              last_at: latest?.created_at ?? r.created_at,
            };
          })
          .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

        setConversationList(next);
      }
    };

    void buildConversationList();
    return () => {
      isMounted = false;
    };
  }, [roomIds, chatRooms, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !resolvedActiveRoomId || !currentUserId || chatSending) return;

    setNewMessage('');
    setChatSending(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ room_id: resolvedActiveRoomId, sender_id: currentUserId, message: text })
        .select('*')
        .single();

      if (error) throw error;

      if (data) {
        const msg = data as ChatMessage;
        setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        setConversationList((prev) => {
          const currentRoom = chatRooms.find((r) => r.id === resolvedActiveRoomId);
          const nextConv: ConversationPreview = {
            room_id: resolvedActiveRoomId,
            company: getRoomCompany(currentRoom),
            last_message: msg.message,
            last_at: msg.created_at,
          };
          return [nextConv, ...prev.filter((c) => c.room_id !== resolvedActiveRoomId)];
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setErrorMessage("Impossible d'envoyer le message.");
    } finally {
      setChatSending(false);
    }
  };

  const activeRoom = useMemo(
    () => chatRooms.find((r) => r.id === resolvedActiveRoomId) ?? null,
    [resolvedActiveRoomId, chatRooms],
  );
  const activeCompany = useMemo(() => getRoomCompany(activeRoom), [activeRoom]);

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', tabName);
    if (tabName !== 'messages') params.delete('room');
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  if (globalLoading) {
    return <SkeletonHome />;
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Mon Espace Client
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Suivez vos interactions, vos avis donnés et vos conversations privées avec les PME.
          </p>
        </header>

        <div className="mb-6 flex border-b border-slate-200 dark:border-slate-800">
          {[
            { id: 'bravos', label: 'Mes Bravos', icon: HeartHandshake },
            { id: 'contact', label: 'Demandes de Contact', icon: Mail },
            { id: 'messages', label: 'Messagerie Directe', icon: MessageCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        <AnimatePresence mode="wait">
          {contentLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <motion.section
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'bravos' && (
                <div className="space-y-4">
                  {votedCompanies.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
                      <HeartHandshake className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Vous n&apos;avez pas encore envoyé de Bravo à une entreprise.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {votedCompanies.map((company, index) => (
                        <SearchListItem
                          key={company.id}
                          index={index}
                          company={{ ...company, logo_url: company.logo_url ?? undefined }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'contact' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  {contactMessages.length === 0 ? (
                    <div className="p-6 py-12 text-center">
                      <Mail className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                      <p className="text-slate-600 dark:text-slate-400">
                        Aucun message de contact envoyé.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {contactMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className="p-6 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                Formulaire soumis
                              </h3>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Date : {formatChatDate(msg.created_at)}
                              </p>
                            </div>
                          </div>
                          <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                            {msg.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:h-[calc(100vh-20rem)]">
                  <aside className="shrink-0 border-b border-slate-200 dark:border-slate-800 lg:w-80 lg:border-b-0 lg:border-r">
                    <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Vos échanges
                      </p>
                      <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                        {conversationList.length} conversation
                        {conversationList.length > 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="max-h-96 overflow-y-auto lg:max-h-none lg:flex-1">
                      {conversationList.map((conv) => {
                        const isCurrent = conv.room_id === resolvedActiveRoomId;
                        return (
                          <button
                            key={conv.room_id}
                            type="button"
                            onClick={() => {
                              setActiveRoomId(conv.room_id);
                              setFreshConversationIds((p) => p.filter((id) => id !== conv.room_id));
                              router.push(`/dashboard/client?tab=messages&room=${conv.room_id}`);
                            }}
                            className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition-colors dark:border-slate-800 ${
                              isCurrent
                                ? 'bg-emerald-50 dark:bg-emerald-950/25'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                          >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                              {conv.company.logo_url ? (
                                <Image
                                  src={conv.company.logo_url}
                                  alt={conv.company.name}
                                  width={44}
                                  height={44}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                  {getInitials(conv.company.name)}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {conv.company.name}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                                {conv.last_message || 'Discussion entamée'}
                              </p>
                            </div>
                            <div className="shrink-0 text-right text-[10px] text-slate-400">
                              {freshConversationIds.includes(conv.room_id) && (
                                <span className="mb-1 block rounded-full bg-green-100 px-1.5 py-0.5 text-center font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                  Nouveau
                                </span>
                              )}
                              <span>{formatChatDate(conv.last_at)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </aside>

                  <div className="min-w-0 flex-1 flex-col lg:flex">
                    {!activeRoom ? (
                      <div className="flex h-full flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                        <Sparkles className="h-8 w-8 text-slate-400" />
                        <p className="text-sm text-slate-500">
                          Sélectionnez une discussion à gauche pour communiquer avec une entreprise.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            {activeCompany.logo_url ? (
                              <Image
                                src={activeCompany.logo_url}
                                alt={activeCompany.name}
                                width={40}
                                height={40}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                {getInitials(activeCompany.name)}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {activeCompany.name}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                              Support pro en ligne
                            </p>
                          </div>
                        </div>

                        <div className="min-h-75 flex-1 space-y-3 overflow-y-auto px-4 py-4 lg:min-h-0">
                          {chatMessagesLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-slate-400">
                              Chargement...
                            </div>
                          ) : chatMessages.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">
                              Aucun message. Envoyez votre première demande !
                            </div>
                          ) : (
                            chatMessages.map((message) => {
                              const isMe = message.sender_id === currentUserId;
                              return (
                                <div
                                  key={message.id}
                                  className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                      isMe
                                        ? 'rounded-br-sm bg-emerald-600 text-white'
                                        : 'rounded-bl-sm bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100'
                                    }`}
                                  >
                                    <p>{message.message}</p>
                                    <span className="mt-1 block text-right text-[9px] opacity-75">
                                      {formatChatTime(message.created_at)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={bottomRef} />
                        </div>

                        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
                          <form
                            onSubmit={handleSendMessage}
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus-within:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                          >
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Écrire votre message à l'entreprise..."
                              className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none dark:text-white"
                              disabled={chatSending}
                            />
                            <button
                              type="submit"
                              disabled={!newMessage.trim() || chatSending}
                              className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-40"
                            >
                              {chatSending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
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
      <ScrollToTopButton />
    </div>
  );
}

export default function ClientDashboardPage() {
  return (
    <Suspense fallback={<SkeletonHome />}>
      <ClientDashboardPageInner />
    </Suspense>
  );
}
