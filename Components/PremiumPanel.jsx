import { useState, useEffect, useRef } from "react";
import { View, Text, Image, ImageBackground, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Circle, Ellipse, Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
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

const BACKGROUND_IMAGE = require("../assets/Premium logos/image.png");
const CROWN_ICON = require("../assets/icons/crown.png");
const EXCLUSIVE_BG = require("../assets/Premium logos/exclusiveBG.png");
const COIN_INVESTMENT_BG = require("../assets/Premium logos/coinInvestmentBG.png");
// Background artwork's own pixel size — rendering it at this aspect ratio
// (rather than resizeMode="cover" over the whole screen) keeps its glowing
// ring pedestal sitting directly under the medallion instead of getting
// stretched down past the cards/buttons.
const BACKGROUND_ASPECT_RATIO = 1148 / 1370;

const TIER_LOGOS = {
  knight: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Knight+logo1.png" },
  baron: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Baron+logo+2.png" },
  viscount: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Viscount+logo+3.png" },
  count: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Count+logo+4.png" },
  king: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/King+logo+5.png" },
  emperor: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Emperor+logo+6.png" },
  sovereign: { uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Sovereign+logo+7.png" },
};

const PREMIUM_TIERS = [
  { id: "knight", label: "Knight", coins: 2000, accent: "#6d0a0a" },
  { id: "baron", label: "Baron", coins: 20000, accent: "#1b0747f6" },
  { id: "viscount", label: "Viscount", coins: 80000, accent: "#3b057d" },
  { id: "count", label: "Count", coins: 200000, accent: "#0761d0" },
  { id: "king", label: "King", coins: 500000, accent: "#5903ae" },
  { id: "emperor", label: "Emperor", coins: 1000000, accent: "#f97316" },
  { id: "sovereign", label: "Sovereign", coins: 2500000, accent: "#0b292d" },
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
  // Page 2
  { id: "roomBackground", icon: "image", label: "Room Background theme", unlocked: true },
  { id: "profileBackground", icon: "images", label: "Profile background", unlocked: true },
  { id: "instantChat", icon: "chatbubble-ellipses", label: "Instant Chat", unlocked: true },
  { id: "messageRecall", icon: "arrow-undo", label: "Message Recall", unlocked: false },
  { id: "effectTitle", icon: "sparkles", label: "Enter effect title", unlocked: false },
  { id: "frontRow", icon: "stats-chart", label: "Front row on User list", unlocked: false },
];

const PRIVILEGE_PAGE_SIZE = 6;
const PRIVILEGE_PAGES = Array.from(
  { length: Math.ceil(PRIVILEGES.length / PRIVILEGE_PAGE_SIZE) },
  (_, i) => PRIVILEGES.slice(i * PRIVILEGE_PAGE_SIZE, i * PRIVILEGE_PAGE_SIZE + PRIVILEGE_PAGE_SIZE)
);

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

const ICON3D_GRADIENTS = {
  purple: ["#e0c3ff", "#9d5fe0", "#4a2a7a"],
  gold: ["#fff3c4", "#f0b93d", "#8a5a12"],
  locked: ["#e5e5ec", "#9a9aab", "#54545f"],
};

let orbSeq = 0;

// Shared glossy "3D" orb: an SVG radial gradient (light source top-left)
// plus a soft highlight ellipse, since there's no vector 3D-icon set — this
// simulates the shaded-sphere look those packs use, in code. HelpOrbIcon and
// Icon3D both just drop different content (a glyph vs. an Ionicons icon) on
// top of the same sphere instead of duplicating the SVG markup.
function OrbBase({ size, gradient = "purple", children }) {
  const [gradId] = useState(() => `orb-${orbSeq++}`);
  const r = size / 2;
  const [c1, c2, c3] = ICON3D_GRADIENTS[gradient] ?? ICON3D_GRADIENTS.purple;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={gradId} cx="35%" cy="30%" r="75%">
            <Stop offset="0%" stopColor={c1} stopOpacity="1" />
            <Stop offset="55%" stopColor={c2} stopOpacity="1" />
            <Stop offset="100%" stopColor={c3} stopOpacity="1" />
          </RadialGradient>
        </Defs>
        <Circle cx={r} cy={r} r={r - 1} fill={`url(#${gradId})`} stroke="#2f1a52" strokeWidth={1} />
        <Ellipse
          cx={size * 0.36}
          cy={size * 0.3}
          rx={size * 0.22}
          ry={size * 0.14}
          fill="white"
          opacity={0.4}
          transform={`rotate(-25 ${size * 0.36} ${size * 0.3})`}
        />
      </Svg>
      <View style={styles.icon3dGlyphWrap} pointerEvents="none">
        {children}
      </View>
    </View>
  );
}

function HelpOrbIcon({ size = 36 }) {
  return (
    <OrbBase size={size}>
      <Text style={styles.helpOrbGlyph}>?</Text>
    </OrbBase>
  );
}

// Any Ionicons glyph centered on the same shaded-sphere look, so every icon
// in this screen reads as "3D" instead of a flat glyph.
function Icon3D({ name, size = 40, iconSize, gradient = "purple" }) {
  const resolvedIconSize = iconSize ?? Math.round(size * 0.48);
  return (
    <OrbBase size={size} gradient={gradient}>
      <Ionicons name={name} size={resolvedIconSize} color="white" style={styles.icon3dGlyphShadow} />
    </OrbBase>
  );
}

const ROSE_GOLD = "#f3c6ad";

let shimmerSeq = 0;

// A little glitter cluster, not a static icon: one bright twinkling star
// with a soft glow behind it, plus two smaller dust-mote dots nearby — each
// pulsing on its own independent loop/timing so it reads as scattered
// sparkle rather than one shape blinking on and off in place.
function CornerShimmer({ style }) {
  const [gradId] = useState(() => `corner-glow-${shimmerSeq++}`);
  const starPulse = useRef(new Animated.Value(0)).current;
  const dotAPulse = useRef(new Animated.Value(0)).current;
  const dotBPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathe = (value, duration, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
    const loops = [
      breathe(starPulse, 950, 0),
      breathe(dotAPulse, 1200, 250),
      breathe(dotBPulse, 1000, 500),
    ];
    loops.forEach((loop) => loop.start());
    return () => loops.forEach((loop) => loop.stop());
  }, [starPulse, dotAPulse, dotBPulse]);

  const starScale = starPulse.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.2] });
  const starOpacity = starPulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const dotAScale = dotAPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.1] });
  const dotAOpacity = dotAPulse.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.9] });
  const dotBScale = dotBPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const dotBOpacity = dotBPulse.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.8] });

  return (
    <View pointerEvents="none" style={[styles.cornerShimmerWrap, style]}>
      <Animated.View style={{ opacity: starOpacity, transform: [{ scale: starScale }] }}>
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Defs>
            <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#fff6ec" stopOpacity={1} />
              <Stop offset="40%" stopColor={ROSE_GOLD} stopOpacity={0.9} />
              <Stop offset="100%" stopColor={ROSE_GOLD} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={11} cy={11} r={11} fill={`url(#${gradId})`} />
          <Polygon points="11,3 12.6,9.4 19,11 12.6,12.6 11,19 9.4,12.6 3,11 9.4,9.4" fill="#fffaf3" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.shimmerDotMed, { opacity: dotAOpacity, transform: [{ scale: dotAScale }] }]} />
      <Animated.View style={[styles.shimmerDotSmall, { opacity: dotBOpacity, transform: [{ scale: dotBScale }] }]} />
    </View>
  );
}

// Title flanked by a glitter cluster on each side — at the start and end of
// the line, not pinned to the card's corners.
function SectionCardTitle({ title }) {
  return (
    <View style={styles.sectionCardTitleRow}>
      <CornerShimmer />
      <Text style={styles.sectionCardTitle}>{title}</Text>
      <CornerShimmer />
    </View>
  );
}

export default function PremiumPanel({ onClose }) {
  const insets = useSafeAreaInsets();
  const unlockedCount = PRIVILEGES.filter((p) => p.unlocked).length;

  // Continuous left-to-right shimmer sweep across the notYetCard. Travels a
  // fixed distance wider than any possible card width, so it always clears
  // fully off-screen on both ends regardless of the card's actual size —
  // the card's own overflow:"hidden" clips it to the visible shape.
  const shimmerProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerProgress, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerProgress]);
  const shimmerTranslateX = shimmerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH * 0.7, SCREEN_WIDTH * 0.7],
  });

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
    // Use the ScrollView's own measured width directly — it no longer has
    // its own padding (padding on a horizontal ScrollView's outer style
    // doesn't reliably shrink its clippable viewport the way padding on a
    // plain View does, which was quietly throwing off the centering math
    // for whichever slide landed at the scroll boundary). Rounded to a
    // whole pixel so every slide renders at the exact same width —
    // fractional widths let per-slide rounding drift accumulate.
    const width = Math.round(e.nativeEvent.layout.width);
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

  const [privilegesPage, setPrivilegesPage] = useState(0);
  const [privilegesPageWidth, setPrivilegesPageWidth] = useState(SCREEN_WIDTH - CONTENT_PADDING * 2 - 32);

  const handlePrivilegesLayout = (e) => {
    const width = Math.round(e.nativeEvent.layout.width);
    if (width > 0 && width !== privilegesPageWidth) setPrivilegesPageWidth(width);
  };

  const handlePrivilegesScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / privilegesPageWidth);
    setPrivilegesPage(idx);
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
              <Ionicons name="arrow-back" size={20} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Premium</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerPointsPill} activeOpacity={0.8} onPress={notWiredYet}>
              <Image source={CROWN_ICON} style={styles.crownIcon} resizeMode="contain" />
              <Text style={styles.headerPointsText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={notWiredYet}>
              <HelpOrbIcon size={36} />
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
            contentContainerStyle={styles.tierScrollContent}
            snapToInterval={slideWidth}
            decelerationRate="fast"
            disableIntervalMomentum
            onLayout={handleTierScrollLayout}
            onMomentumScrollEnd={handleTierScrollEnd}
          >
            {PREMIUM_TIERS.map((tier) => (
              <View key={tier.id} style={[styles.tierSlide, { width: slideWidth }]}>
                {tier.logo ? (
                  <Image source={tier.logo} style={styles.tierLogoImage} resizeMode="contain" />
                ) : null}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Fades the artwork into the same violet tone the section below
            starts with, instead of a hard-cut seam between the two. */}
        <LinearGradient
          colors={["transparent", "#4a2a6e"]}
          style={styles.topSectionFade}
          pointerEvents="none"
        />
      </ImageBackground>

      <View style={styles.bottomSection}>
        <View style={styles.bottomContent}>
        <View style={styles.notYetCardShadow}>
          <View style={styles.notYetCard}>
            {/* Tinted glass, not a solid fill — lets the purple backdrop
                show through instead of blocking it. */}
            <LinearGradient
              colors={["rgba(124,77,255,0.22)", "rgba(192,38,211,0.22)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Glass sheen — a soft white fade from the top-left corner,
                like light catching a curved glass surface. */}
            <LinearGradient
              colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.7, y: 0.9 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Continuous left-to-right shimmer — a narrow bright strip that
                sweeps across the card in a loop; clipped to the card's
                rounded shape by its own overflow:"hidden". */}
            <Animated.View
              pointerEvents="none"
              style={[styles.notYetShimmer, { transform: [{ translateX: shimmerTranslateX }, { rotate: "20deg" }] }]}
            >
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <View style={styles.notYetAvatarRing}>
              <ProfileAvatarWithFrame
                avatarSource={selfAvatarSource}
                frameSource={vipProfileFrame}
                size={26}
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
            <Text
              style={styles.notYetText}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              You are not {activeTier.label} yet
            </Text>
          </View>
        </View>

        <View style={styles.investCardShadow}>
          <ImageBackground
            source={COIN_INVESTMENT_BG}
            style={styles.investCard}
            imageStyle={styles.investCardBgImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "#f7d774", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.investTopAccent}
            />
            <View style={styles.investTitleRow}>
              <Ionicons name="trending-up" size={15} color="#f7d774" />
              <Text style={styles.investTitle}>COIN INVESTMENT PLAN</Text>
            </View>

            <View style={styles.investIncomeRow}>
              {/* Solid frosted backing first, then the color tint on top —
                  without this, the busy background art shows straight
                  through and the row reads as a loose tinted film instead
                  of a distinct panel. */}
              <LinearGradient colors={["rgba(20,10,35,0.68)", "rgba(10,5,20,0.78)"]} style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={["rgba(247,215,116,0.22)", "rgba(124,77,255,0.18)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Icon3D name="diamond" size={28} gradient="gold" />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.investIncomeValue}>287,480</Text>
                <View style={styles.investReturnPill}>
                  <Ionicons name="arrow-up" size={10} color="#3a1f00" />
                  <Text style={styles.investReturnPillText}>115% RETURN</Text>
                </View>
                <Text style={styles.investIncomeLabel}>Total income</Text>
              </View>
            </View>

            <View style={styles.investSubRow}>
              <TouchableOpacity style={styles.investSubCardWrap} activeOpacity={0.85} onPress={notWiredYet}>
                <View style={styles.investSubCard}>
                  <LinearGradient colors={["rgba(20,10,35,0.68)", "rgba(10,5,20,0.78)"]} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={["rgba(124,77,255,0.35)", "rgba(58,20,90,0.4)"]} style={StyleSheet.absoluteFill} />
                  <Icon3D name="cube" size={22} />
                  <Text style={styles.investSubValue}>87,500</Text>
                  <Text style={styles.investSubLabel}>Instantly get</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.investSubCardWrap} activeOpacity={0.85} onPress={notWiredYet}>
                <View style={styles.investSubCard}>
                  <LinearGradient colors={["rgba(20,10,35,0.68)", "rgba(10,5,20,0.78)"]} style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={["rgba(247,215,116,0.35)", "rgba(90,60,10,0.4)"]} style={StyleSheet.absoluteFill} />
                  <Icon3D name="gift" size={22} gradient="gold" />
                  <Text style={styles.investSubValue}>6,666</Text>
                  <Text style={styles.investSubLabel}>Daily check in to get</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.sectionCard}>
          <LinearGradient colors={["rgba(58,20,90,0.92)", "rgba(18,7,32,0.96)"]} style={StyleSheet.absoluteFill} />
          <SectionCardTitle title="Level dressing up" />
          <View style={styles.dressGrid}>
            {DRESS_UP_PLACEHOLDERS.map((item) => (
              <TouchableOpacity key={item.id} style={styles.dressBlankBox} activeOpacity={0.8} onPress={notWiredYet}>
                <LinearGradient
                  colors={["rgba(168,85,247,0.28)", "rgba(20,8,42,0.55)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.dressBlankInnerBorder} pointerEvents="none" />
                <Ionicons name="lock-closed-outline" size={20} color="rgba(233,201,255,0.4)" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ImageBackground
          source={EXCLUSIVE_BG}
          style={styles.sectionCard}
          imageStyle={styles.sectionCardBgImage}
          resizeMode="cover"
        >
          <SectionCardTitle title="Exclusive Privileges" />
          <Text style={styles.privilegesCount}>({unlockedCount}/32)</Text>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onLayout={handlePrivilegesLayout}
            onMomentumScrollEnd={handlePrivilegesScrollEnd}
          >
            {PRIVILEGE_PAGES.map((page, pageIndex) =>
              pageIndex === 0 ? (
                <View key={pageIndex} style={{ width: privilegesPageWidth }}>
                  <View style={styles.privilegeGrid}>
                    {page.map((p) => (
                      <TouchableOpacity key={p.id} style={styles.privilegeCell} activeOpacity={0.8} onPress={notWiredYet}>
                        <View style={styles.privilegeIconWrap}>
                          <Icon3D name={p.icon} size={44} gradient={p.unlocked ? "purple" : "locked"} />
                        </View>
                        <Text style={[styles.privilegeLabel, !p.unlocked && styles.privilegeLabelLocked]} numberOfLines={2}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                // Plan screen (page 2+): left blank for now.
                <View key={pageIndex} style={[styles.privilegesPlanPage, { width: privilegesPageWidth }]} />
              )
            )}
          </ScrollView>

          <View style={styles.pageDotsRow}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.pageDot, i === privilegesPage && styles.pageDotActive]} />
            ))}
          </View>
        </ImageBackground>

        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.bottomBtnWrap} activeOpacity={0.85} onPress={notWiredYet}>
            <LinearGradient colors={["rgba(168,85,247,0.3)", "rgba(124,77,255,0.3)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bottomBtn}>
              <Text style={styles.bottomBtnTitle}>Send to Friend</Text>
              <Text style={styles.bottomBtnSub}>depends on the user</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBtnWrap} activeOpacity={0.85} onPress={notWiredYet}>
            <LinearGradient colors={["rgba(232,121,249,0.3)", "rgba(192,38,211,0.3)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bottomBtn}>
              <Text style={styles.purchaseBtnTitle}>
                Purchase {activeTier.coins.toLocaleString("en-IN")} 🪙
              </Text>
              <Text style={styles.purchaseBtnSub}>/30days</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#4a2a6e",
  },
  pageScroll: {
    flexGrow: 1,
  },
  topSection: {
    width: "100%",
  },
  bottomSection: {
    position: "relative",
    // Flat, uniform color instead of a radial gradient — a gradient's color
    // naturally varies across the section (brighter center, darker edges),
    // which is exactly what made the corners look like a separate, darker
    // box next to the card. One flat color can't mismatch itself anywhere.
    backgroundColor: "#4a2a6e",
  },
  topSectionFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 90,
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
  helpOrbGlyph: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  icon3dGlyphWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  icon3dGlyphShadow: {
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerTitle: {
    color: "black",
    fontSize: 20,
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
    backgroundColor: "rgba(43, 6, 71, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.4)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  crownIcon: {
    width: 25,
    height: 25,
  },
  headerPointsText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  tabsRow: {
    flexDirection: "row",
    gap: 26,
    paddingHorizontal: CONTENT_PADDING,
    marginBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 8,
  },
  tabLabel: {
    color: "rgba(0,0,0,0.5)",
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
  notYetCardShadow: {
    width: "92%",
    alignSelf: "center",
    borderRadius: 20,
    marginTop: -50,
    marginBottom: 16,
    // Shadow lives on this wrapper, not the clipped card below it — a view
    // with overflow:"hidden" clips its own shadow into invisibility on iOS.
    shadowColor: "#2d0a4e",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  notYetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  notYetShimmer: {
    position: "absolute",
    top: -30,
    bottom: -30,
    width: 36,
    left: 0,
  },
  notYetAvatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
  },
  notYetText: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(84, 7, 156, 0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  investCardShadow: {
    borderRadius: 20,
    marginBottom: 20,
    // Shadow lives on this wrapper, not the clipped card below it — a view
    // with overflow:"hidden" clips its own shadow into invisibility on iOS.
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  investCard: {
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.35)",
    borderRadius: 20,
    padding: 20,
    paddingTop: 18,
    paddingBottom: 22,
    overflow: "hidden",
  },
  investCardBgImage: {
    borderRadius: 20,
  },
  investTopAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  investTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  investTitle: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  investIncomeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(247,215,116,0.45)",
    padding: 6,
    marginBottom: 14,
    overflow: "hidden",
  },
  investIncomeValue: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  investReturnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    backgroundColor: "#f7d774",
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginTop: 3,
  },
  investReturnPillText: {
    color: "#3a1f00",
    fontSize: 8,
    fontWeight: "800",
  },
  investIncomeLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 2,
  },
  investSubRow: {
    flexDirection: "row",
    gap: 8,
  },
  investSubCardWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  investSubCard: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    paddingVertical: 6,
  },
  investSubValue: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 4,
  },
  investSubLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 9,
    marginTop: 2,
  },
  sectionCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(168,85,247,0.35)",
    padding: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  sectionCardBgImage: {
    borderRadius: 20,
  },
  cornerShimmerWrap: {
    width: 26,
    height: 26,
  },
  shimmerDotMed: {
    position: "absolute",
    top: 15,
    left: 13,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff2e0",
    shadowColor: "#f3c6ad",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 4,
  },
  shimmerDotSmall: {
    position: "absolute",
    top: 3,
    left: 17,
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: "#e9c9ff",
    shadowColor: "#c9a6ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionCardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionCardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  dressGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },
  dressBlankBox: {
    width: "31%",
    // A fixed height instead of aspectRatio — aspectRatio on a childless,
    // percentage-width item inside a flexWrap row doesn't reliably resolve
    // in RN's layout engine and was collapsing these to near-zero height.
    height: 96,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(201,166,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  dressBlankInnerBorder: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  privilegesCount: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: -10,
    marginBottom: 16,
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
    borderColor: "rgba(168,85,247,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  pageDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 4,
  },
  pageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  pageDotActive: {
    backgroundColor: "#c9a6ff",
    width: 16,
  },
  privilegesPlanPage: {
    minHeight: 120,
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
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
   
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  bottomBtnTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(45,10,78,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  bottomBtnSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    marginTop: 2,
    textShadowColor: "rgba(45,10,78,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  purchaseBtnTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(78,10,60,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  purchaseBtnSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    marginTop: 2,
    textShadowColor: "rgba(78,10,60,0.9)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
