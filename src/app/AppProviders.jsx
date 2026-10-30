import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * AppProviders - Root Provider Wrapper
 * Keeps provider hierarchy shallow, clean, and avoids global re-render churn.
 */
export function AppProviders({ children }) {
  return (
    <SafeAreaProvider>
      {children}
    </SafeAreaProvider>
  );
}

export default AppProviders;
