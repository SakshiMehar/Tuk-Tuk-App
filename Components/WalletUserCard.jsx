import { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import { VIP_XP_THRESHOLD } from "../src/constants/vip";

/**
 * Dark user-info card for the wallet/recharge screen — avatar, username, and
 * VIP XP progress, matching the reference design. Self-loads the current user;
 * pass `onPress` to make it act as a button (e.g. open the recharge modal).
 *
 * xpCurrent/xpTarget are optional overrides (e.g. a future higher VIP tier).
 * When omitted, the card shows progress toward VIP_XP_THRESHOLD using the
 * user's real gamification totalXp.
 */
export default function WalletUserCard({ onPress, xpCurrent, xpTarget }) {
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(1);
  const [gamificationXp, setGamificationXp] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedUser, levelResult] = await Promise.all([
        getUser(),
        syncUserLevelForSession(),
      ]);
      if (cancelled) return;
      setUser(storedUser);
      setLevel(levelResult?.level ?? 1);
      setGamificationXp(levelResult?.xp ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const avatarSource = resolveProfileAvatarSource(user);
  const username = user?.name || "User";

  const hasExplicitXp = xpCurrent !== undefined && xpTarget !== undefined;
  const resolvedXpTarget = hasExplicitXp ? xpTarget : VIP_XP_THRESHOLD;
  const resolvedXpCurrent = hasExplicitXp
    ? xpCurrent
    : Math.max(0, Math.min(gamificationXp?.totalXp ?? 0, resolvedXpTarget));
  const progress = resolvedXpTarget > 0 ? Math.min(1, Math.max(0, resolvedXpCurrent / resolvedXpTarget)) : 0;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.card} activeOpacity={0.85} onPress={onPress}>
      <Image source={avatarSource} style={styles.avatar} />
      <View style={styles.infoCol}>
        <Text style={styles.username} numberOfLines={1}>
          {username}
        </Text>
        <Text style={styles.xpText}>
          {resolvedXpCurrent.toLocaleString("en-IN")}/{resolvedXpTarget.toLocaleString("en-IN")}
        </Text>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.levelText}>LV{level}</Text>
        </View>
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(20,20,24,0.85)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  infoCol: {
    flex: 1,
    gap: 6,
  },
  username: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  xpText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#a78bfa",
  },
  levelText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    fontStyle: "italic",
  },
});
