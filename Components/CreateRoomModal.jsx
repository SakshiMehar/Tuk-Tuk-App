import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle, Camera, Megaphone, Upload, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  createAndEnterPartyRoom,
  updateRoomCoverPhoto,
} from "../src/services/partyService";
import { getUser } from "../src/store/authStore";
import { refreshWalletBalance } from "../src/store/walletStore";
import { getAppUserId } from "../src/utils/sessionUser";

// ---- App brand palette, tuned a touch closer to the home screen's
// magenta hero + violet card gradients while keeping the same dark base ----
const THEME = {
  bg: "#0f0720",
  bgTop: "#241242",
  card: "#470f31",
  cardAlt: "#22133f",
  border: "rgba(167,139,250,0.24)",
  borderStrong: "rgba(167,139,250,0.45)",
  purple: "#7c4dff",
  purpleDeep: "#6a2fe0",
  purpleLight: "#a78bfa",
  pink: "#ff3f93",
  pinkDeep: "#e0298a",
  gold: "#ffd479",
  text: "#ffffff",
  textMuted: "rgba(220,208,255,0.55)",
  textSubtle: "rgba(220,208,255,0.78)",
  inputBg: "rgba(255,255,255,0.06)",
  inputBorder: "rgba(167,139,250,0.28)",
  danger: "#ff5c8a",
};

const GRADIENT_ACCENT = [THEME.pinkDeep, THEME.purpleDeep];

export default function CreateRoomModal({ visible, onClose, onEntered }) {
  const insets = useSafeAreaInsets();
  const [roomName, setRoomName] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [roomPhotoUri, setRoomPhotoUri] = useState(null);
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPhotoRequired, setShowPhotoRequired] = useState(false);
  const [validationType, setValidationType] = useState(null);

  const resetForm = useCallback(() => {
    setRoomName("");
    setAnnouncement("");
    setRoomPhotoUri(null);
    setShowPhotoRequired(false);
    setValidationType(null);
  }, []);

  const loadModalData = useCallback(async () => {
    try {
      const [resolvedUserId, user] = await Promise.all([
        getAppUserId(),
        getUser(),
      ]);
      setUserId(resolvedUserId ? String(resolvedUserId) : null);
      setRoomName(
        user?.name?.trim() ||
          user?.username?.trim() ||
          (resolvedUserId ? `Room ${resolvedUserId}` : "My Room"),
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
      Alert.alert(
        "Permission needed",
        "Gallery access is required to set a room photo.",
      );
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
      setShowPhotoRequired(false);
    }
  };

  const handleCreate = async () => {
    const trimmedName = roomName.trim();
    const trimmedAnnouncement = announcement.trim();

    // Room name required
    if (!trimmedName) {
      setValidationType("roomName");
      setShowPhotoRequired(true);
      return;
    }

    // Announcement required
    if (!trimmedAnnouncement) {
      setValidationType("announcement");
      setShowPhotoRequired(true);
      return;
    }

    // Room picture required
    if (!roomPhotoUri) {
      setValidationType("photo");
      setShowPhotoRequired(true);
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
        userId,
        name: trimmedName,
        announcement: trimmedAnnouncement,
        body: trimmedAnnouncement,
        ...(user?.profilePicUrl || user?.avatarUrl
          ? {
              userProfileImageUrl: user.profilePicUrl ?? user.avatarUrl,
            }
          : {}),
      });

      const targetRoomId = String(session.roomId ?? userId);

      if (roomPhotoUri) {
        try {
          await updateRoomCoverPhoto(targetRoomId, {
            uri: roomPhotoUri,
          });
        } catch (uploadErr) {
          console.warn("[CreateRoomModal] Cover photo upload failed:", uploadErr);
        }
      }

      refreshWalletBalance();

      onClose();

      onEntered?.(targetRoomId, session.room);
    } catch (err) {
      const msg = err?.message || "Please try again.";

      Alert.alert(
        /not found/i.test(msg) ? "Room not ready" : "Could not create room",
        /not found/i.test(msg)
          ? "The room was not created on the server yet. Please try again in a moment."
          : msg,
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Contextual popup content — icon + copy switch based on which field is missing
  const popupIcon =
    validationType === "roomName" ? (
      <AlertTriangle size={24} color="#FFFFFF" />
    ) : validationType === "announcement" ? (
      <Megaphone size={24} color="#FFFFFF" />
    ) : (
      <Camera size={24} color="#FFFFFF" />
    );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <LinearGradient
              colors={[THEME.bgTop, THEME.card]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.grabber} />

            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Create Room</Text>
                <Text style={styles.subtitle}>Start a new voice room</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={12}
              >
                <X size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Room photo picker — centered upload button */}
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoPickerWrap}
                activeOpacity={0.8}
                onPress={handlePickRoomPhoto}
              >
                <View
                  style={[
                    styles.photoPicker,
                    !roomPhotoUri && showPhotoRequired
                      ? styles.photoPickerError
                      : null,
                  ]}
                >
                  {roomPhotoUri ? (
                    <Image
                      source={{ uri: roomPhotoUri }}
                      style={styles.photoImage}
                    />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <LinearGradient
                        colors={GRADIENT_ACCENT}
                        style={styles.uploadIconCircle}
                      >
                        <Upload size={17} color="#FFFFFF" />
                      </LinearGradient>
                      <Text style={styles.uploadText}>Upload</Text>
                    </View>
                  )}
                </View>

                <LinearGradient
                  colors={GRADIENT_ACCENT}
                  style={styles.photoBadge}
                >
                  <Camera size={11} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.profileTitle}>Room Profile Picture *</Text>
              <Text style={styles.photoHint}>
                Add a picture to create your room
              </Text>
            </View>

            <View style={styles.divider} />

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

            <View style={styles.announcementLabelRow}>
              <Text style={styles.fieldLabel}>Announcement</Text>
            </View>

            <TextInput
              style={[styles.input, styles.announcementInput]}
              value={announcement}
              onChangeText={setAnnouncement}
              placeholder="Write an announcement for your room..."
              placeholderTextColor={THEME.textMuted}
              maxLength={150}
              multiline
              textAlignVertical="top"
            />

            <View
              style={[
                styles.actions,
                { paddingBottom: Math.max(insets.bottom, 6) },
              ]}
            >
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createBtnWrap}
                onPress={handleCreate}
                activeOpacity={0.85}
                disabled={submitting}
              >
                <LinearGradient
                  colors={GRADIENT_ACCENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createBtn}
                >
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

      {/* Photo / field required popup */}
      <Modal
        visible={showPhotoRequired}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoRequired(false)}
      >
        <View style={styles.popupOverlay}>
          <View style={styles.photoRequiredCard}>
            <LinearGradient
              colors={GRADIENT_ACCENT}
              style={styles.popupIcon}
            >
              {popupIcon}
            </LinearGradient>
            <Text style={styles.popupTitle}>
              {validationType === "roomName"
                ? "Room name required"
                : validationType === "announcement"
                  ? "Announcement required"
                  : "Upload your room profile"}
            </Text>
            <Text style={styles.popupMessage}>
              {validationType === "roomName"
                ? "Please enter a name for your room."
                : validationType === "announcement"
                  ? "Please enter an announcement for your room."
                  : "A room profile picture is required before you can create your room."}
            </Text>

            {validationType === "photo" ? (
              <>
                <TouchableOpacity
                  style={styles.popupUploadBtn}
                  onPress={handlePickRoomPhoto}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={GRADIENT_ACCENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.popupUploadGradient}
                  >
                    <Upload size={16} color="#FFFFFF" />
                    <Text style={styles.popupUploadText}>Upload Photo</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowPhotoRequired(false)}
                  style={styles.popupCancel}
                >
                  <Text style={styles.popupCancelText}>Maybe Later</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.popupUploadBtn}
                onPress={() => setShowPhotoRequired(false)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={GRADIENT_ACCENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popupUploadGradient}
                >
                  <Text style={styles.popupUploadText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(13, 4, 35, 0.65)",
    justifyContent: "flex-end",
  },
  sheetWrap: {
    maxHeight: "72%",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopColor: "#ffffff", 
    borderTopWidth: 2,
    borderTopRightRadius: 26,
    overflow: "hidden",
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 24,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.35)",
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.16)",
    borderWidth: 1,
    borderColor: "gray",
  },
  photoSection: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  photoPickerWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },
  photoPicker: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.cardAlt,
    borderWidth: 1.5,
    borderColor: THEME.borderStrong,
  },
  photoPickerError: {
    borderWidth: 2,
    borderColor: THEME.danger,
  },
  photoImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.cardAlt,
  },
  photoPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(167,139,250,0.4)",
    borderStyle: "dashed",
  },
  uploadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
  },
  uploadText: {
    color: THEME.purpleLight,
    fontSize: 9,
    fontWeight: "700",
  },
  photoBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.card,
  },
  profileTitle: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3,
  },
  photoHint: {
    color: THEME.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginBottom: 12,
  },
  fieldLabel: {
    color: THEME.textSubtle,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 5,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: Platform.OS === "ios" ? 9 : 7,
    color: THEME.text,
    fontSize: 13,
    marginBottom: 9,
  },
  readOnlyInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: THEME.border,
    justifyContent: "center",
  },
  readOnlyText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  announcementLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  announcementInput: {
    minHeight: 44,
    maxHeight: 60,
    marginBottom: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 9,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
  },
  cancelText: {
    color: THEME.purpleLight,
    fontSize: 13,
    fontWeight: "800",
  },
  createBtnWrap: {
    flex: 1.4,
    borderRadius: 12,
    shadowColor: THEME.pink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  createBtn: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    minHeight: 42,
  },
  createText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(4,0,14,0.8)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  photoRequiredCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: THEME.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  popupIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  popupTitle: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  popupMessage: {
    color: THEME.textMuted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  popupUploadBtn: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  popupUploadGradient: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  popupUploadText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  popupCancel: {
    paddingVertical: 10,
  },
  popupCancelText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
});