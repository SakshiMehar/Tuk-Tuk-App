import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Blocking popup shown when a user tries a level-gated action (e.g. creating
// a room) without meeting the required level. Modeled on ComingSoonModal.jsx
// for visual consistency.
export default function LevelGateModal({ visible, requiredLevel = 5, currentLevel = 1, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            colors={["#1e0a3c", "#2d1b4e"]}
            style={StyleSheet.absoluteFill}
            borderRadius={24}
          />
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔒</Text>
          </View>
          <Text style={styles.title}>Not Eligible Yet</Text>
          <Text style={styles.subtitle}>
            You need to be Level {requiredLevel} or above to create a room. You&apos;re currently Level{" "}
            {currentLevel} — keep chatting, sending gifts, and joining rooms to level up!
          </Text>
          <TouchableOpacity activeOpacity={0.85} onPress={onClose} style={styles.btnWrap}>
            <LinearGradient
              colors={["#7c4dff", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btn}
            >
              <Text style={styles.btnText}>Got it</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  icon: { fontSize: 36 },
  title: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 12,
  },
  btnWrap: {
    marginTop: 22,
    width: "100%",
  },
  btn: {
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
