import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CreateRoomModal from "./CreateRoomModal";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 16;
const TIER_SLIDE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

// Static placeholder ladder — no backend endpoint for room-premium tiers yet.
const ROOM_TIERS = [
  { level: 1, micSeats: 15, totalValue: 50000 },
  { level: 2, micSeats: 20, totalValue: 90000 },
  { level: 3, micSeats: 24, totalValue: 150000 },
  { level: 4, micSeats: 30, totalValue: 240000 },
  { level: 5, micSeats: 40, totalValue: 400000 },
];

// Each privilege unlocks at `minLevel` — "(x/11)" is derived from how many of these
// are <= the currently selected tab's level.
const PRIVILEGES = [
  { id: "roomSpeed", icon: "speedometer", label: "Room level speed:110%", minLevel: 1 },
  { id: "adminCount", icon: "person-add", label: "Admin number:15", minLevel: 1 },
  { id: "maxUsers", icon: "people", label: "Max number of user in room:500", minLevel: 1 },
  { id: "micCount", icon: "mic", label: "Mic number: 15 mics", minLevel: 1 },
  { id: "entryPerm", icon: "shield-checkmark", label: "Room enter permission: Only followers enter", minLevel: 1 },
  { id: "roomMode", icon: "swap-horizontal", label: "Room mode", minLevel: 1 },
  { id: "roomBg", icon: "image", label: "Custom room background", minLevel: 1 },
  { id: "entranceFx", icon: "sparkles", label: "Room entrance effect", minLevel: 1 },
  { id: "roomFrame", icon: "ribbon", label: "Exclusive room frame", minLevel: 1 },
  { id: "chatBubble", icon: "chatbubble-ellipses", label: "Exclusive chat bubble", minLevel: 2 },
  { id: "broadcast", icon: "megaphone", label: "Global room broadcast", minLevel: 2 },
];

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

// Six-point gem/badge hexagon used for the tier number, and the section-divider
// ribbon shape reused from the other menu panels.
function hexPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = ((30 + 60 * i) * Math.PI) / 180;
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return pts.join(" ");
}

const HEX_SIZE = 110;
const HEX_POINTS = hexPoints(HEX_SIZE / 2, HEX_SIZE / 2, HEX_SIZE / 2 - 4);

function TierBadge({ level }) {
  return (
    <View style={styles.hexWrap}>
      <Svg width={HEX_SIZE} height={HEX_SIZE} viewBox={`0 0 ${HEX_SIZE} ${HEX_SIZE}`}>
        <Polygon points={HEX_POINTS} fill="#3b1a78" stroke="#e879f9" strokeWidth={3} />
      </Svg>
      <View style={styles.hexTextWrap}>
        <Text style={styles.hexText}>{level}</Text>
      </View>
    </View>
  );
}

export default function RoomPremiumPanel() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedLevel, setSelectedLevel] = useState(ROOM_TIERS[0].level);
  const [createRoomVisible, setCreateRoomVisible] = useState(false);
  const tier = ROOM_TIERS.find((t) => t.level === selectedLevel) ?? ROOM_TIERS[0];
  const unlockedCount = PRIVILEGES.filter((p) => p.minLevel <= selectedLevel).length;

  // The mic-count/admin-count/max-users/entry-permission fields this screen shows
  // per tier have no backend field yet (room creation only accepts name + invite
  // list) — so "Create my room" opens the real, already-wired creation flow as-is,
  // rather than a stub, and just doesn't pass the not-yet-supported premium fields.
  const handleCreateRoomEntered = (roomId) => {
    setCreateRoomVisible(false);
    router.push({
      pathname: "/voice-party",
      params: { roomId: String(roomId) },
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.levelTabRow}>
          {ROOM_TIERS.map((t) => {
            const active = t.level === selectedLevel;
            return (
              <TouchableOpacity key={t.level} activeOpacity={0.8} onPress={() => setSelectedLevel(t.level)}>
                <Text style={[styles.levelTabText, active && styles.levelTabTextActive]}>Lv{t.level}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <LinearGradient colors={["#1a0a2e", "#2d1b4e", "#16082a"]} style={styles.hero}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tierScrollContent}
            snapToInterval={TIER_SLIDE_WIDTH}
            decelerationRate="fast"
          >
            {ROOM_TIERS.map((t) => (
              <View key={t.level} style={styles.tierSlide}>
                <TierBadge level={t.level} />
                <View style={styles.podium} />
                <Text style={styles.tierName}>Lv{t.level}</Text>
              </View>
            ))}
          </ScrollView>
        </LinearGradient>

        <LinearGradient
          colors={["rgba(124,77,255,0.28)", "rgba(232,121,249,0.16)"]}
          style={styles.valueBanner}
        >
          <Text style={styles.valueBannerEmoji}>🎁</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.valueBannerText}>
              {tier.micSeats} people mic seated, more people can chat!
            </Text>
            <Text style={styles.valueBannerSub}>
              Total value: <Text style={styles.valueBannerAmount}>{tier.totalValue.toLocaleString("en-IN")}</Text> 💎
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.privilegesDivider}>
          <Ionicons name="arrow-back" size={14} color="rgba(232,121,249,0.6)" />
          <Text style={styles.privilegesDividerText}>Exclusive Privileges</Text>
          <Ionicons name="arrow-forward" size={14} color="rgba(232,121,249,0.6)" />
        </View>
        <Text style={styles.privilegesCount}>({unlockedCount}/{PRIVILEGES.length})</Text>

        <View style={styles.privilegeGrid}>
          {PRIVILEGES.map((p) => {
            const unlocked = p.minLevel <= selectedLevel;
            return (
              <TouchableOpacity
                key={p.id}
                style={styles.privilegeCell}
                activeOpacity={0.8}
                onPress={notWiredYet}
              >
                <View style={[styles.privilegeIconWrap, !unlocked && styles.privilegeIconWrapLocked]}>
                  <Ionicons name={p.icon} size={22} color={unlocked ? "#e879f9" : "rgba(255,255,255,0.25)"} />
                </View>
                <Text
                  style={[styles.privilegeLabel, !unlocked && styles.privilegeLabelLocked]}
                  numberOfLines={2}
                >
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      <LinearGradient
        colors={["rgba(26,10,46,0.98)", "#1a0a2e"]}
        style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={() => setCreateRoomVisible(true)}>
          <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.createBtn}>
            <Text style={styles.createBtnText}>Create my room</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <CreateRoomModal
        visible={createRoomVisible}
        onClose={() => setCreateRoomVisible(false)}
        onEntered={handleCreateRoomEntered}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: CONTENT_PADDING,
  },
  levelTabRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  levelTabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 14,
    fontWeight: "700",
  },
  levelTabTextActive: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
  hero: {
    borderRadius: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },
  tierScrollContent: {
    alignItems: "center",
  },
  tierSlide: {
    width: TIER_SLIDE_WIDTH,
    alignItems: "center",
  },
  hexWrap: {
    width: HEX_SIZE,
    height: HEX_SIZE,
    marginBottom: 12,
  },
  hexTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  hexText: {
    color: "white",
    fontSize: 40,
    fontWeight: "900",
  },
  podium: {
    width: 180,
    height: 46,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    backgroundColor: "rgba(124,77,255,0.12)",
    marginBottom: 10,
  },
  tierName: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    fontStyle: "italic",
  },
  valueBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    padding: 14,
    marginBottom: 20,
  },
  valueBannerEmoji: {
    fontSize: 36,
  },
  valueBannerText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  valueBannerSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  valueBannerAmount: {
    color: "#e879f9",
    fontSize: 16,
    fontWeight: "900",
  },
  privilegesDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  privilegesDividerText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  privilegesCount: {
    textAlign: "center",
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginBottom: 20,
  },
  privilegeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  privilegeCell: {
    width: "31%",
    alignItems: "center",
    marginBottom: 20,
  },
  privilegeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  privilegeIconWrapLocked: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  privilegeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  privilegeLabelLocked: {
    color: "rgba(255,255,255,0.3)",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  createBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  createBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
