import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

/**
 * useAppState hook to track foreground / background transitions
 * Always cleans up native listener.
 */
export function useAppState() {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
}

export default useAppState;
