import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const settingSections = [
  {
    id: "account",
    items: [
      { icon: "person-circle-outline", label: "Account", type: "route", route: "account" },
      { icon: "options-outline", label: "Match switch", type: "action" },
      { icon: "shield-checkmark-outline", label: "Privacy", type: "route", route: "privacy-policy" },
      { icon: "notifications-outline", label: "Notifications", type: "action" },
      { icon: "chatbubble-outline", label: "Message Notification", type: "action" },
      { icon: "person-remove-outline", label: "Blocked list", type: "action" },
      { icon: "language-outline", label: "System language", type: "action" },
      { icon: "earth-outline", label: "Content Language", type: "action" },
      { icon: "share-social-outline", label: "Share app", type: "action" },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      { icon: "refresh-circle-outline", label: "Check for update", type: "action" },
      { icon: "help-circle-outline", label: "Help & feedback", type: "action" },
      { icon: "document-text-outline", label: "Privacy policy", type: "route", route: "privacy-policy" },
      { icon: "book-outline", label: "Terms of use", type: "route", route: "terms-of-use" },
      { icon: "information-circle-outline", label: "About", type: "action" },
    ],
  },
  {
    id: "cache",
    title: "Storage",
    items: [
      { icon: "trash-outline", label: "Clear cache", type: "action", subtitle: "22.21M" },
      { icon: "chatbubbles-outline", label: "Clear chat cache", type: "action" },
    ],
  },
];

export default function Settings() {
  const router = useRouter();
  const [cacheSize] = useState("22.21M");

  const handleItemPress = (item) => {
    if (item.type === "route") {
      if (item.route) {
        router.push(`/${item.route}`);
      }
      return;
    }

    switch (item.label) {
      case "Match switch":
        Alert.alert("Match switch", "Toggle match switch settings coming soon.");
        break;
      case "Notifications":
      case "Message Notification":
      case "Blocked list":
      case "System language":
      case "Content Language":
      case "Share app":
      case "Check for update":
      case "Help & feedback":
      case "About":
        Alert.alert(item.label, "This setting is not configured yet.");
        break;
      case "Clear cache":
        Alert.alert("Clear cache", "Cache cleared successfully.");
        break;
      case "Clear chat cache":
        Alert.alert("Clear chat cache", "Chat cache cleared successfully.");
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Customize your app preferences.</Text>

        {settingSections.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={styles.settingItem}
                activeOpacity={0.75}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#d8cbff" />
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.sectionCard, styles.dangerButton]}
          activeOpacity={0.8}
          onPress={() => Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log out", style: "destructive", onPress: () => router.replace("/login") },
          ])}
        >
          <Text style={styles.dangerText}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionCard, styles.deleteButton]}
          activeOpacity={0.8}
          onPress={() => Alert.alert("Delete account", "This action cannot be undone.")}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  screenTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  itemSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dangerText: {
    color: "#ff6b81",
    fontSize: 16,
    fontWeight: "800",
    padding: 14,
  },
  deleteButton: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  deleteText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "700",
    padding: 14,
  },
});
