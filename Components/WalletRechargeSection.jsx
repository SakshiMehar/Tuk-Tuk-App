import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatInr } from "../src/data/diamondRechargeCatalog";
import WalletUserCard from "./WalletUserCard";

const formatCompact = (value) => {
  const n = Number(value) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const CURRENCY_TABS = [
  { key: "diamonds", label: "Diamonds" },
  { key: "golds", label: "Golds" },
  { key: "crown", label: "Crown" },
];

// Static placeholder packages for now — no backend call wired up yet.
const PLACEHOLDER_PACKAGES = [
  { id: "p1", diamonds: 300, inr: 3 },
  { id: "p2", diamonds: 980, inr: 9 },
  { id: "p3", diamonds: 1980, inr: 18 },
  { id: "p4", diamonds: 6000, inr: 28 },
  { id: "p5", diamonds: 15000, inr: 57 },
  { id: "p6", diamonds: 150000, inr: 577 },
];

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

/**
 * Recharge store — tabs (Diamonds/Golds/Crown), balance, user-level card,
 * promo banner, coupon row, and package grid. Embeddable inline (e.g. inside
 * the profile "Wallet" menu sheet) — no outer Modal of its own.
 *
 * Presentational only for now — no API calls (packages/agent/coupon) are
 * wired up. currentDiamonds/currentCoins are the only real data, passed in
 * from the existing wallet balance hook.
 */
export default function WalletRechargeSection({ currentDiamonds = 0, currentCoins = 0 }) {
  const [activeTab, setActiveTab] = useState("diamonds");
  const [selectedId, setSelectedId] = useState(PLACEHOLDER_PACKAGES[0].id);

  const selectedPackage = useMemo(
    () => PLACEHOLDER_PACKAGES.find((pkg) => pkg.id === selectedId) ?? null,
    [selectedId]
  );

  return (
    <View>
      <View style={styles.tabRow}>
        {CURRENCY_TABS.map((tab) => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab !== "crown" && (
        <View style={styles.balanceRow}>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillIcon}>{activeTab === "diamonds" ? "💎" : "🪙"}</Text>
            <Text style={styles.balancePillValue}>
              {(activeTab === "diamonds" ? currentDiamonds : currentCoins).toLocaleString("en-IN")}
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => Alert.alert("Details", "Full transaction history is below in Recent Transactions.")}
          >
            <Text style={styles.detailsLink}>Details ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 14 }} />
      <WalletUserCard />
      <View style={{ height: 14 }} />

      {activeTab === "crown" ? (
        <View style={styles.comingSoonBox}>
          <Ionicons name="construct-outline" size={28} color="#a78bfa" />
          <Text style={styles.comingSoonTitle}>Coming soon</Text>
          <Text style={styles.comingSoonSub}>Crown rewards aren't live yet — check back soon!</Text>
        </View>
      ) : activeTab === "golds" ? (
        <View style={styles.goldsInfoCard}>
          <Text style={styles.goldsInfoTitle}>Way to Get Golds</Text>
          <Text style={styles.goldsInfoItem}>1. Golds can be gained by signing in.</Text>
          <Text style={styles.goldsInfoItem}>2. Golds can be gained by doing tasks and milestones.</Text>

          <View style={styles.goldsInfoLinkRow}>
            <TouchableOpacity style={styles.goldsInfoLink} activeOpacity={0.8} onPress={notWiredYet}>
              <Text style={styles.goldsInfoLinkIcon}>🪙</Text>
              <Text style={styles.goldsInfoLinkText}>Earn golds</Text>
              <Ionicons name="chevron-forward" size={14} color="#e879f9" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.goldsInfoLink} activeOpacity={0.8} onPress={notWiredYet}>
              <Ionicons name="swap-horizontal" size={16} color="#e879f9" />
              <Text style={styles.goldsInfoLinkText}>Exchange</Text>
              <Ionicons name="chevron-forward" size={14} color="#e879f9" />
            </TouchableOpacity>
          </View>

          <View style={styles.goldsInfoDivider} />

          <Text style={styles.goldsInfoTitle}>Uses of Golds</Text>
          <Text style={styles.goldsInfoItem}>1. Golds can be used to send gifts.</Text>
          <Text style={styles.goldsInfoItem}>2. Golds can be used to increase match times.</Text>

          <TouchableOpacity style={styles.goldsInfoLink} activeOpacity={0.8} onPress={notWiredYet}>
            <Text style={styles.goldsInfoLinkIcon}>🏪</Text>
            <Text style={styles.goldsInfoLinkText}>Go store</Text>
            <Ionicons name="chevron-forward" size={14} color="#e879f9" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <LinearGradient
            colors={["#7c4dff", "#c026d3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.promoBanner}
          >
            <Text style={styles.promoBannerText}>BIG REWARDS FOR FIRST RECHARGING!</Text>
          </LinearGradient>

          <TouchableOpacity style={styles.contactRow} activeOpacity={0.8} onPress={notWiredYet}>
            <Text style={styles.contactRowText}>Contact us</Text>
            <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>
            Recharge Diamonds
          </Text>

          <TouchableOpacity
            style={styles.couponRow}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Coupon", "No coupons available right now.")}
          >
            <Text style={styles.couponLabel}>Coupon</Text>
            <Text style={styles.couponValue}>No coupons available</Text>
          </TouchableOpacity>

          <View style={{ height: 12 }} />

          <View style={styles.packageGrid}>
            {PLACEHOLDER_PACKAGES.map((pkg) => {
              const active = pkg.id === selectedId;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, active && styles.packageCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(pkg.id)}
                >
                  <Text style={styles.packageIcon}>💎</Text>
                  <Text style={styles.packageAmount}>{formatCompact(pkg.diamonds)}</Text>
                  <View style={[styles.packagePriceStrip, active && styles.packagePriceStripActive]}>
                    <Text style={styles.packagePriceText}>{formatInr(pkg.inr)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 14 }} />
          <TouchableOpacity
            style={[styles.primaryBtnWrap, !selectedPackage && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={!selectedPackage}
            onPress={notWiredYet}
          >
            <LinearGradient
              colors={["#f472b6", "#fb923c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>
                {selectedPackage ? `Recharge ${formatInr(selectedPackage.inr)} Now` : "Select a package"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 14,
  },
  tabLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15,
    fontWeight: "700",
  },
  tabLabelActive: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  balancePillIcon: {
    fontSize: 18,
  },
  balancePillValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  detailsLink: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  comingSoonBox: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 32,
  },
  comingSoonTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  comingSoonSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  goldsInfoCard: {
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 20,
    padding: 18,
  },
  goldsInfoTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  goldsInfoItem: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    lineHeight: 20,
  },
  goldsInfoLinkRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 14,
  },
  goldsInfoLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  goldsInfoLinkIcon: {
    fontSize: 14,
  },
  goldsInfoLinkText: {
    color: "#e879f9",
    fontSize: 13,
    fontWeight: "700",
  },
  goldsInfoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 20,
  },
  promoBanner: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 22,
    marginBottom: 12,
  },
  promoBannerText: {
    color: "#fde68a",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 4,
    marginBottom: 14,
  },
  contactRowText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 10,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  couponLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  couponValue: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  packageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  packageCard: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: 14,
  },
  packageCardActive: {
    borderColor: "#e879f9",
    backgroundColor: "rgba(124,77,255,0.18)",
  },
  packageIcon: {
    fontSize: 26,
  },
  packageAmount: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
    marginBottom: 12,
  },
  packagePriceStrip: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  packagePriceStripActive: {
    backgroundColor: "rgba(232,121,249,0.3)",
  },
  packagePriceText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  primaryBtnWrap: {
    borderRadius: 999,
    overflow: "hidden",
  },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 12,
  },
  primaryBtnText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
