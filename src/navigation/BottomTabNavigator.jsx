import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ROUTES } from './navigationConstants';
import { HomeScreen } from '@features/home';
import { DiscoveryScreen } from '@features/discovery';
import { ChatListScreen } from '@features/chat';
import { ProfileScreen } from '@features/profile';
import { colors, typography } from '@shared/theme';

const Tab = createBottomTabNavigator();

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background.secondary,
          borderTopColor: colors.border.light,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.semibold,
        },
        tabBarIcon: ({ focused }) => {
          let icon = '🏠';
          if (route.name === ROUTES.TABS.HOME) icon = '🏠';
          else if (route.name === ROUTES.TABS.DISCOVERY) icon = '🧭';
          else if (route.name === ROUTES.TABS.CHAT) icon = '💬';
          else if (route.name === ROUTES.TABS.PROFILE) icon = '👤';

          return (
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
              {icon}
            </Text>
          );
        },
      })}
    >
      <Tab.Screen
        name={ROUTES.TABS.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.DISCOVERY}
        component={DiscoveryScreen}
        options={{ tabBarLabel: 'Discovery' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.CHAT}
        component={ChatListScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.PROFILE}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
