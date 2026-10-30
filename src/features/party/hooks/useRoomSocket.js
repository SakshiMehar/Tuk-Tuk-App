import { useEffect } from 'react';
import { partySocketService } from '../services/partySocketService';
import { usePartyStore } from '../store/partyStore';
import { logger } from '@shared/utils/logger';

/**
 * useRoomSocket - Subscribes to real-time room events (seats, chat, gifts)
 * Routes incoming frames directly to individual store actions, avoiding monolithic state re-renders.
 */
export function useRoomSocket(roomId) {
  const updateSeat = usePartyStore((s) => s.updateSeat);
  const addChatMessage = usePartyStore((s) => s.addChatMessage);
  const enqueueGift = usePartyStore((s) => s.enqueueGift);

  useEffect(() => {
    if (!roomId) return;

    logger.info('useRoomSocket', `Subscribing to topics for room: ${roomId}`);

    const unsubSeats = partySocketService.subscribeRoomSeats(roomId, (seatUpdate) => {
      if (seatUpdate && typeof seatUpdate.index === 'number') {
        updateSeat(seatUpdate.index, seatUpdate);
      }
    });

    const unsubChat = partySocketService.subscribeRoomChat(roomId, (message) => {
      if (message) {
        addChatMessage(message);
      }
    });

    const unsubGifts = partySocketService.subscribeRoomGifts(roomId, (giftEvent) => {
      if (giftEvent) {
        enqueueGift(giftEvent);
      }
    });

    return () => {
      logger.info('useRoomSocket', `Unsubscribing topics for room: ${roomId}`);
      unsubSeats();
      unsubChat();
      unsubGifts();
    };
  }, [roomId, updateSeat, addChatMessage, enqueueGift]);
}

export default useRoomSocket;
