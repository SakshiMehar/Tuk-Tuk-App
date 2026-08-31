import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  loadUserSettings,
  updateUserSettings,
} from "../src/services/userSettingsService";

export default function MessageNotification() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const footerBottomPad = Math.max(insets.bottom, 16);

  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Keep a snapshot so updateUserSettings can merge correctly
  const [settingsSnapshot, setSettingsSnapshot] = useState({});

  // Load persisted setting on mount
  useEffect(() => {
    loadUserSettings()
      .then((settings) => {
        // messageNotification maps to notificationOption from the settings object;
        // treat anything other than "No notifications" as enabled.
        const isEnabled =
          settings.notificationOption !== "No notifications";
        setEnabled(isEnabled);
        setSettingsSnapshot(settings);
      })
      .catch(() => {
        // Keep default (enabled) on load failure — non-critical
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (value) => {
    if (saving) return;
    setEnabled(value);
    setSaving(true);
    try {
      const updated = await updateUserSettings(
        {
          notificationOption: value
            ? "All notifications"
            : "No notifications",
        },
        settingsSnapshot
      );
      setSettingsSnapshot(updated);
    } catch {
      // Revert on failure
      setEnabled(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Message Notification</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centerArea}>
          <View style={styles.phoneMock}>
            <View style={styles.messagePill}>
              <View style={styles.iconCircle}>
                <Ionicons name="chatbubble-ellipses" size={18} color="#a78bfa" />
              </View>
              <Text style={styles.pillText}>You received a new message</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>
        <View style={styles.optionRow}>
          <View style={styles.optionTextWrap}>
            <Text style={styles.optionTitle}>Message Notification</Text>
            <Text style={styles.optionSub}>
              {enabled ? "Notifications are on" : "Notifications are off"}
            </Text>
          </View>
          {loading ? (
            <ActivityIndicator color="#a78bfa" style={{ marginRight: 4 }} />
          ) : (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              disabled={saving}
              trackColor={{ false: "rgba(255,255,255,0.2)", true: "#7c3aed" }}
              thumbColor="#fff"
              style={styles.switch}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    textAlign: "center",
  },
  headerSpacer: {
    width: 42,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  centerArea: {
    alignItems: "center",
    marginTop: 32,
  },
  phoneMock: {
    width: 260,
    height: 380,
    borderRadius: 28,
    borderWidth: 12,
    borderColor: "rgba(124,77,255,0.12)",
    backgroundColor: "rgba(26, 10, 46, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
  },
  messagePill: {
    width: "86%",
    backgroundColor: "rgba(124, 77, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.2)",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(167, 139, 250, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pillText: {
    color: "white",
    fontWeight: "800",
    fontSize: 15,
    flex: 1,
  },
  footer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(13, 6, 24, 0.92)",
  },
  optionRow: {
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 12,
  },
  optionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
  },
  optionSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
});
