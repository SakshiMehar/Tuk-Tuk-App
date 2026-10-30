import { useState, useEffect } from 'react';

/**
 * useNetworkStatus hook boundary
 */
export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Boundary for NetInfo / native connectivity
    return () => {};
  }, []);

  return { isConnected };
}

export default useNetworkStatus;
