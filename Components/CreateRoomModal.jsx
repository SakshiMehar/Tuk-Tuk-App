import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
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
import * as ImagePicker from "expo-image-picker";
import { X, Camera } from "lucide-react-native";
import { getUser } from "../src/store/authStore";
import { getAppUserId } from "../src/utils/sessionUser";
import {
  createAndEnterPartyRoom,
  updateRoomCoverPhoto,
} from "../src/services/partyService";
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
  const [roomPhotoUri, setRoomPhotoUri] = useState(null);
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = useCallback(() => {
    setRoomName("");
    setRoomPhotoUri(null);
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

  const handlePickRoomPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Gallery access is required to set a room photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setRoomPhotoUri(result.assets[0].uri);
    }
  };

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
      // Room id always equals the user's own id — no custom/vanity id, so
      // personalRoom stays at its default (true).
      const session = await createAndEnterPartyRoom({
        userId,
        name: trimmedName,
        ...(user?.profilePicUrl || user?.avatarUrl
          ? { profileImageUrl: user.profilePicUrl ?? user.avatarUrl }
          : {}),
      });

      // Upload the picked room photo, if any, now that the room exists.
      // Non-fatal — the room is already created, so a failed photo upload
      // shouldn't block entering it.
      if (roomPhotoUri) {
        try {
          const uploadedUrl = await updateRoomCoverPhoto(session.roomId, { uri: roomPhotoUri });
          if (uploadedUrl) {
            session.room = { ...session.room, profileImageUrl: uploadedUrl };
          }
        } catch (photoErr) {
          Alert.alert(
            "Room photo not saved",
            photoErr?.message || "The room was created, but the photo could not be uploaded."
          );
        }
      }

      refreshWalletBalance();
      onClose();
      onEntered?.(String(session.roomId ?? userId), session.room);
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
                <Text style={styles.title}>Create Room</Text>
                <Text style={styles.subtitle}>Start a new voice room</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
                <X size={20} color={THEME.purpleLight} />
              </TouchableOpacity>
            </View>

            <View style={styles.photoRow}>
              <TouchableOpacity
                style={styles.photoPicker}
                activeOpacity={0.8}
                onPress={handlePickRoomPhoto}
              >
                {roomPhotoUri ? (
                  <>
                    <Image source={{ uri: roomPhotoUri }} style={styles.photoImage} />
                    <View style={styles.photoBadge}>
                      <Camera size={14} color="white" />
                    </View>
                  </>
                ) : (
                  <View style={[styles.photoImage, styles.photoPlaceholder]}>
                    <Camera size={26} color={THEME.purpleLight} />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.photoHint}>Tap to set a room photo (optional)</Text>
            </View>

            <Text style={styles.fieldLabel}>Room ID</Text>
            <View style={[styles.input, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{userId ?? "—"}</Text>
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
  photoRow: {
    alignItems: "center",
    marginBottom: 18,
  },
  photoPicker: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.border,
    borderStyle: "dashed",
  },
  photoBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.card,
  },
  photoHint: {
    color: THEME.textMuted,
    fontSize: 12,
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
  readOnlyInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
  },
  readOnlyText: {
    color: THEME.textMuted,
    fontSize: 15,
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
