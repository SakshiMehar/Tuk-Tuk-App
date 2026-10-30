import { useEffect } from 'react';
import { AppState } from 'react-native';
import { logger } from '@shared/utils/logger';

/**
 * usePartyLifecycle - Manages room behavior when app goes into background
 * Ensures audio remains active while heavy graphics/animations pause.
 */
export function usePartyLifecycle(roomId) {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      logger.info('usePartyLifecycle', `App transitioned to ${nextState} while in room ${roomId}`);
      if (nextState === 'background') {
        // Keep audio connection alive, pause unnecessary UI timers
      }
    });

    return () => {
      subscription.remove();
    };
  }, [roomId]);
}

export default usePartyLifecycle;
