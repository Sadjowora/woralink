import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

import { getLatestMessagesByRoom } from './chat';
import { supabase } from './supabase';

describe('getLatestMessagesByRoom', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns latestByRoom map when RPC succeeds', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          room_id: 'room-1',
          message: 'Bonjour',
          created_at: '2026-06-05T10:00:00.000Z',
        },
        {
          room_id: 'room-2',
          message: 'Salut',
          created_at: '2026-06-05T11:00:00.000Z',
        },
      ],
      error: null,
    } as never);

    const result = await getLatestMessagesByRoom(['room-1', 'room-2']);

    expect(supabase.rpc).toHaveBeenCalledWith('get_last_message_per_room', {
      room_ids: ['room-1', 'room-2'],
    });
    expect(result.error).toBeNull();
    expect(result.latestByRoom.size).toBe(2);
    expect(result.latestByRoom.get('room-1')).toEqual({
      message: 'Bonjour',
      created_at: '2026-06-05T10:00:00.000Z',
    });
    expect(result.latestByRoom.get('room-2')).toEqual({
      message: 'Salut',
      created_at: '2026-06-05T11:00:00.000Z',
    });
  });

  it('returns empty map and error message when RPC fails', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC failed' },
    } as never);

    const result = await getLatestMessagesByRoom(['room-1']);

    expect(supabase.rpc).toHaveBeenCalledWith('get_last_message_per_room', {
      room_ids: ['room-1'],
    });
    expect(result.error).toBe('RPC failed');
    expect(result.latestByRoom.size).toBe(0);
  });
});
