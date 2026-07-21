import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

export default function TukTukPassPanel() {
  const insets = useSafeAreaInsets();
  const [selectedTierId, setSelectedTierId] = useState(
    PASS_TIERS.find((t) => t.featured)?.id ?? PASS_TIERS[0].id
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <LinearGradient colors={["#3b1a78", "#7c4dff", "#e879f9"]} style={styles.hero}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Pass</Text>
            <Text style={styles.heroSub}>Unlock all benefits now!</Text>
          </View>
          <View style={styles.heroBadge}>
            <FontAwesome5 name="crown" size={16} color="#ffd76a" style={styles.heroBadgeCrown} />
            <Ionicons name="shield" size={44} color="#f0d9ff" />
            <Text style={styles.heroBadgeText}>PASS</Text>
          </View>
        </LinearGradient>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.benefitCol]}>Benefits</Text>
          <Text style={styles.tableHeaderCell}>Non-Pass</Text>
          <Text style={styles.tableHeaderCell}>Pass</Text>
        </View>

        {PASS_BENEFITS.map((b) => (
          <View key={b.label} style={styles.benefitRow}>
            <View style={[styles.benefitCol, styles.benefitLabelWrap]}>
              <LinearGradient colors={["#7c4dff", "#e879f9"]} style={styles.benefitIcon}>
                <Ionicons name={b.icon} size={14} color="white" />
              </LinearGradient>
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
            <Text style={styles.nonPassCell}>—</Text>
            {b.pass === true ? (
              <Ionicons name="checkmark" size={18} color="#e879f9" style={styles.passCellIcon} />
            ) : (
              <Text style={styles.passCellText}>{b.pass}</Text>
            )}
          </View>
        ))}

        <View style={{ height: 176 + insets.bottom }} />
      </ScrollView>

      <LinearGradient
        colors={["rgba(26,10,46,0.98)", "#1a0a2e"]}
        style={[styles.bottomPanel, { paddingBottom: 16 + insets.bottom }]}
      >
        <View style={styles.tierRow}>
          {PASS_TIERS.map((tier) => {
            const active = tier.id === selectedTierId;
            return (
              <TouchableOpacity
                key={tier.id}
                style={[styles.tierCard, active && styles.tierCardActive]}
                activeOpacity={0.85}
                onPress={() => setSelectedTierId(tier.id)}
              >
                <View style={[styles.tierTag, active && styles.tierTagActive]}>
                  <Text style={[styles.tierTagText, active && styles.tierTagTextActive]}>{tier.tag}</Text>
                </View>
                <Text style={styles.tierDays}>{tier.days} days</Text>
                <Text style={[styles.tierPrice, active && styles.tierPriceActive]}>INR {tier.price}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity style={styles.sendBtn} activeOpacity={0.85} onPress={notWiredYet}>
            <Text style={styles.sendBtnText}>Send to friend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.getBtnWrap} activeOpacity={0.85} onPress={notWiredYet}>
            <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.getBtn}>
              <Text style={styles.getBtnText}>Get Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 8,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 22,
    borderRadius: 18,
    margin: 14,
  },
  heroTitle: {
    color: "white",
    fontSize: 26,
    fontWeight: "900",
    fontStyle: "italic",
  },
  heroSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  heroBadge: {
    width: 66,
    height: 66,
    alignItems: "center",
    justifyContent: "center",
  },
  heroBadgeCrown: {
    position: "absolute",
    top: -10,
  },
  heroBadgeText: {
    position: "absolute",
    color: "#3b1a78",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tableHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tableHeaderCell: {
    flex: 1,
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  benefitCol: {
    flex: 1.6,
    textAlign: "left",
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  benefitLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  nonPassCell: {
    flex: 1,
    color: "rgba(255,255,255,0.3)",
    fontSize: 15,
    textAlign: "center",
  },
  passCellIcon: {
    flex: 1,
    textAlign: "center",
  },
  passCellText: {
    flex: 1,
    color: "#f0d9ff",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  bottomPanel: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    padding: 16,
  },
  tierRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  tierCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.08)",
  },
  tierCardActive: {
    borderColor: "#e879f9",
    backgroundColor: "rgba(124,77,255,0.22)",
  },
  tierTag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 8,
  },
  tierTagActive: {
    backgroundColor: "#e879f9",
  },
  tierTagText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "800",
  },
  tierTagTextActive: {
    color: "white",
  },
  tierDays: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    marginBottom: 4,
  },
  tierPrice: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    fontWeight: "800",
  },
  tierPriceActive: {
    color: "#f0d9ff",
  },
  ctaRow: {
    flexDirection: "row",
    gap: 10,
  },
  sendBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    backgroundColor: "rgba(124,77,255,0.12)",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "800",
  },
  getBtnWrap: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  getBtn: {
    paddingVertical: 14,
    alignItems: "center",
  },
  getBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
});
