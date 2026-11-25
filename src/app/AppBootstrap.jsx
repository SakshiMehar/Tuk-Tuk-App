import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@store/auth/authStore';
import { useAppStore } from '@store/app/appStore';
import { deviceService } from '@shared/services/deviceService';
import { websocketService } from '@shared/services/websocket/websocketService';
import { SplashScreen } from '@features/auth';
import {
  registerForPushNotifications,
  initPushNotificationListeners,
} from '../services/pushNotificationService';
import { navigateFromNotification } from '../utils/notificationNavigation';
import { useRouter } from '@shared/compat/expoRouter';

export function AppBootstrap({ children }) {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [appReady, setLocalReady] = useState(false);
  const hydrateAuth = useAuthStore((s) => s.hydrateAuth);
  const setAppReady = useAppStore((s) => s.setAppReady);
  const router = useRouter();

  useEffect(() => {
    // Wire up push notification listeners
    const unsubscribePush = initPushNotificationListeners({
      onForegroundMessage: (msg) => {
        console.log('[AppBootstrap] Foreground push received:', msg);
      },
      onNotificationTap: ({ data, isInitial }) => {
        console.log('[AppBootstrap] Push tapped, isInitial:', isInitial);
        if (!isInitial) {
          navigateFromNotification(router, data);
        }
      },
    });

    async function initializeApp() {
      try {
        // 1. Initialize stable Device ID
        await deviceService.getDeviceId();

        // 2. Hydrate session & authentication
        await hydrateAuth();

        // 3. Register for push notifications
        registerForPushNotifications().catch(() => {});

        // 4. Connect real-time transport boundary
        websocketService.connect();

        setAppReady(true);
      } catch (err) {
        // Fail gracefully
      } finally {
        setLocalReady(true);
      }
    }

    initializeApp();

    return () => {
      unsubscribePush?.();
    };
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
