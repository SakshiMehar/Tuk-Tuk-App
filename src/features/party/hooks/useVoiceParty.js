import { useEffect, useState, useCallback } from 'react';
import { roomApi } from '../api/roomApi';
import { seatApi } from '../api/seatApi';
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

      // In real backend: roomApi.getRoomDetails(roomId); seatApi.getSeats(roomId)
      // Provide clean mock placeholder data for foundation
      const roomDetails = {
        id: roomId,
        title: `Party Room #${roomId}`,
        avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150',
        hostId: 'user_host_1',
        hostName: 'Host King',
        memberCount: 42,
      };

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
