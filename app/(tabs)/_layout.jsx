import { Tabs, useRouter } from "expo-router";
import { Home, MessageCircle, Mic, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getToken, hasAcceptedTerms } from "../../src/store/authStore";

const TabLayout = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);
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
          backgroundColor: "#0d0618",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#ffffff",
        tabBarInactiveTintColor: "#aeb4c4",
        tabBarStyle: {
          backgroundColor: "rgba(21,22,58,0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(166,152,255,0.28)",
          paddingTop: 6,
          paddingBottom: bottomInset,
          height: 65 + bottomInset,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="party"
        options={{
          title: "Party",
          tabBarIcon: ({ color, size }) => <Mic size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Mine",
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="blind-pick" options={{ href: null }} />
    </Tabs>
  );
};

export default TabLayout;
