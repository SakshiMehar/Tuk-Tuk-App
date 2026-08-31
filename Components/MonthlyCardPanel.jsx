import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

const TIERS = [
  {
    key: "basic",
    label: "Basic Card",
    price: "INR 144/30Days",
    totalValue: "44,500",
    description: "Wear and use the exclusive Monthly Card frame. During the subscription period, you can change the item an unlimited number of times.",
  },
  {
    key: "elite",
    label: "Elite Card",
    price: "INR 349/30Days",
    totalValue: "98,000",
    description: "Wear and use the exclusive Elite Card frame plus a bonus room-entrance effect. During the subscription period, you can change the item an unlimited number of times.",
  },
  {
    key: "dress",
    label: "Dress Card",
    price: "INR 599/30Days",
    totalValue: "1,60,000",
    description: "Wear and use the exclusive Dress Card outfit plus a bonus chat bubble. During the subscription period, you can change the item an unlimited number of times.",
  },
];

const SPARKLE_POSITIONS = [
  { top: "8%", left: "12%", size: 12, opacity: 0.8 },
  { top: "16%", left: "82%", size: 9, opacity: 0.55 },
  { top: "30%", left: "6%", size: 7, opacity: 0.45 },
  { top: "12%", left: "48%", size: 8, opacity: 0.6 },
  { top: "38%", left: "90%", size: 10, opacity: 0.5 },
  { top: "46%", left: "16%", size: 6, opacity: 0.4 },
];

function Ribbon({ children, style, contentStyle, pointBoth = true }) {
  const points = pointBoth ? "6,0 94,0 100,50 94,100 6,100 0,50" : "0,0 92,0 100,50 92,100 0,100 8,50";
  return (
    <View style={[styles.ribbonWrap, style]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
        <Polygon points={points} fill="rgba(59,26,120,0.78)" stroke="#e879f9" strokeWidth={1.4} />
      </Svg>
      <View style={[styles.ribbonContent, contentStyle]}>{children}</View>
    </View>
  );
}

export default function MonthlyCardPanel() {
  const [selectedTier, setSelectedTier] = useState(TIERS[0].key);
  const tier = TIERS.find((t) => t.key === selectedTier) ?? TIERS[0];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <LinearGradient colors={["#1a0a2e", "#2d1b4e", "#16082a"]} style={styles.hero}>
        {SPARKLE_POSITIONS.map((s, i) => (
          <Text
            key={i}
            style={[styles.sparkle, { top: s.top, left: s.left, fontSize: s.size, opacity: s.opacity }]}
          >
            ✦
          </Text>
        ))}

        <TouchableOpacity
          style={styles.faqBtn}
          activeOpacity={0.8}
          onPress={() => Alert.alert("FAQ", "Activate a card to earn diamonds back over 30 days and unlock the matching frame/outfit.")}
        >
          <Text style={styles.faqBtnText}>?</Text>
        </TouchableOpacity>

        <FontAwesome5 name="crown" size={22} color="#e879f9" style={styles.crownIcon} />
        <Text style={styles.heroTitle}>MONTHLY CARD</Text>

        <View style={styles.cardVisualWrap}>
          <View style={styles.cardGlow} />
          <LinearGradient colors={["#3b1a78", "#1a0a2e"]} style={styles.cardVisual}>
            <View style={[styles.cardCorner, styles.cardCornerTL]} />
            <View style={[styles.cardCorner, styles.cardCornerTR]} />
            <View style={[styles.cardCorner, styles.cardCornerBL]} />
            <View style={[styles.cardCorner, styles.cardCornerBR]} />
            <Ionicons name="diamond" size={16} color="#e879f9" style={{ marginBottom: 6 }} />
            <Text style={styles.cardVisualText}>Monthly{"\n"}Card</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Ribbon pointBoth={false} style={styles.perkRibbon}>
          <Text style={styles.perkText}>
            Activate to return diamonds. Continuously can{" "}
            <Text style={styles.perkTextHighlight}>get for 30 days!</Text>
          </Text>
        </Ribbon>

        <Ribbon pointBoth={false} style={styles.perkRibbon}>
          <Text style={styles.perkText}>Pick up the limited monthly dynamic avatar</Text>
        </Ribbon>

        <Ribbon style={styles.rewardRibbon}>
          <Text style={styles.rewardText}>
            {tier.totalValue}💎 <Text style={styles.rewardTextEmphasis}>every month!</Text>
          </Text>
        </Ribbon>
        <Text style={styles.rewardSub}>You can get rewards with a total value of up to</Text>

        <View style={styles.tabRow}>
          {TIERS.map((t) =>
            t.key === selectedTier ? (
              <Ribbon key={t.key} style={styles.tabActiveRibbon} contentStyle={styles.tabActiveContent}>
                <Text style={styles.tabActiveText}>{t.label}</Text>
              </Ribbon>
            ) : (
              <TouchableOpacity key={t.key} style={styles.tabItem} activeOpacity={0.7} onPress={() => setSelectedTier(t.key)}>
                <Text style={styles.tabText}>{t.label}</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <View style={styles.offerCard}>
          <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.7} onPress={() => Alert.alert("Refreshed", "Card offer refreshed.")}>
            <Ionicons name="refresh" size={16} color="#a78bfa" />
          </TouchableOpacity>
          <View style={styles.notAvailablePill}>
            <Text style={styles.notAvailablePillText}>Not Available</Text>
          </View>

          <Ribbon style={styles.priceRibbon}>
            <Text style={styles.priceRibbonText}>{tier.price}</Text>
          </Ribbon>

          <Text style={styles.offerDescription}>{tier.description}</Text>
        </View>

        <TouchableOpacity
          style={styles.subscribeBtn}
          activeOpacity={0.8}
          onPress={() => Alert.alert("Not available yet", `${tier.label} isn't ready for purchase yet — check back soon!`)}
        >
          <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.subscribeBtnGrad}>
            <Text style={styles.subscribeBtnText}>Activate {tier.label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 32,
  },
  hero: {
    paddingTop: 26,
    paddingBottom: 34,
    alignItems: "center",
    overflow: "hidden",
  },
  sparkle: {
    position: "absolute",
    color: "#f0d9ff",
  },
  faqBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(232,121,249,0.18)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  faqBtnText: {
    color: "#e879f9",
    fontWeight: "800",
    fontSize: 14,
  },
  crownIcon: {
    marginBottom: 4,
  },
  heroTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    letterSpacing: 2,
    textShadowColor: "rgba(232,121,249,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    marginBottom: 18,
  },
  cardVisualWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(232,121,249,0.22)",
  },
  cardVisual: {
    width: 132,
    height: 176,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#a78bfa",
    alignItems: "center",
    justifyContent: "center",
  },
  cardCorner: {
    position: "absolute",
    width: 16,
    height: 16,
    borderColor: "#e879f9",
  },
  cardCornerTL: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 6 },
  cardCornerTR: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 6 },
  cardCornerBL: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 6 },
  cardCornerBR: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 6 },
  cardVisualText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  body: {
    padding: 16,
  },
  ribbonWrap: {
    width: "100%",
    minHeight: 44,
  },
  ribbonContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  perkRibbon: {
    marginBottom: 10,
  },
  perkText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12.5,
    fontStyle: "italic",
    textAlign: "center",
  },
  perkTextHighlight: {
    color: "#e879f9",
    fontWeight: "800",
    fontStyle: "italic",
  },
  rewardRibbon: {
    marginTop: 8,
    minHeight: 48,
  },
  rewardText: {
    color: "#e879f9",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
  },
  rewardTextEmphasis: {
    color: "white",
  },
  rewardSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11.5,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 20,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  tabActiveRibbon: {
    flex: 1.2,
    minHeight: 40,
  },
  tabActiveContent: {
    paddingHorizontal: 8,
  },
  tabActiveText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "700",
  },
  offerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    backgroundColor: "rgba(124,77,255,0.1)",
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 18,
    position: "relative",
  },
  refreshBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  notAvailablePill: {
    alignSelf: "flex-end",
    backgroundColor: "#7c4dff",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 46,
    marginBottom: 10,
  },
  notAvailablePillText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  priceRibbon: {
    alignSelf: "center",
    width: "82%",
    minHeight: 42,
    marginBottom: 12,
  },
  priceRibbonText: {
    color: "#e879f9",
    fontSize: 14,
    fontWeight: "800",
  },
  offerDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  subscribeBtn: {
    borderRadius: 24,
    overflow: "hidden",
    alignSelf: "stretch",
  },
  subscribeBtnGrad: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  subscribeBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "900",
  },
});
