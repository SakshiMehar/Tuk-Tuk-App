import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Image,
  Switch,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function MessageNotification() {
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
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
      </View>

      <View style={styles.centerArea}>
        <View style={styles.phoneMock}>
          <View style={styles.messagePill}>
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#a78bfa" />
            </View>
            <Text style={styles.pillText}>You received a new message</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.openBtn} activeOpacity={0.85}>
          <Text style={styles.openBtnText}>Open</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.optionRow}
      >
        <View>
          <Text style={styles.optionTitle}>Message Notification</Text>
          <Text style={styles.optionSub}>Close will not show it</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: "rgba(255,255,255,0.2)", true: "#7c3aed" }}
          thumbColor="#fff"
          style={styles.switch}
        />
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
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "white",
    flex: 1,
    textAlign: "center",
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
  },
  openBtn: {
    marginTop: 24,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  openBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  optionRow: {
    marginTop: 42,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
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
