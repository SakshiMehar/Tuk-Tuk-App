import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ms, s, vs } from "../src/utils/responsive";

const PASS_BENEFITS = [
  { icon: "filter", label: "Advanced Filters", pass: true },
  { icon: "eye", label: "All Visitors", pass: true },
  { icon: "images", label: "Unlimited Moments", pass: true },
  { icon: "chatbubbles", label: "More DMs", pass: true },
  { icon: "chatbox-ellipses", label: "Chat Without Restrictions", pass: true },
  { icon: "flash", label: "Chat Advantage", pass: "More" },
  { icon: "ribbon", label: "Member Badge", pass: true },
  { icon: "flash-outline", label: "Instant Chat", pass: "5 times / day" },
  { icon: "star", label: "Elite Chat Access", pass: true },
  { icon: "person-add", label: "All Followers", pass: true },
  { icon: "location", label: "All Nearby", pass: true },
  { icon: "albums", label: "All Nearby Moments", pass: true },
];

const PASS_TIERS = [
  { id: "14d", days: 14, price: 106, tag: "HOT" },
  { id: "30d", days: 30, price: 144, tag: "94% OFF", featured: true },
  { id: "60d", days: 60, price: 241, tag: "Big Deal" },
];

const notWiredYet = () =>
  Alert.alert("TukTuk Pass", "Pass checkout will be enabled in the upcoming update.");

// ── Interactive Plan Selector Card ──
const PlanCard = ({ tier, isActive, onSelect }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withSpring(1.04, { damping: 10, stiffness: 240 }),
        withSpring(1.0, { damping: 12, stiffness: 180 }),
      );
    } else {
      scale.value = withSpring(1.0, { damping: 12 });
    }
  }, [isActive, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onSelect}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 10 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 10 });
      }}
      style={styles.planCardWrapper}
    >
      <Animated.View
        style={[
          styles.planCard,
          isActive ? styles.planCardActive : styles.planCardInactive,
          animStyle,
        ]}
      >
        {/* Floating Tag */}
        {tier.tag && (
          <View style={styles.planTagContainer}>
            {isActive ? (
              <LinearGradient
                colors={["#a855f7", "#c026d3", "#ec4899"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.planTagGrad}
              >
                <Ionicons
                  name="flame"
                  size={ms(10)}
                  color="#ffffff"
                  style={{ marginRight: s(2) }}
                />
                <Text style={styles.planTagTextActive}>{tier.tag}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.planTagDefault}>
                <Text style={styles.planTagTextDefault}>{tier.tag}</Text>
              </View>
            )}
          </View>
        )}

        {/* Top: Calendar Icon & Days Row */}
        <View style={styles.planTopRow}>
          <View
            style={[
              styles.planIconBox,
              isActive && styles.planIconBoxActive,
            ]}
          >
            <Ionicons
              name="calendar-outline"
              size={ms(12)}
              color={isActive ? "#ffffff" : "#a78bfa"}
            />
          </View>
          <Text style={[styles.planDays, isActive && styles.planDaysActive]}>
            {tier.days} Days
          </Text>
        </View>

        {/* Price & Radio Check */}
        <View style={styles.planBottomRow}>
          <Text style={[styles.planPrice, isActive && styles.planPriceActive]}>
            INR {tier.price}
          </Text>
          <View
            style={[
              styles.radioCircle,
              isActive && styles.radioCircleActive,
            ]}
          >
            {isActive && (
              <Ionicons name="checkmark" size={ms(11)} color="#ffffff" />
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

// ── Interactive Primary CTA Button ("Get TukTuk Pass →") ──
const AnimatedGetPassButton = ({ onPress }) => {
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 900 }),
        withTiming(1.0, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 10 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 10 });
      }}
      style={{ flex: 1.35 }}
    >
      <Animated.View style={[styles.ctaButtonWrap, animStyle]}>
        <LinearGradient
          colors={["#d946ef", "#ec4899", "#f43f5e"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButtonGrad}
        >
          <FontAwesome5
            name="crown"
            size={ms(13)}
            color="#FFD700"
            style={{ marginRight: s(5) }}
          />
          <Text style={styles.ctaButtonText}>Get TukTuk Pass</Text>
          <Ionicons
            name="arrow-forward"
            size={ms(15)}
            color="#ffffff"
            style={{ marginLeft: s(5) }}
          />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

// ── Interactive Secondary Button ("Send to friend") ──
const AnimatedSendButton = ({ onPress }) => {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 10 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1.0, { damping: 10 });
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.sendButtonWrap, animStyle]}>
        <Ionicons
          name="gift-outline"
          size={ms(15)}
          color="#c084fc"
          style={{ marginRight: s(5) }}
        />
        <Text style={styles.sendButtonText}>Send to friend</Text>
      </Animated.View>
    </Pressable>
  );
};

export default function TukTukPassPanel({ onClose }) {
  const insets = useSafeAreaInsets();
  const [selectedTierId, setSelectedTierId] = useState(
    PASS_TIERS.find((t) => t.featured)?.id ?? PASS_TIERS[0].id,
  );

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER ── */}
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, vs(8)) }]}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerLogoIcon}
          >
            <Ionicons name="heart" size={ms(20)} color="#ffffff" />
            <View style={styles.headerLogoDotLeft} />
            <View style={styles.headerLogoDotRight} />
          </LinearGradient>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>TukTuk Pass</Text>
            <Text style={styles.headerSub}>
              More Connections • More Fun • More You
            </Text>
          </View>
        </View>

        {/* Right Close Button */}
        <TouchableOpacity
          style={styles.headerCloseBtn}
          onPress={onClose || notWiredYet}
          activeOpacity={0.7}
        >
          <Ionicons name="close" size={ms(16)} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* ── SCROLLVIEW (Hero Banner & Comparison Table) ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── HERO BANNER ── */}
        <LinearGradient
          colors={["#3b0764", "#701a75", "#a21caf", "#ec4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Left Text Column */}
          <View style={styles.heroTextCol}>
            <View style={styles.heroPill}>
              <FontAwesome5
                name="crown"
                size={ms(10)}
                color="#FFD700"
                style={{ marginRight: s(4) }}
              />
              <Text style={styles.heroPillText}>PREMIUM EXPERIENCE</Text>
            </View>

            <Text style={styles.heroCardTitle}>TukTuk Pass</Text>
            <Text style={styles.heroCardSub}>
              Unlock all features, connect freely,{"\n"}and make the most of your
              experience!
            </Text>
          </View>

          {/* Right 3D Badge Graphic */}
          <View style={styles.heroGraphicWrap}>
            <View style={styles.heroOrbitRing} />
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCardBadge}
            >
              <View style={styles.heroCrownFloating}>
                <FontAwesome5 name="crown" size={ms(18)} color="#FFD700" />
              </View>
              <Ionicons name="heart" size={ms(38)} color="#ffffff" />
            </LinearGradient>

            <Ionicons
              name="heart"
              size={ms(12)}
              color="#f472b6"
              style={styles.heroParticle1}
            />
            <Ionicons
              name="heart"
              size={ms(10)}
              color="#c084fc"
              style={styles.heroParticle2}
            />
          </View>
        </LinearGradient>

        {/* ── FEATURES COMPARISON TABLE ── */}
        <View style={styles.tableCard}>
          {/* Header Row */}
          <View style={styles.tableHeaderRow}>
            <View style={styles.tableHeaderTitleCol}>
              <Text style={styles.tableTitle}>Features</Text>
              <Text style={styles.tableSub}>
                See what you get with and without Pass
              </Text>
            </View>

            {/* Column Tabs */}
            <View style={styles.columnTabsRow}>
              <View style={styles.nonPassCol}>
                <View style={styles.nonPassTab}>
                  <Text style={styles.nonPassTabText}>Non-Pass</Text>
                </View>
              </View>
              <View style={styles.passCol}>
                <LinearGradient
                  colors={["#a855f7", "#c026d3", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.passTabGrad}
                >
                  <FontAwesome5
                    name="crown"
                    size={ms(10)}
                    color="#FFD700"
                    style={{ marginRight: s(3) }}
                  />
                  <Text style={styles.passTabText}>Pass</Text>
                </LinearGradient>
              </View>
            </View>
          </View>

          {/* Table Rows */}
          <View style={styles.tableBody}>
            <View style={styles.passColumnHighlight} />

            {PASS_BENEFITS.map((b) => (
              <View key={b.label} style={styles.featureRow}>
                {/* Feature Icon & Labels */}
                <View style={styles.featureLabelCol}>
                  <LinearGradient
                    colors={["#7c4dff", "#c026d3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featureIconBox}
                  >
                    <Ionicons name={b.icon} size={ms(14)} color="#ffffff" />
                  </LinearGradient>
                  <Text style={styles.featureName}>{b.label}</Text>
                </View>

                {/* Non-Pass Column (Dash as requested) */}
                <View style={styles.nonPassCol}>
                  <Text style={styles.nonPassDash}>—</Text>
                </View>

                {/* Pass Column */}
                <View style={styles.passCol}>
                  {b.pass === true ? (
                    <View style={styles.passCheckBadge}>
                      <Ionicons name="checkmark" size={ms(13)} color="#ffffff" />
                    </View>
                  ) : (
                    <Text style={styles.passPerkText}>{b.pass}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacer so content is not hidden by sticky panel */}
        <View style={{ height: vs(165) }} />
      </ScrollView>

      {/* ── STICKY BOTTOM MODAL PANEL (Choose Your Plan + Buttons) ── */}
      <LinearGradient
        colors={["rgba(26,10,46,0.98)", "#120624"]}
        style={[
          styles.bottomStickyModal,
          { paddingBottom: vs(10) },
        ]}
      >
        {/* Header: Choose Your Plan */}
        <View style={styles.plansHeaderRow}>
          <View style={styles.plansHeaderLeft}>
            <FontAwesome5
              name="crown"
              size={ms(13)}
              color="#FFD700"
              style={{ marginRight: s(5) }}
            />
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
          </View>
          <Text style={styles.plansSubRight}>
            More Features. More Connections.
          </Text>
        </View>

        {/* 3 Tier Cards Row */}
        <View style={styles.plansCardsRow}>
          {PASS_TIERS.map((tier) => (
            <PlanCard
              key={tier.id}
              tier={tier}
              isActive={tier.id === selectedTierId}
              onSelect={() => setSelectedTierId(tier.id)}
            />
          ))}
        </View>

        {/* Action Buttons Row */}
        <View style={styles.ctaRow}>
          <AnimatedSendButton onPress={notWiredYet} />
          <AnimatedGetPassButton onPress={notWiredYet} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080314",
  },
  scroll: {
    paddingBottom: vs(10),
  },

  // ── Top Header ──
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
    paddingTop: vs(6),
    backgroundColor: "#080314",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerLogoIcon: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(10),
    position: "relative",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.5,
    shadowRadius: s(6),
    elevation: 4,
  },
  headerLogoDotLeft: {
    position: "absolute",
    top: vs(10),
    left: s(12),
    width: s(3.5),
    height: s(3.5),
    borderRadius: s(2),
    backgroundColor: "#ffffff",
  },
  headerLogoDotRight: {
    position: "absolute",
    top: vs(10),
    right: s(12),
    width: s(3.5),
    height: s(3.5),
    borderRadius: s(2),
    backgroundColor: "#ffffff",
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: ms(19),
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: ms(11),
    fontWeight: "600",
    marginTop: vs(2),
  },
  headerCloseBtn: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    borderColor: '#ffffff',
    borderWidth: s(1),
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: s(10),
  },

  // ── Hero Banner ──
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: s(16),
    marginTop: vs(6),
    marginBottom: vs(16),
    borderRadius: s(22),
    paddingHorizontal: s(18),
    paddingVertical: vs(20),
    shadowColor: "#c026d3",
    shadowOffset: { width: 0, height: vs(6) },
    shadowOpacity: 0.5,
    shadowRadius: s(14),
    elevation: 8,
    overflow: "hidden",
  },
  heroTextCol: {
    flex: 1.4,
    paddingRight: s(8),
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.28)",
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.4)",
  },
  heroPillText: {
    color: "#ffffff",
    fontSize: ms(9),
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroCardTitle: {
    color: "#ffffff",
    fontSize: ms(26),
    fontWeight: "900",
    letterSpacing: 0.4,
    marginBottom: vs(4),
  },
  heroCardSub: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: ms(9),
    fontWeight: "600",
    lineHeight: vs(16),
  },
  heroGraphicWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: vs(100),
  },
  heroOrbitRing: {
    position: "absolute",
    width: s(96),
    height: vs(48),
    borderRadius: s(48),
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.45)",
    transform: [{ rotate: "-18deg" }],
  },
  heroCardBadge: {
    width: s(72),
    height: s(72),
    borderRadius: s(18),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: s(8),
  },
  heroCrownFloating: {
    position: "absolute",
    top: -vs(12),
    zIndex: 3,
  },
  heroParticle1: {
    position: "absolute",
    top: vs(6),
    right: s(6),
  },
  heroParticle2: {
    position: "absolute",
    bottom: vs(10),
    left: s(4),
  },

  // ── Comparison Table ──
  tableCard: {
    marginHorizontal: s(16),
    backgroundColor: "#110624",
    borderRadius: s(20),
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.18)",
    overflow: "hidden",
    marginBottom: vs(16),
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tableHeaderTitleCol: {
    flex: 1,
  },
  tableTitle: {
    color: "#ffffff",
    fontSize: ms(15.5),
    fontWeight: "900",
  },
  tableSub: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: ms(8),
    fontWeight: "500",
    marginTop: vs(2),
  },
  columnTabsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  nonPassTab: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: s(14),
    paddingHorizontal: s(8),
    paddingVertical: vs(5),
    borderColor: "#ffffff",
    borderWidth: s(1),
    alignItems: "center",
    justifyContent: "center",
  },
  nonPassTabText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: ms(10),
    fontWeight: "700",
    textAlign: "center",
  },
  passTabGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: s(14),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.5,
    shadowRadius: s(4),
  },
  passTabText: {
    color: "#ffffff",
    fontSize: ms(10.5),
    fontWeight: "900",
    textAlign: "center",
  },
  tableBody: {
    position: "relative",
  },
  passColumnHighlight: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: s(88),
    backgroundColor: "rgba(192, 38, 211, 0.12)",
    borderLeftWidth: 1,
    borderLeftColor: "rgba(236, 72, 153, 0.2)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(14),
    paddingVertical: vs(11),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  featureLabelCol: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: s(8),
  },
  featureIconBox: {
    width: s(28),
    height: s(28),
    borderRadius: s(8),
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(10),
  },
  featureName: {
    color: "#ffffff",
    fontSize: ms(12.5),
    fontWeight: "700",
  },
  nonPassCol: {
    width: s(74),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  nonPassDash: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: ms(15),
    fontWeight: "700",
    textAlign: "center",
  },
  passCol: {
    width: s(74),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  passCheckBadge: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: "#a855f7",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    shadowColor: "#a855f7",
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.6,
    shadowRadius: s(3),
  },
  passPerkText: {
    color: "#f0d9ff",
    fontSize: ms(10.5),
    fontWeight: "800",
    textAlign: "center",
    alignSelf: "center",
  },

  // ── STICKY BOTTOM MODAL (Choose Plan + Action Buttons) ──
  bottomStickyModal: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: s(22),
    borderTopRightRadius: s(22),
    borderWidth: 1.5,
    borderColor: "rgba(232, 121, 249, 0.35)",
    paddingHorizontal: s(16),
    paddingTop: vs(9),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -vs(6) },
    shadowOpacity: 0.6,
    shadowRadius: s(14),
    elevation: 20,
  },
  plansHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: vs(12),
  },
  plansHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  plansTitle: {
    color: "#ffffff",
    fontSize: ms(13.5),
    fontWeight: "900",
  },
  plansSubRight: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: ms(9.5),
    fontWeight: "600",
  },
  plansCardsRow: {
    flexDirection: "row",
    gap: s(7),
    marginBottom: vs(8),
  },
  planCardWrapper: {
    flex: 1,
  },
  planCard: {
    borderRadius: s(12),
    paddingHorizontal: s(6),
    paddingTop: vs(8),
    paddingBottom: vs(6.5),
    position: "relative",
  },
  planCardInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.5,
    borderColor: "rgba(167, 139, 250, 0.22)",
  },
  planCardActive: {
    backgroundColor: "rgba(192, 38, 211, 0.2)",
    borderWidth: 1.5,
    borderColor: "#ec4899",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.5,
    shadowRadius: s(8),
    elevation: 6,
  },
  planTagContainer: {
    position: "absolute",
    top: -vs(8),
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 4,
  },
  planTagGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: s(5),
    paddingVertical: vs(1.5),
    borderRadius: s(7),
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.5,
    shadowRadius: s(3),
  },
  planTagDefault: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: s(7),
    paddingHorizontal: s(5),
    paddingVertical: vs(1.5),
  },
  planTagTextActive: {
    color: "#ffffff",
    fontSize: ms(8),
    fontWeight: "900",
  },
  planTagTextDefault: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: ms(8),
    fontWeight: "800",
  },
  planTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: vs(5),
  },
  planIconBox: {
    width: s(20),
    height: s(20),
    borderRadius: s(5),
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: s(4.5),
  },
  planIconBoxActive: {
    backgroundColor: "#ec4899",
  },
  planDays: {
    color: "#ffffff",
    fontSize: ms(11.5),
    fontWeight: "900",
  },
  planDaysActive: {
    color: "#ffffff",
  },
  planBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  planPrice: {
    color: "#ffffff",
    fontSize: ms(15),
    fontWeight: "900",
  },
  planPriceActive: {
    color: "#ffffff",
    textShadowColor: "rgba(236, 72, 153, 0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  radioCircle: {
    width: s(14),
    height: s(14),
    borderRadius: s(7),
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: {
    backgroundColor: "#ec4899",
    borderColor: "#ec4899",
  },

  // ── Action Buttons Row ──
  ctaRow: {
    flexDirection: "row",
    gap: s(8),
    alignItems: "center",
    marginBottom: vs(6),
    marginTop: vs(10)
  },
  sendButtonWrap: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "rgba(167, 139, 250, 0.45)",
    backgroundColor: "rgba(124, 77, 255, 0.14)",
    borderRadius: s(24),
    paddingVertical: vs(9.5),
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "#c084fc",
    fontSize: ms(12.5),
    fontWeight: "800",
  },
  ctaButtonWrap: {
    borderRadius: s(24),
    overflow: "hidden",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.6,
    shadowRadius: s(10),
    elevation: 8,
  },
  ctaButtonGrad: {
    flexDirection: "row",
    paddingVertical: vs(9.5),
    alignItems: "center",
    justifyContent: "center",
  },
  ctaButtonText: {
    color: "#ffffff",
    fontSize: ms(13),
    fontWeight: "900",
    letterSpacing: 0.3,
  },
});
