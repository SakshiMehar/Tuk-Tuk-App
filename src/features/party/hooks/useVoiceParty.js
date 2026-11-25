import { useEffect, useState, useCallback } from 'react';
import { partyApi } from '../api/partyApi';
import { usePartyStore } from '../store/partyStore';
import { logger } from '@shared/utils/logger';

/**
 * useVoiceParty - Orchestrates room entry, initial state, and clean teardown.
 * Avoids putting 10,000 lines of logic into VoicePartyScreen!
 */
export function useVoiceParty(roomId) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setRoom = usePartyStore((s) => s.setRoom);
  const setSeats = usePartyStore((s) => s.setSeats);
  const resetRoom = usePartyStore((s) => s.resetRoom);

  const fetchRoomData = useCallback(async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      setError(null);

      let roomDetails = null;
      try {
        const raw = await partyApi.getRoomById(roomId);
        const data = raw?.data || raw;
        if (data && (data.roomId || data.id)) {
          roomDetails = {
            id: String(data.roomId || data.id),
            roomId: String(data.roomId || data.id),
            title: data.name || data.title || `Party Room #${roomId}`,
            name: data.name || data.title || `Party Room #${roomId}`,
            avatar: data.profileImageUrl || data.imageUrl || data.roomImageUrl || data.avatarUrl,
            hostId: data.hostId || null,
            hostName: data.name || 'Host',
            memberCount: data.userCount ?? 0,
            status: data.status || 'LIVE',
            ...data,
          };
        }
      } catch (apiErr) {
        logger.warn('useVoiceParty', `Failed to fetch room from backend: ${apiErr?.message}`);
      }

      if (!roomDetails) {
        roomDetails = {
          id: roomId,
          roomId,
          title: `Party Room #${roomId}`,
          name: `Party Room #${roomId}`,
          avatar: null,
          hostId: null,
          hostName: 'Host',
          memberCount: 0,
        };
      }

      setRoom(roomDetails);
    } catch (err) {
      logger.error('useVoiceParty', 'Failed to load room details', err);
      setError(err.message || 'Failed to enter room');
    } finally {
      setLoading(false);
    }
  }, [roomId, setRoom]);

  useEffect(() => {
    fetchRoomData();

    return () => {
      // Clean teardown on unmount
      logger.info('useVoiceParty', `Leaving party room: ${roomId}`);
      resetRoom();
    };
  }, [roomId, fetchRoomData, resetRoom]);

  return { loading, error, reload: fetchRoomData };
}

export default useVoiceParty;
