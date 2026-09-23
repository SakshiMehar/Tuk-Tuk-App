import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { formatDiamonds, formatInr } from "../src/data/diamondRechargeCatalog";
import { loadOfflineRechargeAgent } from "../src/services/offlineRechargeService";
import { loadDiamondStockPackages } from "../src/services/diamondStockService";
import { getDiamondStockManager } from "../src/api/rechargeApi";
import { getAppUserId } from "../src/utils/sessionUser";
import { getUser } from "../src/store/authStore";
import { loadMyProfile } from "../src/services/meProfileService";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import { loadMyVipAssets } from "../src/services/vipService";
import { fetchUserDecorations } from "../src/services/decorationsService";
import { resolveLocalLevelBadge } from "../src/utils/levelBadge";
import { VIP_XP_THRESHOLD, VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import WalletDetailsModal from "./WalletDetailsModal";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const BADGE_HEIGHT = 16;
const LEVEL_BADGE_ASPECT = 142 / 149;
const DECORATION_BADGE_ASPECT = 438 / 179;

const REWARD_GEMS_IMAGE = {
  uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Treasure/reward-gems.png",
};

const DEFAULT_PACKAGES = [
  {
    id: "pkg-1",
    diamonds: 37500,
    diamondsDisplay: "37.5K",
    bonus: 15000,
    bonusDisplay: "+15.0K",
    badge: "Newbie Bonus",
    inr: 143,
  },
  {
    id: "pkg-2",
    diamonds: 50000,
    diamondsDisplay: "50.0K",
    bonus: 20000,
    bonusDisplay: "+20.0K",
    badge: "Newbie Bonus",
    inr: 191,
  },
  {
    id: "pkg-3",
    diamonds: 100000,
    diamondsDisplay: "100.0K",
    bonus: 40000,
    bonusDisplay: "+40.0K",
    badge: "Newbie Bonus",
    inr: 383,
  },
  {
    id: "pkg-4",
    diamonds: 250000,
    diamondsDisplay: "250.0K",
    bonus: 100000,
    bonusDisplay: "+100.0K",
    badge: "Newbie Bonus",
    inr: 955,
  },
  {
    id: "pkg-5",
    diamonds: 500000,
    diamondsDisplay: "500.0K",
    bonus: 200000,
    bonusDisplay: "+200.0K",
    badge: "Newbie Bonus",
    inr: 1910,
  },
  {
    id: "pkg-6",
    diamonds: 1000000,
    diamondsDisplay: "1,000.0K",
    bonus: 400000,
    bonusDisplay: "+400.0K",
    badge: "Newbie Bonus",
    inr: 3820,
  },
];

const formatCompactK = (num) => {
  const n = Number(num) || 0;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

const sanitizePhone = (value) => String(value ?? "").replace(/[^\d+]/g, "");

const isCountryRequiredError = (message) =>
  /country name is required|set your country/i.test(String(message ?? ""));

export default function DiamondRechargeModal({
  visible,
  onClose,
  currentDiamonds = 0,
  currentCoins = 0,
  initialTab = "diamonds",
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedId, setSelectedId] = useState("pkg-1");
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState(null);

  const [agent, setAgent] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState(null);
  const [userId, setUserId] = useState(null);

  const [user, setUser] = useState(null);
  const [level, setLevel] = useState(1);
  const [gamificationXp, setGamificationXp] = useState(null);
  const [vipProfileFrame, setVipProfileFrame] = useState(null);
  const [vipLogo, setVipLogo] = useState(null);
  const [decorationBadgeUrl, setDecorationBadgeUrl] = useState(null);

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Stock Managers popup modal states
  const [stockManagersVisible, setStockManagersVisible] = useState(false);
  const [stockManagers, setStockManagers] = useState([]);
  const [stockManagersLoading, setStockManagersLoading] = useState(false);
  const [stockManagersError, setStockManagersError] = useState(null);

  // Sync initialTab if changed
  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  // Load user profile, level, badges and XP progress dynamically
  const loadUserData = useCallback(async () => {
    try {
      const [storedUser, profileData, levelResult] = await Promise.all([
        getUser().catch(() => null),
        loadMyProfile().catch(() => null),
        syncUserLevelForSession().catch(() => null),
      ]);

      const mergedUser = {
        ...(storedUser || {}),
        ...(profileData || {}),
      };

      setUser(mergedUser);
      const resolvedLevel = levelResult?.level ?? mergedUser?.level ?? 1;
      setLevel(resolvedLevel);
      setGamificationXp(levelResult?.xp ?? null);

      const totalXp = levelResult?.xp?.totalXp ?? levelResult?.xp?.currentLevelXp ?? 0;
      const vipAssets = await loadMyVipAssets(totalXp).catch(() => null);
      setVipProfileFrame(vipAssets?.unlocked ? vipAssets.profileFrame : null);
      setVipLogo(vipAssets?.unlocked ? vipAssets.logo : null);

      const myUserId = mergedUser?.id ?? mergedUser?.userId ?? (await getAppUserId().catch(() => null));
      if (myUserId) {
        setUserId(myUserId);
        const decorations = await fetchUserDecorations(myUserId).catch(() => null);
        setDecorationBadgeUrl(decorations?.badgeUrl ?? null);
      }
    } catch (err) {
      console.warn("Could not load user data for recharge modal:", err);
    }
  }, []);

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    try {
      const list = await loadDiamondStockPackages();
      if (list && list.length > 0) {
        const mapped = list.map((pkg, idx) => {
          const bonusAmt = Math.round(pkg.diamonds * 0.4);
          return {
            id: pkg.id || `stock-${idx}`,
            diamonds: pkg.diamonds,
            diamondsDisplay: formatCompactK(pkg.diamonds),
            bonus: bonusAmt,
            bonusDisplay: `+${formatCompactK(bonusAmt)}`,
            badge: "Newbie Bonus",
            inr: pkg.inr,
          };
        });
        setPackages(mapped);
        setSelectedId((prev) =>
          mapped.some((p) => p.id === prev) ? prev : (mapped[0]?.id ?? null)
        );
      } else {
        setPackages(DEFAULT_PACKAGES);
        setSelectedId((prev) =>
          DEFAULT_PACKAGES.some((p) => p.id === prev) ? prev : DEFAULT_PACKAGES[0].id
        );
      }
    } catch (err) {
      setPackages(DEFAULT_PACKAGES);
      setSelectedId((prev) =>
        DEFAULT_PACKAGES.some((p) => p.id === prev) ? prev : DEFAULT_PACKAGES[0].id
      );
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const fetchAgent = useCallback(async () => {
    setAgentLoading(true);
    setAgentError(null);
    try {
      const [agentData, resolvedUserId] = await Promise.all([
        loadOfflineRechargeAgent().catch(() => null),
        getAppUserId().catch(() => null),
      ]);
      if (agentData) setAgent(agentData);
      if (resolvedUserId) setUserId(resolvedUserId);
    } catch (err) {
      // ignore
    } finally {
      setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    loadUserData();
    fetchPackages();
    fetchAgent();
  }, [visible, loadUserData, fetchPackages, fetchAgent]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) ?? packages[0] ?? null,
    [packages, selectedId]
  );

  const buildRechargeMessage = (pkg, currentUserId) => {
    const p = pkg || selectedPackage;
    if (!p) return "";
    const resolvedUid = currentUserId || userId || user?.id || user?.userId || "";
    const idLine = resolvedUid ? `User ID: ${resolvedUid}\n` : "";
    return (
      `Hi, I want to recharge Tuk-Tuk diamonds.\n` +
      `Package: INR ${p.inr} for ${p.diamondsDisplay} diamonds (${p.bonusDisplay} bonus)\n` +
      idLine +
      `Please share payment details.`
    );
  };

  /**
   * Dynamically calls /api/app/diamond-stock-manager/diamond-stock-manager
   * and displays the real stock managers list returned from backend.
   */
  const handleRechargePress = async () => {
    setStockManagersLoading(true);
    setStockManagersError(null);
    setStockManagersVisible(true);

    try {
      const response = await getDiamondStockManager();
      let rawList = [];

      if (Array.isArray(response)) {
        rawList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawList = response.data;
      } else if (response?.result && Array.isArray(response.result)) {
        rawList = response.result;
      } else if (response?.stockManagers && Array.isArray(response.stockManagers)) {
        rawList = response.stockManagers;
      } else if (response?.managers && Array.isArray(response.managers)) {
        rawList = response.managers;
      } else if (response?.content && Array.isArray(response.content)) {
        rawList = response.content;
      } else if (response?.items && Array.isArray(response.items)) {
        rawList = response.items;
      } else if (response && typeof response === "object") {
        if (response.name || response.mobileNo || response.countryName) {
          rawList = [response];
        } else if (response.data && typeof response.data === "object" && (response.data.name || response.data.mobileNo)) {
          rawList = [response.data];
        }
      }

      const normalized = rawList
        .filter((item) => item && (item.name || item.mobileNo || item.phone || item.email))
        .map((item, idx) => ({
          id: item.id ?? item._id ?? item.managerId ?? idx + 1,
          name: item.name ?? item.displayName ?? item.agentName ?? item.fullName ?? "Stock Manager",
          mobileNo: item.mobileNo ?? item.phone ?? item.phoneNumber ?? item.whatsapp ?? item.email ?? "",
          countryCode: item.countryCode ?? "",
          countryName: item.countryName ?? item.country ?? "",
          flagEmoji: item.flagEmoji ?? "🇮🇳",
        }));

      setStockManagers(normalized);
    } catch (err) {
      console.warn("Error fetching diamond stock manager:", err);
      setStockManagers([]);
      setStockManagersError(err?.message || "Failed to load diamond stock manager.");
    } finally {
      setStockManagersLoading(false);
    }
  };

  const handleContactManager = async (manager) => {
    const contact = String(manager?.mobileNo ?? "").trim();
    if (!contact) {
      Alert.alert("No Contact Info", "No contact details provided for this stock manager.");
      return;
    }
    const isEmail = contact.includes("@");
    const rechargeMsg = buildRechargeMessage(selectedPackage, userId);

    if (isEmail) {
      const subject = encodeURIComponent("Tuk-Tuk Diamonds Recharge Request");
      const body = encodeURIComponent(rechargeMsg);
      const url = `mailto:${contact}?subject=${subject}&body=${body}`;
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        Linking.openURL(url);
      } else {
        await Clipboard.setStringAsync(contact);
        Alert.alert("Contact Copied", `Manager's email (${contact}) copied to clipboard.`);
      }
      return;
    }

    const phone = sanitizePhone(contact);
    if (phone) {
      const msg = encodeURIComponent(rechargeMsg);
      const url = `https://wa.me/${phone.replace(/^\+/, "")}?text=${msg}`;
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        Linking.openURL(url);
        return;
      }
      Linking.openURL(`tel:${phone}`);
      return;
    }

    await Clipboard.setStringAsync(contact);
    Alert.alert("Copied!", `Contact detail copied to clipboard.`);
  };

  const copyToClipboard = async (text, label = "Contact") => {
    if (!text) return;
    await Clipboard.setStringAsync(String(text));
    Alert.alert("Copied!", `${label} copied to clipboard.`);
  };

  const handleHelpPress = () => {
    Alert.alert(
      "Recharge Help & Rules",
      "1. Diamonds are credited directly to your account after payment confirmation.\n\n" +
        "2. All payments are strictly processed in INR.\n\n" +
        "3. Newbie Bonus rewards are applied automatically on qualifying packages.\n\n" +
        "4. Contact our 24/7 diamond stock manager if you need assistance with payments.",
      [{ text: "Got it" }]
    );
  };

  // Dynamic user fields
  const avatarSource = resolveProfileAvatarSource(user);
  const username = user?.name || user?.nickname || user?.displayName || user?.username || "User";

  const resolvedXpTarget = gamificationXp?.nextLevelRequiredXp || VIP_XP_THRESHOLD || 1000;
  const resolvedXpCurrent = Math.max(
    0,
    Math.min(gamificationXp?.currentLevelXp ?? gamificationXp?.totalXp ?? 0, resolvedXpTarget)
  );
  const progress =
    resolvedXpTarget > 0
      ? Math.min(1, Math.max(0, resolvedXpCurrent / resolvedXpTarget))
      : 0;

  const currentBalance = activeTab === "golds" ? currentCoins : currentDiamonds;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        {/* TOP PURPLE GRADIENT BACKGROUND */}
        <LinearGradient
          colors={["#7c3aed", "#a855f7", "#c084fc", "#e9d5ff", "#ffffff"]}
          locations={[0, 0.2, 0.4, 0.65, 0.9]}
          style={styles.gradientBg}
        />

        <SafeAreaView edges={["top"]} style={styles.safeTop}>
          {/* HEADER NAVIGATION BAR WITH HORIZONTAL SCROLLABLE TABS */}
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.navCircleBtn}
              activeOpacity={0.8}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </TouchableOpacity>

            {/* HORIZONTAL SCROLLABLE TABS */}
            <View style={styles.tabScrollWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabContainer}
              >
                {[
                  { key: "diamonds", label: "Diamonds" },
                  { key: "golds", label: "Golds" },
                  { key: "drawCoin", label: "Draw Coin" },
                ].map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      activeOpacity={0.8}
                      style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                      onPress={() => setActiveTab(tab.key)}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          isActive ? styles.tabTextActive : styles.tabTextInactive,
                        ]}
                      >
                        {tab.label}
                      </Text>
                      {isActive && <View style={styles.tabActiveBar} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* HELP BUTTON */}
            <TouchableOpacity
              style={styles.navCircleBtn}
              activeOpacity={0.8}
              onPress={handleHelpPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.helpTextIcon}>?</Text>
            </TouchableOpacity>
          </View>

          {/* BALANCE & DETAILS ROW */}
          <View style={styles.balanceHeaderRow}>
            {/* Watermark subtle diamond outline */}
            <Text style={styles.watermarkDiamond}>💎</Text>

            <View style={styles.balancePill}>
              <Text style={styles.balancePillIcon}>
                {activeTab === "golds" ? "🪙" : "💎"}
              </Text>
              <Text style={styles.balanceValueText}>
                {Number(currentBalance).toLocaleString("en-IN")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.detailsBtn}
              activeOpacity={0.8}
              onPress={() => setDetailsVisible(true)}
            >
              <Text style={styles.detailsBtnText}>Details</Text>
              <Ionicons name="chevron-forward" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: bottomPad + 75 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* DYNAMIC USER INFO & LEVEL PROGRESS CARD */}
          <View style={styles.userCard}>
            <View style={styles.avatarWrap}>
              <ProfileAvatarWithFrame
                avatarSource={avatarSource}
                frameSource={vipProfileFrame}
                size={52}
                avatarStyle={styles.avatar}
                placeholderInitial={username[0]?.toUpperCase() ?? "U"}
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

            <View style={styles.userInfoCol}>
              <View style={styles.userHeaderRow}>
                <Text style={styles.userName} numberOfLines={1}>
                  {username}
                </Text>
                <View style={styles.userBadgesRow}>
                  <Image
                    source={resolveLocalLevelBadge(level)}
                    style={styles.levelBadge}
                    resizeMode="contain"
                  />
                  {vipLogo && (
                    <Image source={{ uri: vipLogo }} style={styles.vipBadge} resizeMode="contain" />
                  )}
                  {decorationBadgeUrl && (
                    <Image
                      source={{ uri: decorationBadgeUrl }}
                      style={styles.decorationBadge}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </View>

              <Text style={styles.xpText}>
                {resolvedXpCurrent.toLocaleString("en-IN")}/
                {resolvedXpTarget.toLocaleString("en-IN")}
              </Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.max(4, progress * 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.levelLabel}>LV{level}</Text>
              </View>
            </View>
          </View>

          {activeTab === "diamonds" && (
            <>
              {/* DIAMOND CARNIVAL BANNER */}
              {/* <View style={styles.bannerWrap}> */}
                {/* <LinearGradient
                  colors={["#581c87", "#831843", "#3b0764"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.carnivalBanner}
                >
                  <View style={styles.carnivalBannerLeft}>
                    <View style={styles.carnivalTitleBox}>
                      <Text style={styles.carnivalTitleSmall}>👑</Text>
                      <Text style={styles.carnivalTitleText}>Diamond</Text>
                      <Text style={styles.carnivalTitleSubText}>Carnival</Text>
                    </View>
                  </View>
                  <View style={styles.carnivalBannerRight}>
                    <Text style={styles.carnivalChestIcon}>💎 🎁 💎</Text>
                    <Text style={styles.carnivalSparkle}>✨ 💎 ✨</Text>
                  </View>
                </LinearGradient> */}

                {/* Banner Carousel Indicator Dots */}
                {/* <View style={styles.carouselDotsRow}>
                  <View style={[styles.dot, styles.dotActive]} />
                  <View style={styles.dot} />
                  <View style={styles.dot} />
                </View> */}
              {/* </View> */}

              {/* CONTACT US LINK */}
              <TouchableOpacity
                style={styles.contactUsRow}
                activeOpacity={0.8}
                onPress={handleRechargePress}
                disabled={stockManagersLoading}
              >
                {stockManagersLoading ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <>
                    <Text style={styles.contactUsText}>Contact us</Text>
                    <View style={styles.contactUsCircle}>
                      <Ionicons name="chevron-forward" size={13} color="#6b7280" />
                    </View>
                  </>
                )}
              </TouchableOpacity>

              {/* RECHARGE DIAMONDS SECTION HEADER */}
              <Text style={styles.sectionTitle}>Recharge Diamonds</Text>

              {/* COUPON ROW */}
              <TouchableOpacity
                style={styles.couponRow}
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert("Coupons", "No coupons are currently available for this account.")
                }
              >
                <Text style={styles.couponLabel}>Coupon</Text>
                <Text style={styles.couponValue}>No coupons available</Text>
              </TouchableOpacity>

              {/* PACKAGES 3-COLUMN GRID */}
              <View style={styles.packageGrid}>
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[
                        styles.packageCard,
                        isSelected && styles.packageCardSelected,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedId(pkg.id)}
                    >
                      {/* Top-right corner badge */}
                      {pkg.badge ? (
                        <View style={styles.ribbonWrap}>
                          <LinearGradient
                            colors={["#f97316", "#d97706"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ribbonBadge}
                          >
                            <Text style={styles.ribbonText}>{pkg.badge}</Text>
                          </LinearGradient>
                        </View>
                      ) : null}

                      {/* Gems / Diamond Pouch Image */}
                      <Image
                        source={REWARD_GEMS_IMAGE}
                        style={styles.packageGemsImg}
                        resizeMode="contain"
                      />

                      {/* Main Diamond Count */}
                      <Text style={styles.packageDiamondsText}>
                        {pkg.diamondsDisplay}
                      </Text>

                      {/* Bonus Text */}
                      <Text style={styles.packageBonusText}>
                        {pkg.bonusDisplay}
                      </Text>

                      {/* Bottom Price Strip */}
                      <View
                        style={[
                          styles.priceStrip,
                          isSelected && styles.priceStripSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.priceStripText,
                            isSelected && styles.priceStripTextSelected,
                          ]}
                        >
                          INR {pkg.inr}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {activeTab === "golds" && (
            <View style={styles.goldsContainer}>
              <View style={styles.goldsCard}>
                <Text style={styles.goldsCardTitle}>Way to Get Golds</Text>
                <Text style={styles.goldsCardItem}>1. Golds can be gained by daily sign-in.</Text>
                <Text style={styles.goldsCardItem}>2. Golds can be gained by completing tasks & milestones.</Text>

                <View style={styles.goldsLinksRow}>
                  <TouchableOpacity
                    style={styles.goldsLink}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert("Earn Golds", "Earn golds by completing daily room tasks!")}
                  >
                    <Text style={styles.goldsLinkIcon}>🪙</Text>
                    <Text style={styles.goldsLinkText}>Earn golds</Text>
                    <Ionicons name="chevron-forward" size={14} color="#7c3aed" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.goldsLink}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert("Exchange", "Gold exchange will be live in upcoming update.")}
                  >
                    <Ionicons name="swap-horizontal" size={16} color="#7c3aed" />
                    <Text style={styles.goldsLinkText}>Exchange</Text>
                    <Ionicons name="chevron-forward" size={14} color="#7c3aed" />
                  </TouchableOpacity>
                </View>

                <View style={styles.goldsDivider} />

                <Text style={styles.goldsCardTitle}>Uses of Golds</Text>
                <Text style={styles.goldsCardItem}>1. Golds can be used to send gold gifts.</Text>
                <Text style={styles.goldsCardItem}>2. Golds can be used to increase match times & room level.</Text>
              </View>
            </View>
          )}

          {activeTab === "drawCoin" && (
            <View style={styles.goldsContainer}>
              <View style={styles.goldsCard}>
                <Text style={styles.goldsCardTitle}>Draw Coin & Lucky Wheel</Text>
                <Text style={styles.goldsCardItem}>
                  Use Draw Coins to spin the lucky wheel and win exclusive avatars, luxury entry effects, and rare gifts!
                </Text>
                <TouchableOpacity
                  style={[styles.goldsLink, { marginTop: 12 }]}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert("Draw Coins", "Lucky Draw wheel event is starting soon!")}
                >
                  <Text style={styles.goldsLinkIcon}>🎡</Text>
                  <Text style={styles.goldsLinkText}>Go to Lucky Draw</Text>
                  <Ionicons name="chevron-forward" size={14} color="#7c3aed" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* STICKY BOTTOM ACTION BUTTON (APP THEME GRADIENT) */}
        <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
          <TouchableOpacity
            style={styles.rechargeBtnWrap}
            activeOpacity={0.88}
            onPress={handleRechargePress}
            disabled={stockManagersLoading}
          >
            <LinearGradient
              colors={["#7c4dff", "#c026d3", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.rechargeBtn}
            >
              {stockManagersLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.rechargeBtnText}>
                  Recharge INR {selectedPackage ? selectedPackage.inr : 143} Now
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── DYNAMIC DIAMOND STOCK MANAGERS POPUP MODAL ── */}
        <Modal
          visible={stockManagersVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setStockManagersVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setStockManagersVisible(false)}
            />

            <View style={styles.managersModalCard}>
              <LinearGradient
                colors={["#1c0a36", "#140628", "#0b0318"]}
                style={StyleSheet.absoluteFill}
              />

              {/* Modal Header */}
              <View style={styles.managersModalHeader}>
                <View style={styles.managersModalHeaderLeft}>
                  <View style={styles.managersTitleRow}>
                    <Text style={styles.managersDiamondIcon}>💎</Text>
                    <Text style={styles.managersModalTitle}>Diamond Stock Manager</Text>
                  </View>
                  <Text style={styles.managersModalSubtitle}>
                    Recharge: ₹{selectedPackage?.inr ?? 143} ({selectedPackage?.diamondsDisplay ?? "37.5K"} Diamonds)
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.managersCloseBtn}
                  activeOpacity={0.8}
                  onPress={() => setStockManagersVisible(false)}
                >
                  <Ionicons name="close" size={20} color="rgba(255,255,255,0.75)" />
                </TouchableOpacity>
              </View>

              {/* Modal Content */}
              {stockManagersLoading ? (
                <View style={styles.managersLoadingBox}>
                  <ActivityIndicator size="large" color="#c084fc" />
                  <Text style={styles.managersLoadingText}>Loading stock managers...</Text>
                </View>
              ) : stockManagersError ? (
                <View style={styles.managersErrorBox}>
                  <Ionicons name="alert-circle-outline" size={32} color="#f87171" />
                  <Text style={styles.managersErrorText}>{stockManagersError}</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    activeOpacity={0.8}
                    onPress={handleRechargePress}
                  >
                    <Text style={styles.retryBtnText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : stockManagers.length === 0 ? (
                <View style={styles.managersEmptyBox}>
                  <Ionicons name="information-circle-outline" size={36} color="#c084fc" />
                  <Text style={styles.managersEmptyText}>No stock managers currently available.</Text>
                  <TouchableOpacity
                    style={styles.retryBtn}
                    activeOpacity={0.8}
                    onPress={handleRechargePress}
                  >
                    <Text style={styles.retryBtnText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView
                  style={styles.managersListScroll}
                  contentContainerStyle={styles.managersListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {stockManagers.map((manager, index) => (
                    <View key={manager.id || index} style={styles.managerCard}>
                      {/* Top Info */}
                      <View style={styles.managerTopRow}>
                        <View style={styles.managerAvatar}>
                          <LinearGradient
                            colors={["#7c4dff", "#c026d3"]}
                            style={styles.managerAvatarGradient}
                          >
                            <Text style={styles.managerAvatarText}>
                              {manager.name ? String(manager.name)[0].toUpperCase() : "M"}
                            </Text>
                          </LinearGradient>
                        </View>

                        <View style={styles.managerInfoCol}>
                          <View style={styles.managerNameRow}>
                            <Text style={styles.managerNameText}>{manager.name}</Text>
                            <View style={styles.officialBadge}>
                              <Text style={styles.officialBadgeText}>Official</Text>
                            </View>
                          </View>

                          {/* Country & Flag */}
                          {(manager.countryName || manager.countryCode || manager.flagEmoji) ? (
                            <View style={styles.managerCountryRow}>
                              {manager.flagEmoji ? (
                                <Text style={styles.managerFlagText}>{manager.flagEmoji}</Text>
                              ) : null}
                              <Text style={styles.managerCountryText}>
                                {[manager.countryName, manager.countryCode].filter(Boolean).join(" • ")}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* Mobile / Contact Row */}
                      {manager.mobileNo ? (
                        <View style={styles.managerContactRow}>
                          <View style={styles.managerContactLeft}>
                            <Ionicons
                              name={manager.mobileNo.includes("@") ? "mail-outline" : "call-outline"}
                              size={16}
                              color="#c084fc"
                            />
                            <Text style={styles.managerContactText} numberOfLines={1}>
                              {manager.mobileNo}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.copyBtn}
                            activeOpacity={0.8}
                            onPress={() => copyToClipboard(manager.mobileNo, "Contact info")}
                          >
                            <Ionicons name="copy-outline" size={14} color="#e9d5ff" />
                            <Text style={styles.copyBtnText}>Copy</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {/* Action Button */}
                      <TouchableOpacity
                        style={styles.managerActionBtn}
                        activeOpacity={0.85}
                        onPress={() => handleContactManager(manager)}
                      >
                        <LinearGradient
                          colors={["#7c4dff", "#c026d3"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.managerActionBtnGradient}
                        >
                          <Ionicons
                            name={manager.mobileNo?.includes("@") ? "mail" : "logo-whatsapp"}
                            size={18}
                            color="#ffffff"
                          />
                          <Text style={styles.managerActionBtnText}>
                            {manager.mobileNo?.includes("@") ? "Email Manager" : "Contact on WhatsApp"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Copy Payment Request Button */}
                  <TouchableOpacity
                    style={styles.copyDetailsBtn}
                    activeOpacity={0.8}
                    onPress={() =>
                      copyToClipboard(
                        buildRechargeMessage(selectedPackage, userId),
                        "Recharge request message"
                      )
                    }
                  >
                    <Ionicons name="document-text-outline" size={15} color="#c084fc" />
                    <Text style={styles.copyDetailsBtnText}>Copy Recharge Request Message</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* WALLET DETAILS MODAL */}
        <WalletDetailsModal
          visible={detailsVisible}
          onClose={() => setDetailsVisible(false)}
          currency={activeTab === "golds" ? "golds" : "diamonds"}
          totalDiamonds={currentDiamonds}
          totalCoins={currentCoins}
        />
      </View>
    </Modal>
  );
}

const CARD_WIDTH = (SCREEN_WIDTH - 32 - 16) / 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 380,
  },
  safeTop: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    paddingBottom: 12,
  },
  navCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpTextIcon: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  tabScrollWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  tabScroll: {
    flexGrow: 0,
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    gap: 16,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    position: "relative",
  },
  tabBtnActive: {},
  tabText: {
    fontSize: 17,
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "800",
  },
  tabTextInactive: {
    color: "rgba(255, 255, 255, 0.72)",
    fontWeight: "600",
  },
  tabActiveBar: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: "70%",
    backgroundColor: "#ffffff",
    borderRadius: 2,
  },
  balanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 8,
    position: "relative",
  },
  watermarkDiamond: {
    position: "absolute",
    right: 24,
    top: -30,
    fontSize: 90,
    opacity: 0.18,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
  },
  balancePillIcon: {
    fontSize: 22,
  },
  balanceValueText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  detailsBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1f25",
    borderRadius: 24,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    width: 52,
    height: 52,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#374151",
  },
  userInfoCol: {
    flex: 1,
    gap: 4,
  },
  userHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  userBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelBadge: {
    height: BADGE_HEIGHT,
    width: BADGE_HEIGHT * LEVEL_BADGE_ASPECT,
  },
  vipBadge: {
    height: BADGE_HEIGHT,
    width: BADGE_HEIGHT,
  },
  decorationBadge: {
    height: BADGE_HEIGHT,
    width: BADGE_HEIGHT * DECORATION_BADGE_ASPECT,
  },
  xpText: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 11,
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
    backgroundColor: "#3a3c46",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#a855f7",
  },
  levelLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
    fontStyle: "italic",
  },
  bannerWrap: {
    marginTop: 14,
  },
  carnivalBanner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  carnivalBannerLeft: {
    flex: 1,
  },
  carnivalTitleBox: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  carnivalTitleSmall: {
    fontSize: 16,
  },
  carnivalTitleText: {
    color: "#fde047",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  carnivalTitleSubText: {
    color: "#fef08a",
    fontSize: 16,
    fontWeight: "800",
  },
  carnivalBannerRight: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  carnivalChestIcon: {
    fontSize: 16,
  },
  carnivalSparkle: {
    fontSize: 12,
  },
  carouselDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#d1d5db",
  },
  dotActive: {
    width: 14,
    backgroundColor: "#ffffff",
    borderColor: "#9ca3af",
    borderWidth: 1,
  },
  contactUsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  contactUsText: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },
  contactUsCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginTop: 10,
    marginBottom: 10,
  },
  couponRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    marginBottom: 14,
  },
  couponLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  couponValue: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "500",
  },
  packageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  packageCard: {
    width: CARD_WIDTH,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    paddingTop: 12,
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    marginBottom: 8,
  },
  packageCardSelected: {
    backgroundColor: "#fffdf5",
    borderColor: "#f59e0b",
    borderWidth: 1.8,
    shadowColor: "#f59e0b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  ribbonWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    zIndex: 10,
  },
  ribbonBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
  },
  ribbonText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "800",
  },
  packageGemsImg: {
    width: 44,
    height: 38,
    marginTop: 2,
    marginBottom: 4,
  },
  packageDiamondsText: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "800",
  },
  packageBonusText: {
    color: "#ea580c",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 8,
  },
  priceStrip: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  priceStripSelected: {
    backgroundColor: "#fde68a",
  },
  priceStripText: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "700",
  },
  priceStripTextSelected: {
    color: "#92400e",
    fontWeight: "800",
  },
  goldsContainer: {
    marginTop: 10,
  },
  goldsCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  goldsCardTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  goldsCardItem: {
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  goldsLinksRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 12,
  },
  goldsLink: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  goldsLinkIcon: {
    fontSize: 14,
  },
  goldsLinkText: {
    color: "#7c3aed",
    fontSize: 13,
    fontWeight: "700",
  },
  goldsDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 12,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  rechargeBtnWrap: {
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeBtn: {
    height: 50,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  rechargeBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  /* ── STOCK MANAGERS POPUP MODAL STYLES ── */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
  },
  managersModalCard: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(168, 85, 247, 0.35)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  managersModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  managersModalHeaderLeft: {
    flex: 1,
  },
  managersTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  managersDiamondIcon: {
    fontSize: 18,
  },
  managersModalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  managersModalSubtitle: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  managersCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  managersLoadingBox: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  managersLoadingText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "600",
  },
  managersErrorBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  managersErrorText: {
    color: "#fca5a5",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  managersEmptyBox: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  managersEmptyText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  retryBtn: {
    backgroundColor: "rgba(124, 77, 255, 0.35)",
    borderColor: "#7c4dff",
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  managersListScroll: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  managersListContent: {
    padding: 16,
    gap: 12,
  },
  managerCard: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 14,
    gap: 10,
  },
  managerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  managerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
  },
  managerAvatarGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  managerAvatarText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  managerInfoCol: {
    flex: 1,
    gap: 2,
  },
  managerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  managerNameText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  officialBadge: {
    backgroundColor: "rgba(124, 77, 255, 0.25)",
    borderColor: "#7c4dff",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  officialBadgeText: {
    color: "#d8b4fe",
    fontSize: 10,
    fontWeight: "700",
  },
  managerCountryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  managerFlagText: {
    fontSize: 14,
  },
  managerCountryText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 12,
    fontWeight: "600",
  },
  managerContactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  managerContactLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  managerContactText: {
    color: "#e9d5ff",
    fontSize: 13,
    fontWeight: "700",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(124, 77, 255, 0.22)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    color: "#d8b4fe",
    fontSize: 11,
    fontWeight: "700",
  },
  managerActionBtn: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
  },
  managerActionBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    gap: 8,
  },
  managerActionBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  copyDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  copyDetailsBtnText: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
