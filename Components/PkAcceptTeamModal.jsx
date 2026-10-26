import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../src/constants/colors";

const SLOT_COUNT = 10;

/** Bottom-sheet shown to the challenged host (Host B) when accepting a
 *  Team gift PK — lets them optionally recruit teammates (teamBMemberIds)
 *  before the accept request goes out. Host B is auto-included by the
 *  backend, same as Host A is on create, so nothing here needs to add
 *  the viewer themselves. Skipping selection and confirming still accepts,
 *  just as a solo team of one (accepting is meant to work either way). */
export default function PkAcceptTeamModal({
  visible,
  onClose,
  hostAName,
  roomUsers = [],
  submitting = false,
  onConfirm,
}) {
  const insets = useSafeAreaInsets();
  const [teamMemberIds, setTeamMemberIds] = useState([]);

  useEffect(() => {
    if (!visible) setTeamMemberIds([]);
  }, [visible]);

  if (!visible) return null;

  const handleSlotPress = (user) => {
    if (!user) return;
    const id = String(user.id);
    setTeamMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm?.(teamMemberIds);
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.grabber} />

        <Text style={styles.title}>Choose your team</Text>
        <Text style={styles.subtitle}>
          {hostAName ? `Accepting ${hostAName}'s challenge — ` : "Accepting the challenge — "}
          pick teammates to fight alongside you (optional).
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          <View style={styles.slotGrid}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => {
              const user = roomUsers[i] ?? null;
              const id = user ? String(user.id) : null;
              const isTeammate = id != null && teamMemberIds.includes(id);
              return (
                <TouchableOpacity
                  key={id ?? i}
                  style={styles.slotItem}
                  activeOpacity={0.75}
                  onPress={() => handleSlotPress(user)}
                  disabled={!user}
                >
                  <View style={[styles.slotCircle, isTeammate && styles.slotCircleTeammate]}>
                    {user ? (
                      user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.slotAvatarImg} contentFit="cover" />
                      ) : (
                        <Text style={styles.slotInitial}>{(user.name || "?").charAt(0).toUpperCase()}</Text>
                      )
                    ) : (
                      <Text style={styles.slotEmptyText}>Empty</Text>
                    )}
                    {isTeammate && <View style={styles.slotBadgeTeammate} />}
                  </View>
                  <Text style={styles.slotNumber} numberOfLines={1}>
                    {user ? user.name : i + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleConfirm}
            disabled={submitting}
            style={styles.confirmWrap}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              {submitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmText}>
                  {teamMemberIds.length ? `Accept with ${teamMemberIds.length} teammate(s)` : "Accept"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15,10,30,0.55)",
    justifyContent: "flex-end",
    zIndex: 50,
    elevation: 50,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: "82%",
    paddingTop: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    marginBottom: 10,
  },
  title: {
    color: Colors.textSlateDark,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.textSlateMuted,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 16,
  },

  body: { paddingBottom: 12 },

  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  slotItem: {
    width: "20%",
    alignItems: "center",
    gap: 6,
  },
  slotCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  slotCircleTeammate: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  slotAvatarImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  slotInitial: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  slotBadgeTeammate: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  slotEmptyText: {
    color: Colors.grayPlaceholder,
    fontSize: 9,
    fontWeight: "700",
  },
  slotNumber: {
    color: Colors.textSlateMuted,
    fontSize: 11,
    fontWeight: "600",
    maxWidth: 60,
    textAlign: "center",
  },

  confirmWrap: {
    marginTop: 22,
  },
  confirmBtn: {
    borderRadius: 26,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
