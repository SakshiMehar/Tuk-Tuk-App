import { Tabs, useRouter } from "expo-router";
import { Home, MessageCircle, Mic, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { APP_BG, APP_PURPLE_LIGHT } from "../../src/constants/theme";
import { getToken, hasAcceptedTerms } from "../../src/store/authStore";

// Solid purple modern house with doorway arch matching uploaded design
const ActiveHomeIcon = () => (
  <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10.84 2.45a1.8 1.8 0 0 1 2.32 0l7.2 6.06c.41.34.64.85.64 1.39V19a2 2 0 0 1-2 2h-3a1 1 0 0 1-1-1v-4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V9.9c0-.54.23-1.05.64-1.39l7.2-6.06z"
      fill="#7C3AED"
    />
  </Svg>
);

const renderTabIcon = (name, isFocused) => {
  const activeColor = "#7C3AED";
  const inactiveColor = "#475569";

  switch (name) {
    case "home":
      return isFocused ? (
        <ActiveHomeIcon />
      ) : (
        <Home size={23} color={inactiveColor} strokeWidth={2} />
      );
    case "party":
      return (
        <Mic
          size={23}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.9}
        />
      );
    case "chat":
      return (
        <MessageCircle
          size={23}
          color={isFocused ? activeColor : inactiveColor}
          strokeWidth={isFocused ? 2.2 : 1.9}
        />
      );
    case "profile":
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

const CustomBottomTabBar = ({ state, descriptors, navigation, insets }) => {
  const bottomInset = Math.max(insets.bottom, 6);

  return (
    <View
      style={[styles.tabBarWrapper, { bottom: bottomInset }]}
      pointerEvents="box-none"
    >
      <View style={styles.tabBarCard}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          if (route.name === "blind-pick" || options.href === null) return null;

          const isFocused = state.index === index;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
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
};

const TabLayout = () => {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const guardSession = async () => {
      try {
        const [token, termsAccepted] = await Promise.all([
          getToken(),
          hasAcceptedTerms(),
        ]);

        if (cancelled) return;

        if (!token || !termsAccepted) {
          router.replace("/login");
          return;
        }

        setReady(true);
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    };

    guardSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: APP_BG,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={APP_PURPLE_LIGHT} />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: APP_BG },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: "Party",
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mine",
        }}
      />

    </Tabs>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 50,
  },
  tabBarCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 36,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.95)",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.09,
    shadowRadius: 18,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingBottom: 3,
  },
  iconContainer: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 11.5,
    marginTop: 1,
  },
  tabLabelActive: {
    color: "#7C3AED",
    fontWeight: "700",
  },
  tabLabelInactive: {
    color: "#475569",
    fontWeight: "500",
  },
  activeIndicator: {
    width: 26,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "transparent",
    marginTop: 1,
  },
  activeIndicatorActive: {
    backgroundColor: "#7C3AED",
  },
});

export default TabLayout;
