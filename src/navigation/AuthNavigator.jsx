import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from './navigationConstants';
import { LoginScreen, MobileScreen, OtpScreen } from '@features/auth';

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name={ROUTES.AUTH.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.AUTH.MOBILE} component={MobileScreen} />
      <Stack.Screen name={ROUTES.AUTH.OTP} component={OtpScreen} />
    </Stack.Navigator>
  );
}

export default AuthNavigator;
