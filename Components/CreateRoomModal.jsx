import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { getUser } from "../src/store/authStore";
import { getAppUserId } from "../src/utils/sessionUser";
import { createAndEnterPartyRoom } from "../src/services/partyService";
import { refreshWalletBalance } from "../src/store/walletStore";

const THEME = {
  bg: "#0f0720",
  card: "#1a1035",
  border: "rgba(167,139,250,0.22)",
  purple: "#7c4dff",
  purpleLight: "#a78bfa",
  text: "#ffffff",
  textMuted: "rgba(167,139,250,0.6)",
};

export default function CreateRoomModal({ visible, onClose, onEntered }) {
  const insets = useSafeAreaInsets();
  const [roomName, setRoomName] = useState("");
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRoomName("");
  }, []);

  const loadModalData = useCallback(async () => {
    try {
      const [resolvedUserId, user] = await Promise.all([getAppUserId(), getUser()]);
      setUserId(resolvedUserId ? String(resolvedUserId) : null);
      setRoomName(
        user?.name?.trim() ||
          user?.username?.trim() ||
          (resolvedUserId ? `Room ${resolvedUserId}` : "My Room")
      );
    } catch {
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    resetForm();
    loadModalData();
  }, [visible, loadModalData, resetForm]);

  const handleCreate = async () => {
    const trimmedName = roomName.trim();
    if (!trimmedName) {
      Alert.alert("Room name required", "Please enter a name for your room.");
      return;
    }
    if (!userId) {
      Alert.alert("Sign in required", "Please log in again to create a room.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await getUser();
      const session = await createAndEnterPartyRoom({
        roomId: userId,
        name: trimmedName,
        ...(user?.profilePicUrl || user?.avatarUrl
          ? { profileImageUrl: user.profilePicUrl ?? user.avatarUrl }
          : {}),
      });
      refreshWalletBalance();
      onClose();
      onEntered?.(String(session.roomId ?? userId));
    } catch (err) {
      const msg = err?.message || "Please try again.";
      Alert.alert(
        /not found/i.test(msg) ? "Room not ready" : "Could not create room",
        /not found/i.test(msg)
          ? "The room was not created on the server yet. Please try again in a moment."
          : msg
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <LinearGradient colors={["#1e0a3c", "#160d30"]} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Create My Room</Text>
                <Text style={styles.subtitle}>Your room ID will match your user ID</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <X size={20} color={THEME.purpleLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.roomIdBox}>
              <Text style={styles.roomIdLabel}>Room ID</Text>
              <Text style={styles.roomIdValue}>{userId ?? "—"}</Text>
            </View>

            <Text style={styles.fieldLabel}>Room name</Text>
            <TextInput
              style={styles.input}
              value={roomName}
              onChangeText={setRoomName}
              placeholder="Enter room name"
              placeholderTextColor={THEME.textMuted}
              maxLength={60}
              autoCapitalize="words"
            />

            <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtnWrap}
                onPress={handleCreate}
                activeOpacity={0.85}
                disabled={submitting}
              >
                <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.createBtn}>
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.createText}>Create & Enter</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  sheetWrap: {
    maxHeight: "92%",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  title: {
    color: THEME.text,
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.12)",
  },
  roomIdBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  roomIdLabel: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  roomIdValue: {
    color: THEME.purpleLight,
    fontSize: 16,
    fontWeight: "800",
  },
  fieldLabel: {
    color: THEME.purpleLight,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    color: THEME.text,
    fontSize: 15,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  cancelText: {
    color: THEME.purpleLight,
    fontSize: 15,
    fontWeight: "700",
  },
  createBtnWrap: {
    flex: 1.4,
  },
  createBtn: {
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 48,
  },
  createText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
