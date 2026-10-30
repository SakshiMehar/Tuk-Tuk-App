import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef } from './navigationRef';
import { linking } from './linking';
import { ROUTES } from './navigationConstants';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuthStore } from '@store/auth/authStore';
import { colors } from '@shared/theme';

const RootStack = createNativeStackNavigator();

const navTheme = {
  dark: true,
  colors: {
    primary: colors.brand.primary,
    background: colors.background.primary,
    card: colors.background.secondary,
    text: colors.text.primary,
    border: colors.border.light,
    notification: colors.brand.secondary,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
};

export function AppNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef} linking={linking} theme={navTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name={ROUTES.MAIN_STACK} component={MainNavigator} />
        ) : (
          <RootStack.Screen name={ROUTES.AUTH_STACK} component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
