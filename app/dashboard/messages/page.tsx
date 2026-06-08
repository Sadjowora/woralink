'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquareText, Send, Sparkles } from 'lucide-react';
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
  full_name?: string | null;
  email?: string | null;
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
  full_name: string;
  email: string | null;
};

function normalizeProfile(input: ProfileRow | ProfileRow[] | null | undefined): RoomClient {
  const profile = Array.isArray(input) ? (input[0] ?? null) : (input ?? null);

  const fullName =
    typeof profile?.full_name === 'string' && profile.full_name.trim()
      ? profile.full_name.trim()
      : 'Client';
  const email =
    typeof profile?.email === 'string' && profile.email.trim() ? profile.email.trim() : null;

  return {
    full_name: fullName,
    email,
  };
}

function formatChatTime(createdAt: string): string {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatChatDate(createdAt: string): string {
  const parsedDate = new Date(createdAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  return parsedDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
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
  const [company, setCompany] = useState<Company | null>(null);
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

    setFreshConversationIds((prev) => {
      if (prev.includes(roomId)) return prev;
      return [...prev, roomId];
    });

    const existingTimer = freshBadgeTimersRef.current[roomId];
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    freshBadgeTimersRef.current[roomId] = window.setTimeout(() => {
      setFreshConversationIds((prev) => prev.filter((id) => id !== roomId));
      delete freshBadgeTimersRef.current[roomId];
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
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (!cancelled) {
          router.push('/login');
        }
        return;
      }

      const userId = session.user.id;
      if (!cancelled) {
        setCurrentUserId(userId);
      }

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
      setCompany(companyData);
      setRoomsLoading(true);

      // 🔥 CORRECTION ICI : On demande explicitement à Supabase de joindre la table 'profiles' via la clé étrangère
      const { data: roomData, error: roomsError } = await supabase
        .from('chat_rooms')
        .select(
          'id, company_id, client_id, created_at, participant_a, participant_b, profiles:client_id(id, email, full_name)',
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

      const baseRooms = (roomData as ChatRoom[] | null) ?? [];

      if (!cancelled) {
        setRooms(baseRooms);
        setConversationList([]);
        setActiveRoomId((current) => {
          if (roomFromUrl && baseRooms.some((room) => room.id === roomFromUrl)) {
            return roomFromUrl;
          }

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
    if (roomFromUrl && rooms.some((room) => room.id === roomFromUrl)) {
      return roomFromUrl;
    }

    return activeRoomId;
  }, [activeRoomId, roomFromUrl, rooms]);

  useEffect(() => {
    if (!resolvedActiveRoomId) {
      return;
    }

    let cancelled = false;

    const loadMessages = async () => {
      setMessagesLoading(true);
      setMessages([]);

      const { data, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, room_id, sender_id, message, created_at')
        .eq('room_id', resolvedActiveRoomId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        if (!cancelled) {
          setError('Impossible de charger les messages de cette conversation.');
          setMessages([]);
          setMessagesLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setMessages((data as ChatMessage[] | null) ?? []);
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

    const knownRoomIds = new Set(rooms.map((room) => room.id));

    const channel = supabase
      .channel('company-messages-all-rooms')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          const nextMessage = payload.new as ChatMessage;
          if (!knownRoomIds.has(nextMessage.room_id)) return;

          if (nextMessage.room_id === resolvedActiveRoomId) {
            setMessages((prev) => {
              if (prev.some((message) => message.id === nextMessage.id)) {
                return prev;
              }
              return [...prev, nextMessage];
            });
          }

          setConversationList((prev) => {
            const currentConversation = prev.find(
              (conversation) => conversation.room_id === nextMessage.room_id,
            );
            const fallbackRoom = rooms.find((room) => room.id === nextMessage.room_id);

            const nextConversation: ConversationPreview = {
              room_id: nextMessage.room_id,
              client:
                currentConversation?.client ?? normalizeProfile(fallbackRoom?.profiles ?? null),
              last_message: nextMessage.message,
              last_at: nextMessage.created_at,
            };

            const filtered = prev.filter(
              (conversation) => conversation.room_id !== nextMessage.room_id,
            );
            return [nextConversation, ...filtered];
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
    () => rooms.find((room) => room.id === resolvedActiveRoomId) ?? null,
    [resolvedActiveRoomId, rooms],
  );

  const activeClient = useMemo(
    () => normalizeProfile(activeRoom?.profiles),
    [activeRoom?.profiles],
  );

  const roomCount = rooms.length;

  const roomIds = useMemo(() => rooms.map((room) => room.id), [rooms]);

  useEffect(() => {
    if (!rooms.length) {
      return;
    }

    let cancelled = false;

    const buildConversationList = async () => {
      const { latestByRoom, error: latestError } = await getLatestMessagesByRoom(roomIds);

      if (latestError) {
        if (!cancelled) {
          setConversationList(
            rooms.map((room) => ({
              room_id: room.id,
              client: normalizeProfile(room.profiles),
              last_message: '',
              last_at: room.created_at,
            })),
          );
        }
        return;
      }

      if (!cancelled) {
        const next = rooms
          .map((room) => {
            const latest = latestByRoom.get(room.id);
            return {
              room_id: room.id,
              client: normalizeProfile(room.profiles),
              last_message: latest?.message ?? '',
              last_at: latest?.created_at ?? room.created_at,
            } satisfies ConversationPreview;
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
    const textToSend = newMessage.trim();

    if (!textToSend || !resolvedActiveRoomId || !currentUserId || chatSending) return;

    setNewMessage('');
    setChatSending(true);

    const { data, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: resolvedActiveRoomId,
        sender_id: currentUserId,
        message: textToSend,
      })
      .select('id, room_id, sender_id, message, created_at')
      .single<ChatMessage>();

    if (insertError) {
      setError('Impossible d’envoyer votre message.');
      setNewMessage(textToSend);
      setChatSending(false);
      return;
    }

    if (data) {
      setMessages((prev) =>
        prev.some((message) => message.id === data.id) ? prev : [...prev, data],
      );
      setConversationList((prev) => {
        const currentConversation = rooms.find((room) => room.id === resolvedActiveRoomId);
        const nextConversation: ConversationPreview = {
          room_id: resolvedActiveRoomId,
          client: normalizeProfile(currentConversation?.profiles),
          last_message: data.message,
          last_at: data.created_at,
        };

        const filtered = prev.filter(
          (conversation) => conversation.room_id !== resolvedActiveRoomId,
        );
        return [nextConversation, ...filtered];
      });

      markConversationAsNew(resolvedActiveRoomId);
    }

    setChatSending(false);
  };

  return (
    <DashboardShell
      title="Messagerie"
      subtitle="Répondez aux clients en temps réel depuis votre espace professionnel."
      actions={
        <Link
          href="/dashboard/setup"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
        >
          Configuration
        </Link>
      }
    >
      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center text-sm text-gray-500 transition-colors duration-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Chargement de la messagerie...
          </div>
        </div>
      ) : error && roomCount === 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      ) : roomCount === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors duration-200 dark:bg-slate-800 dark:text-slate-500">
            <MessageSquareText className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 transition-colors duration-200 dark:text-white">
            Aucun client n’a encore ouvert de conversation
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600 transition-colors duration-200 dark:text-slate-400">
            Dès qu’un client vous contacte, la conversation apparaîtra ici avec son nom.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-emerald-700"
            >
              Explorer la plateforme
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white transition-colors duration-200 dark:border-slate-800 dark:bg-slate-900 lg:flex lg:h-[calc(100vh-13rem)]">
          <aside className="shrink-0 border-b border-gray-200 transition-colors duration-200 dark:border-slate-800 lg:w-80 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 px-4 py-4 transition-colors duration-200 dark:border-slate-800">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
                Conversations récentes
              </p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {conversationList.length} conversation{conversationList.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="max-h-95 overflow-y-auto lg:max-h-none lg:flex-1">
              {roomsLoading ? (
                <div className="flex h-full items-center justify-center px-4 py-10 text-sm text-gray-500 dark:text-slate-400">
                  Chargement des clients...
                </div>
              ) : (
                conversationList.map((conversation) => {
                  const isActive = conversation.room_id === resolvedActiveRoomId;

                  return (
                    <button
                      key={conversation.room_id}
                      type="button"
                      onClick={() => {
                        setActiveRoomId(conversation.room_id);
                        setFreshConversationIds((prev) => {
                          return prev.filter((id) => id !== conversation.room_id);
                        });
                        router.push(`/dashboard/messages?room=${conversation.room_id}`);
                      }}
                      className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3.5 text-left transition-colors duration-150 last:border-b-0 dark:border-slate-800 ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/25'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
                        <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                          {getInitials(conversation.client.full_name)}
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {conversation.client.full_name}
                        </p>
                        {conversation.last_message ? (
                          <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-slate-400">
                            {conversation.last_message}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-slate-500">
                            Conversation démarrée
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        {freshConversationIds.includes(conversation.room_id) && (
                          <span className="mb-1 inline-flex rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
                            Nouveau
                          </span>
                        )}
                        <span className="block text-[10px] text-gray-400 dark:text-slate-500">
                          {formatChatDate(conversation.last_at)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <div className="min-w-0 flex-1 flex-col lg:flex">
            {!activeRoom ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                  <Sparkles className="h-8 w-8 text-gray-400 dark:text-slate-500" />
                </div>
                <p className="max-w-md text-sm text-gray-500 dark:text-slate-400">
                  Sélectionnez une conversation à gauche pour afficher les messages du client.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3.5 transition-colors duration-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRoomId(null);
                      router.push('/dashboard/messages');
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
                    aria-label="Retour aux clients"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                      {getInitials(activeClient.full_name)}
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {activeClient.full_name}
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Messagerie client en direct
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 lg:min-h-0">
                  {messagesLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-gray-500 dark:text-slate-400">
                      Chargement des messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
                        <MessageSquareText className="h-6 w-6 text-gray-400 dark:text-slate-500" />
                      </div>
                      <p className="max-w-sm text-sm text-gray-500 dark:text-slate-400">
                        Aucun message dans cette conversation pour le moment.
                      </p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.sender_id === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                          <div className="mb-1 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-200 dark:border-slate-700">
                            {isMe ? (
                              company?.logo_url ? (
                                <Image
                                  src={company.logo_url}
                                  alt={company.name}
                                  width={28}
                                  height={28}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                  W
                                </div>
                              )
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                                {getInitials(activeClient.full_name)}
                              </div>
                            )}
                          </div>

                          <div
                            className={`flex max-w-[78%] flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                                isMe
                                  ? 'rounded-br-sm bg-emerald-600 text-white'
                                  : 'rounded-bl-sm bg-gray-100 text-gray-900 dark:bg-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {message.message}
                            </div>
                            <span
                              className={`px-1 text-[10px] text-gray-400 dark:text-slate-500 ${isMe ? 'text-right' : 'text-left'}`}
                            >
                              {formatChatTime(message.created_at)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-gray-100 p-3 transition-colors duration-200 dark:border-slate-800">
                  <form
                    onSubmit={handleSendMessage}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 transition-colors duration-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/15 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrire une réponse..."
                      className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                      disabled={chatSending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || chatSending}
                      className="flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-white transition-colors duration-150 hover:bg-emerald-700 disabled:opacity-40"
                      aria-label={chatSending ? 'Envoi du message' : 'Envoyer'}
                    >
                      {chatSending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
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
    </DashboardShell>
  );
}

export default function CompanyMessagesPage() {
  return (
    <Suspense>
      <MessagesPageInner />
    </Suspense>
  );
}
