import { useEffect } from 'react';
import { seatApi } from '../api/seatApi';
import { ENV } from '@app/env';
import { logger } from '@shared/utils/logger';

/**
 * useRoomHeartbeat - Sends periodic heartbeat if user is on a seat
 * Automatically cleans up timer on unmount or when seat is relinquished.
 */
export function useRoomHeartbeat(roomId, activeSeatIndex) {
  useEffect(() => {
    if (!roomId || activeSeatIndex === null || activeSeatIndex === undefined) {
      return;
    }

    logger.info('useRoomHeartbeat', `Starting heartbeat for room ${roomId}, seat ${activeSeatIndex}`);

    const intervalId = setInterval(async () => {
      try {
        await seatApi.sendHeartbeat(roomId);
      } catch (err) {
        logger.warn('useRoomHeartbeat', 'Heartbeat failed', err);
      }
    }, ENV.SEAT_HEARTBEAT_INTERVAL_MS);

    return () => {
      logger.info('useRoomHeartbeat', 'Stopping seat heartbeat');
      clearInterval(intervalId);
    };
  }, [roomId, activeSeatIndex]);
}

export default useRoomHeartbeat;
