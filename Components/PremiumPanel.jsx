import { useState, useEffect, useRef } from "react";
import { View, Text, Image, ImageBackground, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon, Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { loadMyVipAssets } from "../src/services/vipService";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 16;
// Fallback only — the medallion carousel measures its own rendered width via
// onLayout and uses that for slide sizing/scroll math instead, so a small
// mismatch between Dimensions.get("window") and the real layout can't
// compound across tiers and drift the later slides off-center.
const TIER_SLIDE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

const BACKGROUND_IMAGE = require("../assets/Premium logos/PremiumbackgroundImg.png");
// Background artwork's own pixel size — rendering it at this aspect ratio
// (rather than resizeMode="cover" over the whole screen) keeps its glowing
// ring pedestal sitting directly under the medallion instead of getting
// stretched down past the cards/buttons.
const BACKGROUND_ASPECT_RATIO = 1145 / 1373;

const TIER_LOGOS = {
  knight: require("../assets/Premium logos/Knight logo1.png"),
  baron: require("../assets/Premium logos/Baron logo 2.png"),
  viscount: require("../assets/Premium logos/Viscount logo 3.png"),
  count: require("../assets/Premium logos/Count logo 4.png"),
  king: require("../assets/Premium logos/King logo 5.png"),
  emperor: require("../assets/Premium logos/Emperor logo 6.png"),
  sovereign: require("../assets/Premium logos/Sovereign logo 7.png"),
};

const PREMIUM_TIERS = [
  { id: "knight", label: "Knight", coins: 2000, accent: "#f7d774" },
  { id: "baron", label: "Baron", coins: 20000, accent: "#fb7185" },
  { id: "viscount", label: "Viscount", coins: 80000, accent: "#4ade80" },
  { id: "count", label: "Count", coins: 200000, accent: "#60a5fa" },
  { id: "king", label: "King", coins: 500000, accent: "#c084fc" },
  { id: "emperor", label: "Emperor", coins: 1000000, accent: "#f97316" },
  { id: "sovereign", label: "Sovereign", coins: 2500000, accent: "#facc15" },
].map((tier) => ({ ...tier, logo: TIER_LOGOS[tier.id] }));

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

export default function PremiumPanel({ onClose }) {
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
  const [slideWidth, setSlideWidth] = useState(TIER_SLIDE_WIDTH);
  const tierScrollRef = useRef(null);
  const activeTier = PREMIUM_TIERS[activeTierIndex];

  const handleTierScrollLayout = (e) => {
    // layout.width is this ScrollView's own border-box (before its
    // paddingHorizontal is subtracted) — remove that to get the actual
    // visible slide width.
    const width = e.nativeEvent.layout.width - CONTENT_PADDING * 2;
    if (width > 0 && width !== slideWidth) setSlideWidth(width);
  };

  const goToTier = (index) => {
    setActiveTierIndex(index);
    tierScrollRef.current?.scrollTo({ x: index * slideWidth, animated: true });
  };

  const handleTierScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    setActiveTierIndex(idx);
  };

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pageScroll}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        style={[styles.topSection, { aspectRatio: BACKGROUND_ASPECT_RATIO }]}
        resizeMode="cover"
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={onClose}>
              <Ionicons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerPointsPill} activeOpacity={0.8} onPress={notWiredYet}>
              <FontAwesome5 name="crown" size={12} color="#f7d774" />
              <Text style={styles.headerPointsText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={notWiredYet}>
              <Ionicons name="help" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {PREMIUM_TIERS.map((tier, index) => {
            const isActive = index === activeTierIndex;
            return (
              <TouchableOpacity
                key={tier.id}
                style={styles.tabItem}
                activeOpacity={0.8}
                onPress={() => goToTier(index)}
              >
                <Text
                  style={[styles.tabLabel, isActive && { color: tier.accent }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {tier.label}
                </Text>
                {isActive ? <View style={[styles.tabUnderline, { backgroundColor: tier.accent }]} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Positioned as a fixed % of this block's own height (independent
            of header/tabs height) so it lands on the ring's own middle
            instead of drifting with flex-spacer guesswork. */}
        <View style={styles.medallionAnchor}>
          <ScrollView
            ref={tierScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tierScroll}
            contentContainerStyle={styles.tierScrollContent}
            snapToInterval={slideWidth}
            decelerationRate="fast"
            onLayout={handleTierScrollLayout}
            onMomentumScrollEnd={handleTierScrollEnd}
          >
            {PREMIUM_TIERS.map((tier) => (
              <View key={tier.id} style={[styles.tierSlide, { width: slideWidth }]}>
                <Image source={tier.logo} style={styles.tierLogoImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>
        </View>
      </ImageBackground>

      <View style={styles.bottomSection}>
        <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="bottomGlow" cx="50%" cy="30%" r="75%">
              <Stop offset="0%" stopColor="#3d2a63" stopOpacity="1" />
              <Stop offset="100%" stopColor="#0a0616" stopOpacity="1" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#bottomGlow)" />
        </Svg>

        <View style={styles.bottomContent}>
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
              <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.65)"]} style={StyleSheet.absoluteFill} />
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

        <View style={{ height: 100 + insets.bottom }} />
        </View>
      </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}>
        <LinearGradient colors={["rgba(10,4,20,0.82)", "rgba(10,4,20,0.98)"]} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={styles.bottomBtnWrap} activeOpacity={0.85} onPress={notWiredYet}>
          <LinearGradient colors={["#f4736b", "#e0575a"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bottomBtn}>
            <Text style={styles.bottomBtnTitle}>Send to Friend</Text>
            <Text style={styles.bottomBtnSub}>depends on the user</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtnWrap} activeOpacity={0.85} onPress={notWiredYet}>
          <LinearGradient colors={["#fef3c7", "#f0c869"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bottomBtn}>
            <Text style={styles.purchaseBtnTitle}>
              Purchase {activeTier.coins.toLocaleString("en-IN")} 🪙
            </Text>
            <Text style={styles.purchaseBtnSub}>/30days</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0616",
  },
  pageScroll: {
    flexGrow: 1,
  },
  topSection: {
    width: "100%",
  },
  bottomSection: {
    position: "relative",
  },
  bottomContent: {
    padding: CONTENT_PADDING,
  },
  medallionAnchor: {
    position: "absolute",
    top: "25%",
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerPointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerPointsText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 26,
    paddingHorizontal: CONTENT_PADDING,
    marginBottom: 8,
  },
  tierScroll: {
    paddingHorizontal: CONTENT_PADDING,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 17,
    fontWeight: "700",
  },
  tabUnderline: {
    height: 2,
    width: 28,
    borderRadius: 1,
    marginTop: 6,
  },
  tierScrollContent: {
    paddingVertical: 12,
  },
  tierSlide: {
    alignItems: "center",
  },
  tierLogoImage: {
    width: 210,
    height: 210,
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
    backgroundColor: "rgba(10,4,20,0.55)",
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
    backgroundColor: "rgba(0,0,0,0.3)",
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
    backgroundColor: "rgba(0,0,0,0.3)",
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
    backgroundColor: "rgba(0,0,0,0.35)",
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
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  bottomBtnWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  bottomBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  bottomBtnTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  bottomBtnSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 2,
  },
  purchaseBtnTitle: {
    color: "#5c3a0e",
    fontSize: 15,
    fontWeight: "800",
  },
  purchaseBtnSub: {
    color: "rgba(92,58,14,0.75)",
    fontSize: 11,
    marginTop: 2,
  },
});
