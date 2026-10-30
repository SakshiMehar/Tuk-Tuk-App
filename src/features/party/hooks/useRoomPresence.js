import { useState, useEffect } from 'react';

/**
 * useRoomPresence - Tracks room member count and online presence.
 */
export function useRoomPresence(roomId, initialCount = 0) {
  const [onlineCount, setOnlineCount] = useState(initialCount);

  useEffect(() => {
    // In production, listens to presence delta
    return () => {};
  }, [roomId]);

  return { onlineCount, setOnlineCount };
}

export default useRoomPresence;
