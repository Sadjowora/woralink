'use client';

//import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MessageSquareText,
  Send,
  Sparkles,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell';
import { getLatestMessagesByRoom } from '../../../lib/chat';
import { supabase } from '../../../lib/supabase';

type Company = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
};

type ProfileRow = {
  id: string;
  full_name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  city?: string | null;
  bio_or_preferences?: string | null;
};

type ChatRoom = {
  id: string;
  company_id: string;
  client_id: string;
  created_at: string;
  participant_a?: string | null;
  participant_b?: string | null;
  profiles?: ProfileRow | ProfileRow[] | null;
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
  client: RoomClient;
  last_message: string;
  last_at: string;
};

type RoomClient = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  bio_or_preferences: string | null;
};

function normalizeProfile(input: ProfileRow | ProfileRow[] | null | undefined): RoomClient {
  const profile = Array.isArray(input) ? (input[0] ?? null) : (input ?? null);

  return {
    id: profile?.id || '',
    full_name: profile?.full_name?.trim() ? profile.full_name.trim() : 'Client Woralink',
    email: profile?.email?.trim() ? profile.email.trim() : null,
    phone_number: profile?.phone_number?.trim() ? profile.phone_number.trim() : null,
    city: profile?.city?.trim() ? profile.city.trim() : null,
    bio_or_preferences: profile?.bio_or_preferences?.trim()
      ? profile.bio_or_preferences.trim()
      : null,
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

function MessagesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomFromUrl = searchParams.get('room');

  //const [company, setCompany] = useState<Company | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatSending, setChatSending] = useState(false);

  const [conversationList, setConversationList] = useState<ConversationPreview[]>([]);
  const [freshConversationIds, setFreshConversationIds] = useState<string[]>([]);
  const [error, setError] = useState('');

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
    let cancelled = false;

    const loadDashboard = async () => {
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
      if (!cancelled) setCurrentUserId(userId);

      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id, name, slug, logo_url')
        .eq('user_id', userId)
        .maybeSingle<Company>();

      if (companyError || !companyData) {
        if (!cancelled) {
          setError('Impossible de charger votre espace messagerie pour le moment.');
          setLoading(false);
        }
        return;
      }

      if (cancelled) return;
      //setCompany(companyData);
      setRoomsLoading(true);

      // Récupération explicite avec intégration des nouveaux champs profils CRM de test
      const { data: roomData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(
          'id, company_id, client_id, created_at, participant_a, participant_b, profiles:client_id(id, email, full_name, phone_number, city, bio_or_preferences)',
        )
        .or(
          [
            `company_id.eq.${companyData.id}`,
            `participant_a.eq.${userId}`,
            `participant_b.eq.${userId}`,
          ].join(','),
        )
        .order('created_at', { ascending: false });

      if (roomsError) {
        if (!cancelled) {
          setError('Impossible de charger les conversations clients.');
          setRooms([]);
          setActiveRoomId(null);
          setLoading(false);
          setRoomsLoading(false);
        }
        return;
      }

      const baseRooms = (roomData as unknown as ChatRoom[] | null) ?? [];

      if (!cancelled) {
        setRooms(baseRooms);
        setConversationList([]);
        setActiveRoomId((current) => {
          if (roomFromUrl && baseRooms.some((r) => r.id === roomFromUrl)) return roomFromUrl;
          return current ?? baseRooms[0]?.id ?? null;
        });
        setRoomsLoading(false);
        setLoading(false);
      }
    };

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [router, roomFromUrl]);

  const resolvedActiveRoomId = useMemo(() => {
    if (roomFromUrl && rooms.some((r) => r.id === roomFromUrl)) return roomFromUrl;
    return activeRoomId;
  }, [activeRoomId, roomFromUrl, rooms]);

  useEffect(() => {
    if (!resolvedActiveRoomId) return;
    let cancelled = false;

    const loadMessages = async () => {
      setMessagesLoading(true);
      const { data, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, message, created_at')
        .eq('room_id', resolvedActiveRoomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        if (!cancelled) {
          setError('Impossible de charger les messages.');
          setMessagesLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setMessages((data as ChatMessage[]) ?? []);
        setMessagesLoading(false);
      }
    };

    void loadMessages();
    return () => {
      cancelled = true;
    };
  }, [resolvedActiveRoomId]);

  useEffect(() => {
    if (!rooms.length) return;
    const knownRoomIds = new Set(rooms.map((r) => r.id));

    const channel = supabase
      .channel('company-messages-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const nextMessage = payload.new as ChatMessage;
          if (!knownRoomIds.has(nextMessage.room_id)) return;

          if (nextMessage.room_id === resolvedActiveRoomId) {
            setMessages((prev) =>
              prev.some((m) => m.id === nextMessage.id) ? prev : [...prev, nextMessage],
            );
          }

          setConversationList((prev) => {
            const currentConv = prev.find((c) => c.room_id === nextMessage.room_id);
            const fallbackRoom = rooms.find((r) => r.id === nextMessage.room_id);

            const nextConv: ConversationPreview = {
              room_id: nextMessage.room_id,
              client: currentConv?.client ?? normalizeProfile(fallbackRoom?.profiles),
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
  }, [markConversationAsNew, resolvedActiveRoomId, rooms]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === resolvedActiveRoomId) ?? null,
    [resolvedActiveRoomId, rooms],
  );
  const activeClient = useMemo(() => normalizeProfile(activeRoom?.profiles), [activeRoom]);
  const roomIds = useMemo(() => rooms.map((r) => r.id), [rooms]);

  useEffect(() => {
    if (!rooms.length || !roomIds.length) return;
    let cancelled = false;

    const buildConversationList = async () => {
      const { latestByRoom, error: latestError } = await getLatestMessagesByRoom(roomIds);
      if (latestError && !cancelled) {
        setConversationList(
          rooms.map((r) => ({
            room_id: r.id,
            client: normalizeProfile(r.profiles),
            last_message: '',
            last_at: r.created_at,
          })),
        );
        return;
      }

      if (!cancelled) {
        const next = rooms
          .map((r) => {
            const latest = latestByRoom.get(r.id);
            return {
              room_id: r.id,
              client: normalizeProfile(r.profiles),
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
      cancelled = true;
    };
  }, [roomIds, rooms]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text || !resolvedActiveRoomId || !currentUserId || chatSending) return;

    setNewMessage('');
    setChatSending(true);

    const { data, error: insertError } = await supabase
      .from('chat_messages')
      .insert({ room_id: resolvedActiveRoomId, sender_id: currentUserId, message: text })
      .select('*')
      .single();

    if (insertError) {
      setError("Impossible d'envoyer votre message.");
      setNewMessage(text);
      setChatSending(false);
      return;
    }

    if (data) {
      const msg = data as ChatMessage;
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setConversationList((prev) => {
        const nextConv: ConversationPreview = {
          room_id: resolvedActiveRoomId,
          client: activeClient,
          last_message: msg.message,
          last_at: msg.created_at,
        };
        return [nextConv, ...prev.filter((c) => c.room_id !== resolvedActiveRoomId)];
      });
    }
    setChatSending(false);
  };

  return (
    <DashboardShell
      title="Messagerie Clients"
      subtitle="Répondez à vos prospects et clients en direct depuis votre espace professionnel."
      actions={
        <Link
          href="/dashboard/setup"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Configuration
        </Link>
      }
    >
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-slate-800 dark:bg-slate-900">
          Chargement de l`&apos;`espace de messagerie...
        </div>
      ) : error && rooms.length === 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
          <MessageSquareText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Aucune conversation en cours
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Dès qu`&apos;`un client vous enverra un message depuis votre page publique, il
            apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:flex lg:h-[calc(100vh-14rem)]">
          <aside className="flex shrink-0 flex-col border-b border-gray-200 dark:border-slate-800 lg:w-80 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 bg-slate-50/50 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-xs font-semibold uppercase text-gray-400">Conversations</p>
              <p className="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">
                {conversationList.length} au total
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {roomsLoading ? (
                <div className="p-4 text-center text-sm text-gray-400">Mise à jour...</div>
              ) : (
                conversationList.map((conv) => {
                  const isActive = conv.room_id === resolvedActiveRoomId;
                  return (
                    <button
                      key={conv.room_id}
                      type="button"
                      onClick={() => {
                        setActiveRoomId(conv.room_id);
                        setFreshConversationIds((p) => p.filter((id) => id !== conv.room_id));
                        router.push(`/dashboard/messages?room=${conv.room_id}`);
                      }}
                      className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition-colors dark:border-slate-800/60 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/25'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {getInitials(conv.client.full_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {conv.client.full_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-slate-400">
                          {conv.last_message || 'Nouvelle conversation'}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-[10px] text-gray-400">
                        {freshConversationIds.includes(conv.room_id) && (
                          <span className="mb-1 block rounded-full bg-green-100 px-1.5 py-0.5 text-center font-medium text-green-700 dark:bg-green-900/40">
                            Nouveau
                          </span>
                        )}
                        <span>{formatChatDate(conv.last_at)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
            {!activeRoom ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-slate-50/20 p-8 text-center">
                <Sparkles className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">
                  Sélectionnez une discussion pour ouvrir la messagerie privée.
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-1 flex-col border-r border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRoomId(null);
                        router.push('/dashboard/messages');
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 lg:hidden"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-slate-100 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getInitials(activeClient.full_name)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {activeClient.full_name}
                      </p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400">
                        Discussion en direct
                      </p>
                    </div>
                  </div>

                  <div className="min-h-62.5 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {messagesLoading ? (
                      <div className="p-4 text-center text-sm text-gray-400">
                        Chargement des messages...
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isMe = message.sender_id === currentUserId;
                        return (
                          <div
                            key={message.id}
                            className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                                isMe
                                  ? 'rounded-br-sm bg-emerald-600 text-white'
                                  : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
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

                  <div className="border-t border-gray-100 p-3 dark:border-slate-800">
                    <form
                      onSubmit={handleSendMessage}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-emerald-600 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Écrire votre réponse..."
                        className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none dark:text-white"
                        disabled={chatSending}
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim() || chatSending}
                        className="flex h-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-3 text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        {chatSending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Volet CRM d'informations de droite sur les clients */}
                <aside className="flex w-full shrink-0 flex-col gap-4 border-t border-gray-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30 lg:w-64 lg:border-t-0">
                  <div className="border-b border-gray-100 pb-2 text-center dark:border-slate-800">
                    <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      {getInitials(activeClient.full_name)}
                    </div>
                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {activeClient.full_name}
                    </h3>
                    <p className="truncate text-xs text-gray-400">
                      {activeClient.email || "Pas d'email renseigné"}
                    </p>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        Ville :{' '}
                        <strong className="text-gray-900 dark:text-white">
                          {activeClient.city || 'Non spécifiée'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span>
                        Contact :{' '}
                        <strong className="text-gray-900 dark:text-white">
                          {activeClient.phone_number || 'Non renseigné'}
                        </strong>
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-2 dark:border-slate-800">
                      <div className="mb-1 flex items-center gap-1.5 font-medium text-gray-700 dark:text-slate-400">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>Préférences & Besoins</span>
                      </div>
                      <p className="rounded-lg border border-gray-100 bg-white p-2 italic leading-relaxed text-gray-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-gray-400">
                        {activeClient.bio_or_preferences ||
                          'Aucune note additionnelle de profil pour ce client actuellement.'}
                      </p>
                    </div>
                  </div>
                </aside>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

export default function CompanyMessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-gray-500">
          Initialisation de l&apos;espace...
        </div>
      }
    >
      <MessagesPageInner />
    </Suspense>
  );
}
