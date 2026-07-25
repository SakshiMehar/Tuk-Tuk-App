import { useCallback, useMemo, useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatInr } from "../src/data/diamondRechargeCatalog";
import { DIAMOND_PACKAGE_TIERS } from "../src/data/diamondPackageTiers";
import { loadOfflineRechargeAgent } from "../src/services/offlineRechargeService";
import { getAppUserId } from "../src/utils/sessionUser";
import WalletUserCard from "./WalletUserCard";
import WalletDetailsModal from "./WalletDetailsModal";

const REWARD_GEMS_IMAGE = require("../assets/Treasure/reward-gems.png");

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

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

const sanitizePhone = (value) => String(value ?? "").replace(/[^\d+]/g, "");

const isCountryRequiredError = (message) =>
  /country name is required|set your country/i.test(String(message ?? ""));

const buildRechargeMessage = (pkg, userId) =>
  `Hi, I want to recharge Tuk-Tuk diamonds.\n` +
  (pkg ? `Package: ${formatInr(pkg.inr)} for ${formatCompact(pkg.diamonds)} diamonds\n` : "") +
  (userId ? `User ID: ${userId}\n` : "") +
  `Please share payment details.`;

/**
 * Recharge store — tabs (Diamonds/Golds/Crown), balance, user-level card,
 * promo banner, coupon row, and package grid. Embeddable inline (e.g. inside
 * the profile "Wallet" menu sheet) — no outer Modal of its own.
 *
 * Diamond packages are a static local catalog (DIAMOND_PACKAGE_TIERS); the
 * offline-recharge agent contact is real backend data. Coupons and the
 * Golds/Crown tab actions are still stubs — no backend for those yet.
 */
export default function WalletRechargeSection({ currentDiamonds = 0, currentCoins = 0 }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("diamonds");
  const [selectedId, setSelectedId] = useState(DIAMOND_PACKAGE_TIERS[0]?.id ?? null);
  const packages = DIAMOND_PACKAGE_TIERS;
  const [agent, setAgent] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) ?? null,
    [packages, selectedId]
  );

  // Fetches (and caches) the offline-recharge agent on first contact/recharge tap —
  // no need to load it up front since Golds/Crown tabs never need it.
  const ensureAgent = useCallback(async () => {
    if (agent) return { agentData: agent, resolvedUserId: userId };
    setAgentLoading(true);
    try {
      const [agentData, resolvedUserId] = await Promise.all([
        loadOfflineRechargeAgent(),
        getAppUserId(),
      ]);
      setAgent(agentData);
      setUserId(resolvedUserId);
      return { agentData, resolvedUserId };
    } catch (err) {
      const message = err?.message || "Could not load recharge agent.";
      if (isCountryRequiredError(message)) {
        Alert.alert("Country required", message, [
          { text: "Cancel", style: "cancel" },
          { text: "Set country", onPress: () => router.push("/account") },
        ]);
      } else {
        Alert.alert("Contact unavailable", message);
      }
      return null;
    } finally {
      setAgentLoading(false);
    }
  }, [agent, userId, router]);

  const contactAgentOnWhatsApp = useCallback(async (pkg) => {
    const result = await ensureAgent();
    if (!result) return;
    const { agentData, resolvedUserId } = result;
    const phone = sanitizePhone(agentData?.whatsapp || agentData?.phone);
    if (!phone) {
      Alert.alert("Contact unavailable", "No WhatsApp number is available for the recharge agent.");
      return;
    }
    const message = encodeURIComponent(buildRechargeMessage(pkg, resolvedUserId));
    const url = `https://wa.me/${phone.replace(/^\+/, "")}?text=${message}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert("WhatsApp", "Could not open WhatsApp on this device.");
      return;
    }
    Linking.openURL(url);
  }, [ensureAgent]);

  const handleContactUs = () => contactAgentOnWhatsApp(selectedPackage);
  const handleRechargeNow = () => contactAgentOnWhatsApp(selectedPackage);

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
            style={styles.detailsBtn}
            activeOpacity={0.8}
            onPress={() => setDetailsVisible(true)}
          >
            <Ionicons name="receipt-outline" size={14} color="#e879f9" />
            <Text style={styles.detailsBtnText}>Details</Text>
            <Ionicons name="chevron-forward" size={14} color="#e879f9" />
          </TouchableOpacity>
        </View>
      )}

      <WalletDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        currency={activeTab}
        totalDiamonds={currentDiamonds}
        totalCoins={currentCoins}
      />

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

          <TouchableOpacity
            style={styles.contactRow}
            activeOpacity={0.8}
            disabled={agentLoading}
            onPress={handleContactUs}
          >
            {agentLoading ? (
              <ActivityIndicator color="#a78bfa" size="small" />
            ) : (
              <>
                <Text style={styles.contactRowText}>Contact us</Text>
                <Ionicons name="chevron-forward" size={16} color="#a78bfa" />
              </>
            )}
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
            {packages.map((pkg) => {
              const active = pkg.id === selectedId;
              return (
                <TouchableOpacity
                  key={pkg.id}
                  style={[styles.packageCard, active && styles.packageCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedId(pkg.id)}
                >
                  {pkg.popular && (
                    <View style={styles.popularRibbon}>
                      <Text style={styles.popularRibbonText}>Popular</Text>
                    </View>
                  )}
                  <Image source={REWARD_GEMS_IMAGE} style={styles.packageGemImage} resizeMode="contain" />
                  <Text style={styles.packageName}>{pkg.name}</Text>
                  <Text style={styles.packageAmount}>{pkg.diamonds.toLocaleString("en-IN")}</Text>
                  <View style={[styles.packagePriceStrip, active && styles.packagePriceStripActive]}>
                    <Text style={styles.packagePriceText}>{formatInr(pkg.inr)}</Text>
                  </View>
                  {pkg.exp != null && (
                    <View style={styles.packageExpStrip}>
                      <Text style={styles.packageExpText}>
                        +{pkg.exp.toLocaleString("en-IN")} Exp
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 14 }} />
          <TouchableOpacity
            style={[styles.primaryBtnWrap, (!selectedPackage || agentLoading) && styles.btnDisabled]}
            activeOpacity={0.85}
            disabled={!selectedPackage || agentLoading}
            onPress={handleRechargeNow}
          >
            <LinearGradient
              colors={["#f472b6", "#fb923c"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              {agentLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {selectedPackage ? `Recharge ${formatInr(selectedPackage.inr)} Now` : "Select a package"}
                </Text>
              )}
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
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(232,121,249,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.35)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  detailsBtnText: {
    color: "#e879f9",
    fontSize: 13,
    fontWeight: "700",
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
    backgroundColor: "#fdf1d3",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    paddingTop: 14,
  },
  packageCardActive: {
    borderColor: "#e879f9",
  },
  popularRibbon: {
    position: "absolute",
    top: 8,
    right: -26,
    width: 100,
    backgroundColor: "#f59e0b",
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    paddingVertical: 2,
  },
  popularRibbonText: {
    color: "#3b1a08",
    fontSize: 9,
    fontWeight: "800",
  },
  packageGemImage: {
    width: 48,
    height: 36,
  },
  packageName: {
    color: "#7c4a1e",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  packageAmount: {
    color: "#2a1a06",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 12,
  },
  packagePriceStrip: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: "#f7dfa0",
  },
  packagePriceStripActive: {
    backgroundColor: "#f0c869",
  },
  packagePriceText: {
    color: "#7c4a1e",
    fontSize: 13,
    fontWeight: "800",
  },
  packageExpStrip: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  packageExpText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "800",
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
