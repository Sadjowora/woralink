import { supabase } from './supabase';

type LatestMessageRpcRow = {
  room_id: string;
  message: string;
  created_at: string;
};

type LatestByRoom = Map<string, { message: string; created_at: string }>;

export async function getLatestMessagesByRoom(roomIds: string[]): Promise<{
  latestByRoom: LatestByRoom;
  error: string | null;
}> {
  const latestByRoom: LatestByRoom = new Map();

  if (roomIds.length === 0) {
    return { latestByRoom, error: null };
  }

  const { data, error } = await supabase.rpc('get_last_message_per_room', {
    room_ids: roomIds,
  });

  if (error) {
    return { latestByRoom, error: error.message };
  }

  for (const message of (data as LatestMessageRpcRow[] | null) ?? []) {
    latestByRoom.set(message.room_id, {
      message: message.message,
      created_at: message.created_at,
    });
  }

  return { latestByRoom, error: null };
}
