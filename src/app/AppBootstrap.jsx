import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@store/auth/authStore';
import { useAppStore } from '@store/app/appStore';
import { deviceService } from '@shared/services/deviceService';
import { websocketService } from '@shared/services/websocket/websocketService';
import { SplashScreen } from '@features/auth';

export function AppBootstrap({ children }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [appReady, setLocalReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const setAppReady = useAppStore((s) => s.setAppReady);

  useEffect(() => {
    async function initializeApp() {
      try {
        // 1. Initialize stable Device ID
        await deviceService.getDeviceId();

        // 2. Hydrate session & authentication
        await hydrateAuth();

        // 3. Connect real-time transport boundary
        websocketService.connect();

        setAppReady(true);
      } catch (err) {
        // Fail gracefully
      } finally {
        setLocalReady(true);
      }
    }

    initializeApp();
  }, [hydrateAuth, setAppReady]);

  if (!bootstrapped) {
    return (
      <SplashScreen
        onFinish={() => {
          setBootstrapped(true);
        }}
      />
    );
  }

  return children;
}

export default AppBootstrap;
