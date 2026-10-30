import { useCallback } from 'react';
import { usePartyStore } from '../store/partyStore';
import { giftQueueService } from '../services/giftQueueService';

/**
 * useRoomGifts - Provides gift sending and gift queue consumption
 */
export function useRoomGifts(roomId) {
  const activeGift = usePartyStore((s) => s.activeGift);
  const enqueueGift = usePartyStore((s) => s.enqueueGift);
  const dequeueGift = usePartyStore((s) => s.dequeueGift);

  const sendGift = useCallback((gift) => {
    // Enqueue gift for animation
    const giftWithId = {
      ...gift,
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
    };

    giftQueueService.enqueue(giftWithId, (g) => {
      enqueueGift(g);
      // Auto dequeue after duration
      setTimeout(() => {
        dequeueGift(g.id);
      }, 3500);
    });
  }, [enqueueGift, dequeueGift]);

  return { activeGift, sendGift };
}

export default useRoomGifts;
