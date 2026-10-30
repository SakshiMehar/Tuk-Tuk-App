import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from './navigationConstants';
import { BottomTabNavigator } from './BottomTabNavigator';
import { VoicePartyScreen, PartyExploreScreen } from '@features/party';
import { ChatBoxScreen } from '@features/chat';
import { CallScreen } from '@features/call';
import { WalletScreen } from '@features/wallet';
import { EditProfileScreen } from '@features/profile';
import { NotificationsScreen } from '@features/notifications';
import { SettingsScreen } from '@features/settings';

const Stack = createNativeStackNavigator();

export function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name={ROUTES.TABS.ROOT} component={BottomTabNavigator} />
      <Stack.Screen
        name={ROUTES.SCREENS.VOICE_PARTY}
        component={VoicePartyScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name={ROUTES.SCREENS.PARTY_EXPLORE} component={PartyExploreScreen} />
      <Stack.Screen name={ROUTES.SCREENS.CHAT_BOX} component={ChatBoxScreen} />
      <Stack.Screen
        name={ROUTES.SCREENS.CALL}
        component={CallScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name={ROUTES.SCREENS.WALLET} component={WalletScreen} />
      <Stack.Screen name={ROUTES.SCREENS.EDIT_PROFILE} component={EditProfileScreen} />
      <Stack.Screen name={ROUTES.SCREENS.NOTIFICATIONS} component={NotificationsScreen} />
      <Stack.Screen name={ROUTES.SCREENS.SETTINGS} component={SettingsScreen} />
    </Stack.Navigator>
  );
}

export default MainNavigator;
