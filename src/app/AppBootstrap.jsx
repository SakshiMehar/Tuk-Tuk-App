import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@store/auth/authStore';
import { useAppStore } from '@store/app/appStore';
import { deviceService } from '@shared/services/deviceService';
import { websocketService } from '@shared/services/websocket/websocketService';
import { colors, typography } from '@shared/theme';

export function AppBootstrap({ children }) {
  const [bootstrapped, setBootstrapped] = useState(false);
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
        setBootstrapped(true);
      }
    }

    initializeApp();
  }, [hydrateAuth, setAppReady]);

  if (!bootstrapped) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.logo}>🛺</Text>
        <Text style={styles.splashTitle}>Tuk-Tuk</Text>
      </View>
    );
  }

  return children;
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
  },
  splashTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.heavy,
    marginTop: 12,
    letterSpacing: 2,
  },
});

export default AppBootstrap;
