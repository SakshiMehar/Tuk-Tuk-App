import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { HelpCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "../src/constants/colors";

const TABS = [
  { id: "vote", label: "Vote PK" },
  { id: "personal", label: "Personal gift\nPK" },
  { id: "team", label: "Team gift pk" },
];

const TEAMS = [
  {
    id: "yellow",
    label: "Yellow team",
    colors: [Colors.accentGold, "#f59e0b"],
    glow: "rgba(251,191,36,0.5)",
  },
  {
    id: "blue",
    label: "Blue team",
    colors: [Colors.accentCyan, Colors.primary],
    glow: "rgba(0,224,255,0.5)",
  },
];

/** Small glossy circles scattered over a team's gradient half — the
 *  "bubble" texture from the reference design, recolored to sit on our
 *  own gradients instead of the reference's dotted pattern. */
function TeamBubbles() {
  return (
    <>
      <View style={[styles.teamBubble, { width: 34, height: 34, top: -12, left: -8 }]} />
      <View style={[styles.teamBubble, { width: 14, height: 14, top: 10, right: 18, opacity: 0.22 }]} />
      <View style={[styles.teamBubble, { width: 20, height: 20, bottom: -8, right: -6 }]} />
      <View style={[styles.teamBubble, { width: 9, height: 9, bottom: 10, left: 28, opacity: 0.28 }]} />
    </>
  );
}

const DURATIONS = [1, 3, 5, 10, 30];

const SLOT_COUNT = 10;

/** Bottom-sheet PK battle setup screen — light theme version of the
 *  reference "Personal gift PK" design (tabs, 10 opponent slots, duration
 *  picker, jackpot toggle). Opened from the room's Play Center "PK" button.
 *  No gift is chosen here — Confirm just creates the battle (opponent +
 *  duration); gifting happens afterwards through the room's normal gift
 *  sheet once the battle card is live, same as any other room gift. */
export default function PkBattleModal({
  visible,
  onClose,
  roomUsers = [],
  submitting = false,
  onConfirm,
}) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedTeam, setSelectedTeam] = useState("yellow");
  const [durationMinutes, setDurationMinutes] = useState(1);
  const [jackpotMode, setJackpotMode] = useState(false);
  const [opponentId, setOpponentId] = useState(null);
  const [teamMemberIds, setTeamMemberIds] = useState([]);

  const isVote = activeTab === "vote";
  const isTeam = activeTab === "team";
  const isPersonal = activeTab === "personal";

  useEffect(() => {
    if (!visible) {
      setOpponentId(null);
      setTeamMemberIds([]);
    }
  }, [visible]);

  if (!visible) return null;

  const handleSlotPress = (user) => {
    if (!user) {
      Alert.alert("No one here", "This seat is empty right now.");
      return;
    }
    const id = String(user.id);
    if (id === opponentId) {
      setOpponentId(null);
      return;
    }
    if (teamMemberIds.includes(id)) {
      setTeamMemberIds((prev) => prev.filter((x) => x !== id));
      return;
    }
    if (!opponentId) {
      setOpponentId(id);
      return;
    }
    if (isTeam) {
      setTeamMemberIds((prev) => [...prev, id]);
    } else {
      setOpponentId(id);
    }
  };

  const handleConfirm = () => {
    if (!opponentId) {
      Alert.alert("Select an opponent", "Pick who you want to challenge.");
      return;
    }
    onConfirm?.({
      mode: activeTab,
      team: isTeam ? selectedTeam : null,
      opponentId,
      teamMemberIds: isTeam ? teamMemberIds : [],
      durationMinutes,
      jackpotMode: isPersonal ? jackpotMode : false,
    });
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.grabber} />

        {/* Tabs */}
        <View style={styles.tabRow}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabItem}
                activeOpacity={0.85}
                onPress={() => setActiveTab(tab.id)}
              >
                {active ? (
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabActiveBg}
                  >
                    <Text style={styles.tabTextActive}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.tabText}>{tab.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
          {/* Team switcher (Team gift PK only) */}
          {isTeam && (
            <View style={styles.teamRow}>
              <View
                style={[
                  styles.teamCardShadow,
                  { shadowColor: TEAMS.find((t) => t.id === selectedTeam)?.glow },
                ]}
              >
                <View style={styles.teamCard}>
                  {TEAMS.map((team) => {
                    const active = team.id === selectedTeam;
                    return (
                      <TouchableOpacity
                        key={team.id}
                        activeOpacity={0.88}
                        style={styles.teamHalf}
                        onPress={() => setSelectedTeam(team.id)}
                      >
                        {active ? (
                          <LinearGradient
                            colors={team.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.teamHalfBg}
                          >
                            <TeamBubbles />
                            <Text style={styles.teamHalfTextActive}>{team.label}</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.teamHalfBgInactive}>
                            <Text style={styles.teamHalfText}>{team.label}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <View style={styles.teamVsBadge}>
                    <Text style={styles.teamVsText}>VS</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.teamHelpBtn}
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert(
                    "How it works",
                    "Each team's PK score is based on the total value of gifts their supporters send during the battle.",
                  )
                }
              >
                <HelpCircle size={15} color={Colors.textSlateMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Calculation hint */}
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>
              {isVote ? "Each person can vote once a time" : "Calculated by the gifts received"}
            </Text>
            {isPersonal && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  Alert.alert(
                    "How it works",
                    "Each side's PK score is based on the total value of gifts their supporters send during the battle.",
                  )
                }
              >
                <HelpCircle size={15} color={Colors.textSlateMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Opponent / teammate slots — seated room members only */}
          <Text style={styles.sectionLabel}>
            {isTeam ? "Choose an opponent + teammates" : "Choose an opponent"}
          </Text>
          <View style={styles.slotGrid}>
            {Array.from({ length: SLOT_COUNT }).map((_, i) => {
              const user = roomUsers[i] ?? null;
              const id = user ? String(user.id) : null;
              const isOpponent = id != null && id === opponentId;
              const isTeammate = id != null && teamMemberIds.includes(id);
              return (
                <TouchableOpacity
                  key={id ?? i}
                  style={styles.slotItem}
                  activeOpacity={0.75}
                  onPress={() => handleSlotPress(user)}
                  disabled={!user}
                >
                  <View
                    style={[
                      styles.slotCircle,
                      isOpponent && styles.slotCircleOpponent,
                      isTeammate && styles.slotCircleTeammate,
                    ]}
                  >
                    {user ? (
                      user.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.slotAvatarImg} contentFit="cover" />
                      ) : (
                        <Text style={styles.slotInitial}>{(user.name || "?").charAt(0).toUpperCase()}</Text>
                      )
                    ) : (
                      <Text style={styles.slotEmptyText}>Empty</Text>
                    )}
                    {isOpponent && (
                      <View style={styles.slotBadgeOpponent}>
                        <Text style={styles.slotBadgeText}>VS</Text>
                      </View>
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

          {/* Duration selector */}
          <Text style={styles.sectionLabel}>Select duration (minutes)</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((mins) => {
              const active = mins === durationMinutes;
              return (
                <TouchableOpacity
                  key={mins}
                  activeOpacity={0.85}
                  onPress={() => setDurationMinutes(mins)}
                >
                  {active ? (
                    <LinearGradient
                      colors={[Colors.accentGold, Colors.primary]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.durationPillActive}
                    >
                      <Text style={styles.durationTextActive}>{mins}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.durationPill}>
                      <Text style={styles.durationText}>{mins}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm */}
          {(() => {
            const ready = Boolean(opponentId);
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                disabled={submitting}
                style={styles.confirmWrap}
              >
                <LinearGradient
                  colors={
                    ready ? [Colors.primary, Colors.secondary] : [Colors.borderLight, Colors.borderLight]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.confirmBtn}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={[styles.confirmText, !ready && styles.confirmTextDisabled]}>
                      Confirm
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })()}

          {/* Jackpot mode (Personal gift PK only) */}
          {isPersonal && (
            <View style={styles.jackpotRow}>
              <Text style={styles.jackpotLabel}>Jackpot mode</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setJackpotMode((v) => !v)}
                style={[styles.toggleTrack, jackpotMode && styles.toggleTrackActive]}
              >
                <View style={[styles.toggleThumb, jackpotMode && styles.toggleThumbActive]} />
              </TouchableOpacity>
            </View>
          )}
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

  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  tabItem: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  tabActiveBg: {
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabText: {
    color: Colors.textSlateMuted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 10,
  },
  tabTextActive: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },

  body: { paddingBottom: 12 },

  // Team switcher (Team gift PK)
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  teamCardShadow: {
    flex: 1,
    borderRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  teamCard: {
    flexDirection: "row",
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  teamHalf: { flex: 1 },
  teamHalfBg: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  teamHalfBgInactive: {
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSlateLight,
  },
  teamHalfText: {
    color: Colors.textSlateMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  teamHalfTextActive: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  teamBubble: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.9)",
    opacity: 0.16,
  },
  teamVsBadge: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -16,
    marginLeft: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  teamVsText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },
  teamHelpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },

  // Hint row
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  hintText: {
    color: Colors.textSlateMuted,
    fontSize: 12,
    fontWeight: "600",
  },

  // Slot grid
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
  slotCircleOpponent: {
    borderWidth: 2,
    borderColor: Colors.error,
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
  slotBadgeOpponent: {
    position: "absolute",
    bottom: -4,
    alignSelf: "center",
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  slotBadgeText: {
    color: "white",
    fontSize: 8,
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

  // Section label
  sectionLabel: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 20,
    marginBottom: 10,
  },

  // Gift row
  giftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  giftIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primaryAlpha12,
    alignItems: "center",
    justifyContent: "center",
  },
  giftIconEmoji: { fontSize: 18 },
  giftRowText: {
    flex: 1,
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "600",
  },
  giftChevronOpen: { transform: [{ rotate: "90deg" }] },

  giftPickerScroll: { marginTop: 10 },
  giftPickerContent: { gap: 10, paddingVertical: 2 },
  giftPickerItem: {
    width: 84,
    alignItems: "center",
    gap: 3,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  giftPickerItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryAlpha10,
  },
  giftPickerEmoji: { fontSize: 24 },
  giftPickerName: {
    color: Colors.textSlateDark,
    fontSize: 11,
    fontWeight: "700",
  },
  giftPickerPrice: {
    color: Colors.textSlateMuted,
    fontSize: 10,
    fontWeight: "600",
  },

  // Duration
  durationRow: {
    flexDirection: "row",
    gap: 10,
  },
  durationPill: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.bgSlateLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  durationPillActive: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  durationText: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "700",
  },
  durationTextActive: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },

  // Confirm
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
  confirmTextDisabled: {
    color: Colors.grayPlaceholder,
  },

  // Jackpot mode
  jackpotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 8,
  },
  jackpotLabel: {
    color: Colors.textSlateDark,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.borderLight,
    padding: 3,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: Colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
});
