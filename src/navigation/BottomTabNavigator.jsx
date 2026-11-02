import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Home, Mic, MessageCircle, User } from 'lucide-react-native';

import { ROUTES } from './navigationConstants';
import { HomeScreen } from '@features/home';
import { DiscoveryScreen } from '@features/discovery';
import { ChatListScreen } from '@features/chat';
import { ProfileScreen } from '@features/profile';

// Solid purple modern house with doorway arch matching Tuk-Tuk-App design
const ActiveHomeIcon = () => (
  <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.84 2.45a1.8 1.8 0 0 1 2.32 0l7.2 6.06c.41.34.64.85.64 1.39V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V9.9c0-.54.23-1.05.64-1.39l7.2-6.06z"
      fill="#7C3AED"
    />
  </Svg>
);

const renderTabIcon = (routeName, isFocused) => {
  const activeColor = '#7C3AED';
  const inactiveColor = '#475569';

  switch (routeName) {
    case ROUTES.TABS.HOME:
      return isFocused ? (
        <ActiveHomeIcon />
      ) : (
        <Home size={23} color={inactiveColor} strokeWidth={2} />
      );
    case ROUTES.TABS.DISCOVERY:
      return (
        <Mic
          size={23}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.9}
        />
      );
    case ROUTES.TABS.CHAT:
      return (
        <MessageCircle
          size={23}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.9}
        />
      );
    case ROUTES.TABS.PROFILE:
      return (
        <User
          size={23}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.9}
        />
      );
    default:
      return null;
  }
};

function CustomBottomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <View
      style={[styles.tabBarWrapper, { bottom: bottomInset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarCard}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.iconContainer}>
                {renderTabIcon(route.name, isFocused)}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {label}
              </Text>
              <View
                style={[
                  styles.activeIndicator,
                  isFocused && styles.activeIndicatorActive,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();
const renderCustomTabBar = (props) => <CustomBottomTabBar {...props} />;

export function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={renderCustomTabBar}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name={ROUTES.TABS.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.DISCOVERY}
        component={DiscoveryScreen}
        options={{ tabBarLabel: 'Party' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.CHAT}
        component={ChatListScreen}
        options={{ tabBarLabel: 'Chat' }}
      />
      <Tab.Screen
        name={ROUTES.TABS.PROFILE}
        component={ProfileScreen}
        options={{ tabBarLabel: 'Mine' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 14,
    right: 14,
    zIndex: 50,
  },
  tabBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    height: 50,
    borderRadius: 36,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(241, 245, 249, 0.95)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 3,
  },
  iconContainer: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11.5,
    marginTop: 1,
  },
  tabLabelActive: {
    color: '#7C3AED',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#475569',
    fontWeight: '500',
  },
  activeIndicator: {
    width: 26,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'transparent',
    marginTop: 1,
  },
  activeIndicatorActive: {
    backgroundColor: '#7C3AED',
  },
});

export default BottomTabNavigator;
