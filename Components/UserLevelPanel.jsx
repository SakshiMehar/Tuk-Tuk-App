import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Circle, Polygon, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import { loadMyVipAssets } from "../src/services/vipService";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

const LEVEL_TABS = ["Active Level", "Wealth Level", "Charm Level", "Game Level"];

// Placeholder rates/targets — the gamification API gives current totals (room time,
// gifts sent, coins spent) but not the per-action XP rate or daily target for each row,
// so only the "current" values below get replaced with real numbers where there's a
// clean 1:1 field to use.
const LEVEL_UP_WAYS = [
  { label: "Diamond cost", rate: "1 diamond / 1 Exp", current: 0, target: 2000 },
  { label: "Stay in room", rate: "10 mins / 10 Exp", current: 0, target: 200 },
  { label: "Send Messages to Friends", rate: "1 message / 10 Exp", current: 0, target: 50 },
  { label: "Gold cost", rate: "10 golds / 1 Exp", current: 0, target: 50 },
];

const LEVEL_MEDALS = [
  { lv: 1, colors: ["#c084fc", "#7c4dff"] },
  { lv: 10, colors: ["#818cf8", "#6366f1"] },
  { lv: 21, colors: ["#a78bfa", "#7c4dff"] },
  { lv: 31, colors: ["#c026d3", "#7c4dff"] },
  { lv: 41, colors: ["#e879f9", "#c026d3"] },
  { lv: 51, colors: ["#7c4dff", "#5b21b6"] },
  { lv: 61, colors: ["#9333ea", "#6d28d9"] },
  { lv: 71, colors: ["#e879f9", "#a21caf"] },
  { lv: 81, colors: ["#f472b6", "#c026d3"] },
  { lv: 91, colors: ["#fb923c", "#e879f9"] },
];

// Radius kept large relative to height so the arc's peak sits well clear of the
// avatar below it instead of nearly touching it.
const ARC_WIDTH = 264;
const ARC_HEIGHT = 168;
const ARC_CX = ARC_WIDTH / 2;
const ARC_CY = 140;
const ARC_R = 120;
const ARC_STROKE = 10;
const ARC_LENGTH = Math.PI * ARC_R;
const ARC_TRACK_PATH = `M ${ARC_CX - ARC_R} ${ARC_CY} A ${ARC_R} ${ARC_R} 0 0 1 ${ARC_CX + ARC_R} ${ARC_CY}`;

function SectionTitle({ children }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Ionicons name="ribbon" size={16} color="#e879f9" />
      <Text style={styles.sectionTitleText}>{children}</Text>
      <Ionicons name="ribbon" size={16} color="#e879f9" />
    </View>
  );
}

const RIBBON_W = 112;
const RIBBON_H = 34;
const RIBBON_POINTS = `6,0 ${RIBBON_W - 6},0 ${RIBBON_W},${RIBBON_H / 2} ${RIBBON_W - 6},${RIBBON_H} 6,${RIBBON_H} 0,${RIBBON_H / 2}`;

// Ribbon/banner shape (pointed left+right ends) for the "Lv.X" badge — same shape
// language as the SectionRibbon banners used elsewhere in the app.
function LevelBadge({ level }) {
  return (
    <View style={styles.levelRibbonWrap}>
      <Svg width={RIBBON_W} height={RIBBON_H} viewBox={`0 0 ${RIBBON_W} ${RIBBON_H}`}>
        <Defs>
          <SvgLinearGradient id="levelRibbonGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#e879f9" />
            <Stop offset="1" stopColor="#7c4dff" />
          </SvgLinearGradient>
        </Defs>
        <Polygon points={RIBBON_POINTS} fill="url(#levelRibbonGrad)" stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />
      </Svg>
      <View style={styles.levelRibbonTextWrap}>
        <Text style={styles.levelRibbonText}>Lv.{level}</Text>
      </View>
    </View>
  );
}

export default function UserLevelPanel() {
  const [activeTab, setActiveTab] = useState(LEVEL_TABS[0]);
  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(0);
  const [xp, setXp] = useState(null);
  const [vipProfileFrame, setVipProfileFrame] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [storedUser, levelResult] = await Promise.all([getUser(), syncUserLevelForSession()]);
      if (cancelled) return;
      setUser(storedUser);
      setLevel(levelResult?.level ?? 0);
      setXp(levelResult?.xp ?? null);

      const vipAssets = await loadMyVipAssets(levelResult?.xp?.totalXp).catch(() => null);
      if (!cancelled) setVipProfileFrame(vipAssets?.unlocked ? vipAssets.profileFrame : null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const avatarSource = resolveProfileAvatarSource(user);
  // Real progress when the gamification profile loaded; otherwise a static placeholder.
  const xpCurrent = xp ? Math.max(0, xp.totalXp - xp.currentLevelXpStart) : 10;
  const xpTarget = xp ? Math.max(1, xp.nextLevelXpTarget - xp.currentLevelXpStart) : 30;
  const percent = xpTarget > 0 ? Math.min(1, xpCurrent / xpTarget) : 0;

  const levelUpWays = xp
    ? LEVEL_UP_WAYS.map((way) =>
        way.label === "Stay in room"
          ? { ...way, current: Math.round(xp.roomTimeSeconds / 60) }
          : way
      )
    : LEVEL_UP_WAYS;

  const angle = Math.PI * (1 - percent);
  const markerX = ARC_CX + ARC_R * Math.cos(angle);
  const markerY = ARC_CY - ARC_R * Math.sin(angle);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={["#3b1a78", "#7c4dff", "#5b21b6"]} style={styles.hero}>
        <View style={styles.arcWrap}>
          <Svg width={ARC_WIDTH} height={ARC_HEIGHT} viewBox={`0 0 ${ARC_WIDTH} ${ARC_HEIGHT}`}>
            <Path d={ARC_TRACK_PATH} stroke="rgba(255,255,255,0.25)" strokeWidth={ARC_STROKE} strokeLinecap="round" fill="none" />
            <Path
              d={ARC_TRACK_PATH}
              stroke="#e879f9"
              strokeWidth={ARC_STROKE}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${ARC_LENGTH} ${ARC_LENGTH}`}
              strokeDashoffset={ARC_LENGTH * (1 - percent)}
            />
            <Circle cx={markerX} cy={markerY} r={7} fill="#e879f9" stroke="white" strokeWidth={2} />
          </Svg>

          <View style={[styles.percentBubble, { left: markerX - 23, top: markerY - 38 }]}>
            <Text style={styles.percentBubbleText}>{Math.round(percent * 100)}%</Text>
          </View>
          <View style={[styles.percentBubbleTail, { left: markerX - 6, top: markerY - 15 }]} />

          <View style={styles.arcCenter} pointerEvents="none">
            <View style={styles.avatarWrap}>
              <View style={styles.avatarGlow} />
              <ProfileAvatarWithFrame
                avatarSource={avatarSource}
                frameSource={vipProfileFrame}
                size={76}
                avatarStyle={styles.avatar}
                {...(vipProfileFrame
                  ? {
                      frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                      frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                      frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                      frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                      frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                      avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                      avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                    }
                  : {})}
              />
            </View>
            <LevelBadge level={level} />
            {xp?.equippedBadge ? (
              <Text style={styles.equippedBadgeText} numberOfLines={1}>
                {xp.equippedBadge?.name ?? xp.equippedBadge?.label ?? String(xp.equippedBadge)}
              </Text>
            ) : null}
          </View>

          {/* Pinned to the arc's fixed endpoint coordinates (not the moving progress
              marker) so they always sit right on the line, at any percent. */}
          <Text style={[styles.arcEndLabel, { left: 0 }]}>{xpCurrent}/{xpTarget}</Text>
          <Text style={[styles.arcEndLabel, { right: -12 }]}>
            Next: <Text style={{ fontWeight: "900" }}>Lv.{level + 1}</Text>
          </Text>
        </View>

        <View style={styles.tabRowOuter}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {LEVEL_TABS.map((tab) => {
              const active = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                  style={[styles.tabPill, active && styles.tabPillActive]}
                >
                  <Text style={[styles.tabPillText, active && styles.tabPillTextActive]}>{tab}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <SectionTitle>Ways to Level Up</SectionTitle>
          <Text style={styles.cardIntro}>
            Your level is increasing at standard speed.{"\n"}
            {xp ? (
              <>
                Today: <Text style={styles.cardIntroHighlight}>{xp.dailyXpEarned} Exp</Text> earned,{" "}
                <Text style={styles.cardIntroHighlight}>{xp.dailyXpRemaining} Exp</Text> left of a{" "}
                <Text style={styles.cardIntroHighlight}>{xp.dailyXpCap} Exp</Text> daily cap
              </>
            ) : (
              <>
                Today's upper limit: <Text style={styles.cardIntroHighlight}>2,300 Exp</Text>
              </>
            )}
          </Text>

          {levelUpWays.map((way, index) => (
            <View
              key={way.label}
              style={[styles.wayRow, index === levelUpWays.length - 1 && { borderBottomWidth: 0 }]}
            >
              <Text style={styles.wayLabel}>{way.label}</Text>
              <View style={styles.wayTrack}>
                <View style={[styles.wayFill, { width: `${Math.min(100, (way.current / way.target) * 100)}%` }]} />
              </View>
              <View style={styles.wayFooterRow}>
                <Text style={styles.wayRate}>
                  {way.rate.split("/")[0]}/ <Text style={styles.wayRateHighlight}>{way.rate.split("/")[1]}</Text>
                </Text>
                <Text style={styles.wayCount}>{way.current}/{way.target}</Text>
              </View>
            </View>
          ))}
        </View>

        {xp ? (
          <View style={styles.card}>
            <SectionTitle>Your Stats</SectionTitle>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{Math.round(xp.roomTimeSeconds / 60)}</Text>
                <Text style={styles.statLabel}>Room mins</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{xp.giftsSentCount}</Text>
                <Text style={styles.statLabel}>Gifts sent</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{xp.giftCoinsSpent}</Text>
                <Text style={styles.statLabel}>Coins spent</Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <SectionTitle>Benefits of High Level</SectionTitle>
          <Text style={styles.benefitItem}>1. You will get rewards when you level up to special level.</Text>
          <Text style={styles.benefitItem}>2. Higher levels will help you get more attention.</Text>
        </View>

        <View style={styles.card}>
          <SectionTitle>Level Medal</SectionTitle>
          <View style={styles.medalGrid}>
            {LEVEL_MEDALS.map((m) => (
              <LinearGradient
                key={m.lv}
                colors={m.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.medalPill}
              >
                <Text style={styles.medalPillText}>Lv.{m.lv}</Text>
              </LinearGradient>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <SectionTitle>Level Rewards</SectionTitle>
          <View style={styles.rewardRow}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>🪙</Text>
              <Text style={styles.rewardLabel}>Golds</Text>
            </View>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardEmoji}>💎</Text>
              <Text style={styles.rewardLabel}>Diamonds</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 16,
  },
  arcWrap: {
    width: ARC_WIDTH,
    height: ARC_HEIGHT,
    alignItems: "center",
  },
  percentBubble: {
    position: "absolute",
    width: 46,
    height: 24,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  percentBubbleText: {
    color: "#7c4dff",
    fontSize: 12,
    fontWeight: "800",
  },
  percentBubbleTail: {
    position: "absolute",
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "white",
  },
  arcCenter: {
    position: "absolute",
    top: ARC_HEIGHT - 120,
    alignItems: "center",
  },
  avatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGlow: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(232,121,249,0.35)",
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.6)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  levelRibbonWrap: {
    width: RIBBON_W,
    height: RIBBON_H,
    marginTop: -12,
  },
  levelRibbonTextWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  levelRibbonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900",
  },
  equippedBadgeText: {
    marginTop: 6,
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 140,
  },
  arcEndLabel: {
    position: "absolute",
    top: ARC_CY + 10,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },
  tabRowOuter: {
    alignSelf: "stretch",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 999,
    padding: 4,
  },
  tabRow: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  tabPillActive: {
    backgroundColor: "white",
  },
  tabPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  tabPillTextActive: {
    color: "#7c4dff",
  },
  body: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitleText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  cardIntro: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardIntroHighlight: {
    color: "#e879f9",
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11.5,
    fontWeight: "600",
  },
  wayRow: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    paddingVertical: 12,
  },
  wayLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  wayTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    marginBottom: 6,
  },
  wayFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#e879f9",
  },
  wayFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  wayRate: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11.5,
  },
  wayRateHighlight: {
    color: "#a78bfa",
    fontWeight: "700",
  },
  wayCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11.5,
  },
  benefitItem: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    lineHeight: 20,
  },
  medalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  medalPill: {
    width: "18%",
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  medalPillText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  rewardRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 48,
  },
  rewardItem: {
    alignItems: "center",
    gap: 6,
  },
  rewardEmoji: {
    fontSize: 40,
  },
  rewardLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
});
