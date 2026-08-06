import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PremiumTierBadge from "./PremiumTierBadge";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { loadMyVipAssets } from "../src/services/vipService";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 16;
const TIER_SLIDE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

const PREMIUM_TIERS = [
  { id: "amber", label: "Amber", icon: "diamond", coins: 2000, accent: "#f7d774" },
  { id: "ruby", label: "Ruby", icon: "diamond", coins: 20000, accent: "#fb7185" },
  { id: "emerald", label: "Emerald", icon: "diamond", coins: 80000, accent: "#4ade80" },
  { id: "sapphire", label: "Sapphire", icon: "diamond", coins: 200000, accent: "#60a5fa" },
  { id: "amethyst", label: "Amethyst", icon: "diamond", coins: 500000, accent: "#c084fc" },
];

const DRESS_UP_PLACEHOLDERS = [
  { id: "frame", icon: "ribbon" },
  { id: "chatframe", icon: "chatbubble-ellipses" },
  { id: "card", icon: "id-card" },
  { id: "entrance", icon: "people" },
  { id: "avatar", icon: "person-circle" },
  { id: "bubble", icon: "chatbox-ellipses" },
];

const PRIVILEGES = [
  { id: "dailyRewards", icon: "gift", label: "Daily rewards", unlocked: true },
  { id: "badge", icon: "medal", label: "Premium Badge", unlocked: true },
  { id: "chatFrame", icon: "pricetag", label: "Premium chat frame", unlocked: true },
  { id: "profileShow", icon: "albums", label: "Profile Show", unlocked: false },
  { id: "customAvatar", icon: "person", label: "Customize avatar", unlocked: false },
  { id: "storeDiscount", icon: "pricetags", label: "Store discount day", unlocked: false },
];

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

function SectionRibbon({ title }) {
  return (
    <View style={styles.ribbonOuter}>
      <View style={styles.ribbonWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Polygon points="6,0 94,0 100,50 94,100 6,100 0,50" fill="rgba(59,26,120,0.9)" stroke="#f7d774" strokeWidth={1.4} />
        </Svg>
        <Text style={styles.ribbonText} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

export default function PremiumPanel() {
  const insets = useSafeAreaInsets();
  const unlockedCount = PRIVILEGES.filter((p) => p.unlocked).length;

  const [selfUser, setSelfUser] = useState(null);
  const [vipProfileFrame, setVipProfileFrame] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getUser().then((u) => {
      if (!cancelled) setSelfUser(u);
    });
    loadMyVipAssets().then((vipAssets) => {
      if (!cancelled) setVipProfileFrame(vipAssets?.unlocked ? vipAssets.profileFrame : null);
    }).catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  const selfAvatarSource = resolveProfileAvatarSource(selfUser);

  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const tierScrollRef = useRef(null);
  const activeTier = PREMIUM_TIERS[activeTierIndex];

  const goToTier = (index) => {
    setActiveTierIndex(index);
    tierScrollRef.current?.scrollTo({ x: index * TIER_SLIDE_WIDTH, animated: true });
  };

  const handleTierScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TIER_SLIDE_WIDTH);
    setActiveTierIndex(idx);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.tabsRow}>
          {PREMIUM_TIERS.map((tier, index) => {
            const isActive = index === activeTierIndex;
            return (
              <TouchableOpacity
                key={tier.id}
                style={styles.tabItem}
                activeOpacity={0.8}
                onPress={() => goToTier(index)}
              >
                <Text style={[styles.tabLabel, isActive && { color: tier.accent }]}>{tier.label}</Text>
                {isActive ? <View style={[styles.tabUnderline, { backgroundColor: tier.accent }]} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          ref={tierScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierScrollContent}
          snapToInterval={TIER_SLIDE_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleTierScrollEnd}
        >
          {PREMIUM_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierSlide}>
              <PremiumTierBadge label={tier.label} icon={tier.icon} size={170} locked={tier.id !== "amber"} />
            </View>
          ))}
        </ScrollView>

        <View style={styles.notYetCard}>
          <LinearGradient colors={["#f7d774", "#c9932c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <ProfileAvatarWithFrame
            avatarSource={selfAvatarSource}
            frameSource={vipProfileFrame}
            size={38}
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
          <Text style={styles.notYetText}>You are not {activeTier.label} yet</Text>
        </View>

        <View style={styles.investCard}>
          <Text style={styles.investTitle}>Coin Investment Plan</Text>
          <View style={styles.investIncomeRow}>
            <Ionicons name="diamond" size={22} color="#c084fc" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.investIncomeValue}>
                287,480 <Text style={styles.investIncomeReturn}>115% diamonds return</Text>
              </Text>
              <Text style={styles.investIncomeLabel}>Total income</Text>
            </View>
          </View>
          <View style={styles.investSubRow}>
            <TouchableOpacity style={styles.investSubCard} activeOpacity={0.85} onPress={notWiredYet}>
              <Ionicons name="cube" size={26} color="#c084fc" />
              <Text style={styles.investSubValue}>87,500</Text>
              <Text style={styles.investSubLabel}>Instantly get</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.investSubCard} activeOpacity={0.85} onPress={notWiredYet}>
              <Ionicons name="gift" size={26} color="#f7d774" />
              <Text style={styles.investSubValue}>6,666</Text>
              <Text style={styles.investSubLabel}>Daily check in to get</Text>
            </TouchableOpacity>
          </View>
        </View>

        <SectionRibbon title="Level dressing up" />
        <View style={styles.dressRow}>
          {DRESS_UP_PLACEHOLDERS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.dressItem} activeOpacity={0.8} onPress={notWiredYet}>
              <LinearGradient colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]} style={StyleSheet.absoluteFill} />
              <Ionicons name={item.icon} size={26} color="#f7d774" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.privilegesDivider}>
          <LinearGradient colors={["rgba(247,215,116,0)", "rgba(247,215,116,0.6)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.privilegesDividerLine} />
          <Text style={styles.privilegesDividerText}>Exclusive Privileges ({unlockedCount}/32)</Text>
          <LinearGradient colors={["rgba(247,215,116,0.6)", "rgba(247,215,116,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.privilegesDividerLine} />
        </View>

        <View style={styles.privilegeGrid}>
          {PRIVILEGES.map((p) => (
            <TouchableOpacity key={p.id} style={styles.privilegeCell} activeOpacity={0.8} onPress={notWiredYet}>
              <View style={[styles.privilegeIconWrap, !p.unlocked && styles.privilegeIconWrapLocked]}>
                <Ionicons name={p.icon} size={22} color={p.unlocked ? "#f7d774" : "rgba(255,255,255,0.25)"} />
              </View>
              <Text style={[styles.privilegeLabel, !p.unlocked && styles.privilegeLabelLocked]} numberOfLines={2}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      <LinearGradient colors={["rgba(26,10,46,0.98)", "#1a0a2e"]} style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
        <TouchableOpacity activeOpacity={0.85} onPress={notWiredYet}>
          <LinearGradient colors={["#f7d774", "#c9932c"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.unlockBtn}>
            <Text style={styles.unlockBtnText}>Unlock Premium</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: CONTENT_PADDING,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "700",
  },
  tabUnderline: {
    height: 2,
    width: 22,
    borderRadius: 1,
    marginTop: 6,
  },
  tierScrollContent: {
    paddingVertical: 20,
  },
  tierSlide: {
    width: TIER_SLIDE_WIDTH,
    alignItems: "center",
  },
  notYetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  notYetText: {
    color: "#1a0a2e",
    fontSize: 14,
    fontWeight: "800",
  },
  investCard: {
    backgroundColor: "rgba(124,77,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.25)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  investTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12,
  },
  investIncomeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  investIncomeValue: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  investIncomeReturn: {
    color: "#f7d774",
    fontSize: 12,
    fontWeight: "700",
  },
  investIncomeLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  investSubRow: {
    flexDirection: "row",
    gap: 10,
  },
  investSubCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 14,
    paddingVertical: 16,
  },
  investSubValue: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 8,
  },
  investSubLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  ribbonOuter: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  ribbonWrap: {
    width: "70%",
    height: 34,
  },
  ribbonText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  dressRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  dressItem: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  privilegesDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  privilegesDividerLine: {
    flex: 1,
    height: 1,
  },
  privilegesDividerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
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
    borderColor: "rgba(247,215,116,0.3)",
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
    borderColor: "rgba(247,215,116,0.3)",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  unlockBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  unlockBtnText: {
    color: "#1a0a2e",
    fontSize: 15,
    fontWeight: "800",
  },
});
