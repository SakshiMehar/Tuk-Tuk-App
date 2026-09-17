import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { s, vs, ms } from "react-native-size-matters";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import backpackBg from "../assets/images/backpackBg.png";

const CATEGORIES = ["All", "Frames", "Effects", "Badges", "Backgrounds"];

// Fallback initial items matching the design mockup exactly
const FALLBACK_ITEMS = [
  {
    id: "avatarFrame",
    type: "avatarFrame",
    label: "Avatar Frame",
    category: "Frames",
    qty: 1,
    unlocked: true,
  },
  {
    id: "entryEffect",
    type: "entryEffect",
    label: "Entry Effect",
    category: "Effects",
    qty: 0,
    unlocked: false,
  },
  {
    id: "bubbleTheme",
    type: "bubbleTheme",
    label: "Chat Bubble",
    category: "Effects",
    qty: 0,
    unlocked: false,
  },
  {
    id: "roomBadge",
    type: "roomBadge",
    label: "Room Badge",
    category: "Badges",
    qty: 2,
    unlocked: true,
  },
  {
    id: "vipEffect",
    type: "vipEffect",
    label: "VIP Effect",
    category: "Effects",
    qty: 0,
    unlocked: false,
  },
  {
    id: "profileBg",
    type: "profileBg",
    label: "Profile BG",
    category: "Backgrounds",
    qty: 1,
    unlocked: true,
  },
];

const firstDefined = (...values) => values.find((v) => v !== undefined && v !== null);

const normalizeInventoryItem = (item, index) => {
  const qty = Number(firstDefined(item?.quantity, item?.qty, item?.count, item?.unlocked ? 1 : 0));
  return {
    id: String(firstDefined(item?.id, item?.itemId, `inv-${index}`)),
    type: item?.type ?? item?.category ?? "custom",
    label: firstDefined(item?.name, item?.label, item?.title) ?? "Item",
    category: firstDefined(item?.category, item?.type) ?? "Effects",
    qty,
    unlocked: qty > 0,
    imageUrl: firstDefined(item?.imageUrl, item?.iconUrl, item?.assetUrl) ?? null,
    equipped: Boolean(item?.equipped),
  };
};

// ── Custom Illustrated Icons matching design mockup exactly ─────────────────

function ItemIllustration({ type, imageUrl, size = s(58) }) {
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={{ width: size, height: size }} contentFit="contain" />;
  }

  switch (type) {
    case "avatarFrame":
      return (
        <View style={[styles.avatarFrameArtWrap, { width: size, height: size }]}>
          {/* Outer golden decorative scalloped ring with pink petals */}
          <LinearGradient
            colors={["#FCD34D", "#F59E0B", "#F472B6"]}
            style={styles.avatarFrameGoldRing}
          >
            {/* Inner royal purple circle with user avatar icon */}
            <LinearGradient colors={["#818CF8", "#6366F1", "#4F46E5"]} style={styles.avatarFrameInnerCircle}>
              <Ionicons name="person" size={ms(20)} color="#FFFFFF" />
            </LinearGradient>
          </LinearGradient>
          {/* Top Crown decoration */}
          <View style={styles.avatarFrameCrown}>
            <MaterialCommunityIcons name="crown" size={ms(16)} color="#F59E0B" />
          </View>
          {/* Bottom pink heart decoration */}
          <View style={styles.avatarFrameHeart}>
            <Ionicons name="heart" size={ms(9)} color="#EC4899" />
          </View>
        </View>
      );

    case "entryEffect":
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          {/* Soft background halo glow */}
          <View style={styles.starHaloGlow} />
          {/* Orbital swirl ring */}
          <View style={styles.starOrbitalRing} />
          {/* 3D Purple Star in center */}
          <LinearGradient colors={["#A855F7", "#7C3AED", "#6D28D9"]} style={styles.starCircle}>
            <Ionicons name="star" size={ms(22)} color="#FFFFFF" />
          </LinearGradient>
          {/* Floating tiny sparkle stars */}
          <Ionicons name="sparkles" size={ms(11)} color="#C084FC" style={styles.sparkleTopRight} />
          <Ionicons name="sparkles" size={ms(9)} color="#E9D5FF" style={styles.sparkleBottomLeft} />
        </View>
      );

    case "bubbleTheme":
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          {/* Purple glossy speech bubble */}
          <LinearGradient colors={["#A855F7", "#8B5CF6", "#7C3AED"]} style={styles.chatBubbleShape}>
            <View style={styles.chatBubbleTail} />
            <View style={styles.chatBubbleHeartCircle}>
              <Ionicons name="heart" size={ms(11)} color="#EC4899" />
            </View>
          </LinearGradient>
        </View>
      );

    case "roomBadge":
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          {/* Gold scalloped badge */}
          <LinearGradient colors={["#FDE68A", "#F59E0B", "#D97706"]} style={styles.badgeGoldRing}>
            {/* Purple inner core with golden crown */}
            <LinearGradient colors={["#7C3AED", "#6D28D9"]} style={styles.badgeInnerCore}>
              <MaterialCommunityIcons name="crown" size={ms(17)} color="#FDE68A" />
            </LinearGradient>
          </LinearGradient>
        </View>
      );

    case "vipEffect":
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          {/* Soft purple/pink aura */}
          <View style={styles.vipGlowAura} />
          {/* 3D Glowing flame */}
          <LinearGradient colors={["#FEF08A", "#F97316", "#EF4444"]} style={styles.vipFlameWrap}>
            <Ionicons name="flame" size={ms(26)} color="#FFFFFF" />
          </LinearGradient>
        </View>
      );

    case "profileBg":
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          {/* Purple rounded landscape card */}
          <LinearGradient colors={["#8B5CF6", "#6D28D9"]} style={styles.profileBgCard}>
            {/* Sun circle */}
            <View style={styles.profileBgSun} />
            {/* Mountain shape */}
            <Ionicons name="image" size={ms(22)} color="rgba(255,255,255,0.95)" />
          </LinearGradient>
        </View>
      );

    default:
      return (
        <View style={[styles.illustrationCenterWrap, { width: size, height: size }]}>
          <LinearGradient colors={["#A855F7", "#7C3AED"]} style={styles.defaultIconCircle}>
            <Ionicons name="cube" size={ms(24)} color="#FFFFFF" />
          </LinearGradient>
        </View>
      );
  }
}

// ── Equipped Slot Component ──────────────────────────────────────────────────

function EquippedSlotCard({ label, slotType, item, onPress }) {
  const isEquipped = Boolean(item);

  return (
    <TouchableOpacity
      style={styles.equippedCard}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.equippedIconContainer}>
        {slotType === "Frame" ? (
          <View style={styles.slotPlaceholderFrame}>
            <Ionicons name="help" size={ms(18)} color="#9B8EB9" />
          </View>
        ) : (
          <View style={styles.slotPlaceholderBadge}>
            <Ionicons name="shield-outline" size={ms(26)} color="#C4B5FD" style={styles.badgeShieldBg} />
            <Ionicons name="help" size={ms(14)} color="#9B8EB9" style={styles.badgeHelpInside} />
          </View>
        )}
      </View>

      <View style={styles.equippedTextCol}>
        <Text style={styles.equippedMainTitle} numberOfLines={1}>
          {isEquipped ? item.label : `No ${label} equipped`}
        </Text>
        <Text style={styles.equippedSubTitle}>{label}</Text>
      </View>

      {/* Right pill chevron */}
      <View style={styles.equippedChevronPill}>
        <Ionicons name="chevron-forward" size={ms(12)} color="#7C3AED" />
      </View>
    </TouchableOpacity>
  );
}

// ── Main Backpack Panel Component ───────────────────────────────────────────

export default function BackpackPanel({ onClose, onGoToStore }) {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState(FALLBACK_ITEMS);
  const [equippedBadge, setEquippedBadge] = useState(null);
  const [equippedFrame, setEquippedFrame] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await syncUserLevelForSession();
        if (cancelled) return;
        const xp = result?.xp;
        if (Array.isArray(xp?.inventory) && xp.inventory.length > 0) {
          setItems(xp.inventory.map(normalizeInventoryItem));
        }
        setEquippedBadge(xp?.equippedBadge ? normalizeInventoryItem(xp.equippedBadge, "badge") : null);
        setEquippedFrame(xp?.equippedFrame ? normalizeInventoryItem(xp.equippedFrame, "frame") : null);
      } catch {
        // use fallback items
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleEquipItem = (item) => {
    if (item.category === "Frames") {
      setEquippedFrame((prev) => (prev?.id === item.id ? null : item));
    } else if (item.category === "Badges") {
      setEquippedBadge((prev) => (prev?.id === item.id ? null : item));
    } else {
      Alert.alert(
        "Item Equipped",
        `You have equipped ${item.label}!`,
        [{ text: "Great" }]
      );
    }
  };

  const handleStorePress = () => {
    if (onGoToStore) {
      onGoToStore();
    } else {
      Alert.alert("Store", "Opening Tuk-Tuk Item Store...");
    }
  };

  const visibleItems =
    activeCategory === "All"
      ? items
      : items.filter((it) => it.category === activeCategory);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF5FE" />

      {/* Screen Background Image */}
      <Image
        source={backpackBg}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* ── Top Header ── */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top + vs(6), vs(16)) }]}>
        <TouchableOpacity
          style={styles.headerRoundBtn}
          activeOpacity={0.75}
          onPress={onClose}
        >
          <Ionicons name="chevron-back" size={ms(16)} color="#2E1E5B" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerBackpackIconWrap}>
            <LinearGradient
              colors={["#A855F7", "#7C3AED"]}
              style={styles.headerBackpackGrad}
            >
              <Ionicons name="briefcase" size={ms(17)} color="#FFFFFF" />
            </LinearGradient>
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Backpack</Text>
            <Text style={styles.headerSubtitle}>Your collection of amazing items</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerRoundBtn}
          activeOpacity={0.75}
          onPress={onClose}
        >
          <Ionicons name="close" size={ms(16)} color="#2E1E5B" />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable Body ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + vs(30) }]}
      >
        {/* Top 2 Equipped Slots */}
        <View style={styles.equippedRow}>
          <EquippedSlotCard
            label="Frame"
            slotType="Frame"
            item={equippedFrame}
            onPress={() => setActiveCategory("Frames")}
          />
          <EquippedSlotCard
            label="Badge"
            slotType="Badge"
            item={equippedBadge}
            onPress={() => setActiveCategory("Badges")}
          />
        </View>

        {/* ── Main "My Backpack" Container Card ── */}
        <View style={styles.mainBackpackCard}>
          {/* Section Ribbon / Title */}
          <View style={styles.ribbonRow}>
            <Text style={styles.ribbonSparkleLeft}>✦</Text>
            <LinearGradient
              colors={["#A855F7", "#7C3AED"]}
              style={styles.ribbonBagIconWrap}
            >
              <Ionicons name="briefcase" size={ms(15)} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.ribbonTitle}>My Backpack</Text>
            <Text style={styles.ribbonSparkleRight}>✦</Text>
          </View>

          {/* Category Pills (Horizontal Scroll) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryRow}
          >
            {CATEGORIES.map((cat) => {
              const active = cat === activeCategory;
              return (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory(cat)}
                  style={styles.categoryPillWrap}
                >
                  {active ? (
                    <LinearGradient
                      colors={["#9333EA", "#7C3AED", "#6366F1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.categoryPillActive}
                    >
                      <Text style={styles.categoryPillTextActive}>{cat}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.categoryPillInactive}>
                      <Text style={styles.categoryPillTextInactive}>{cat}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 3-Column Item Grid */}
          {visibleItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={ms(38)} color="#C4B5FD" />
              <Text style={styles.emptyTitle}>Nothing in this category yet</Text>
              <Text style={styles.emptySub}>Check the store to unlock exclusive items!</Text>
            </View>
          ) : (
            <View style={styles.itemGrid}>
              {visibleItems.map((it) => {
                const isEquipped =
                  (equippedFrame && it.id === equippedFrame.id) ||
                  (equippedBadge && it.id === equippedBadge.id);

                return (
                  <View
                    key={it.id}
                    style={styles.itemCard}
                  >
                    {/* Top Right Badge: Quantity or Lock Icon */}
                    {it.unlocked ? (
                      <View style={styles.qtyBadge}>
                        <Text style={styles.qtyBadgeText}>{it.qty}</Text>
                      </View>
                    ) : (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={ms(11)} color="#8B5CF6" />
                      </View>
                    )}

                    {/* Illustration Icon */}
                    <View style={styles.illustrationWrap}>
                      <ItemIllustration type={it.type} imageUrl={it.imageUrl} size={s(56)} />
                    </View>

                    {/* Item Label */}
                    <Text style={styles.itemLabel} numberOfLines={1}>
                      {it.label}
                    </Text>

                    {/* Equip Button or None State */}
                    {it.unlocked ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleEquipItem(it)}
                        style={styles.equipBtnTouchable}
                      >
                        <LinearGradient
                          colors={isEquipped ? ["#7C3AED", "#6D28D9"] : ["#A855F7", "#7C3AED", "#6366F1"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.equipBtnGradient}
                        >
                          <Text style={styles.equipBtnText}>
                            {isEquipped ? "Equipped" : `Equip ×${it.qty}`}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.nonePill}>
                        <Text style={styles.nonePillText}>None</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Go to Store Button ── */}
        <View style={styles.storeSection}>
          <TouchableOpacity
            style={styles.storeButton}
            activeOpacity={0.85}
            onPress={handleStorePress}
          >
            <MaterialCommunityIcons name="storefront-outline" size={ms(18)} color="#7C3AED" />
            <Text style={styles.storeButtonText}>Go to Store</Text>
            <Ionicons name="chevron-forward" size={ms(15)} color="#7C3AED" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles with react-native-size-matters ────────────────────────────────────

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FAF4FE",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingBottom: vs(12),
  },
  headerRoundBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.08,
    shadowRadius: ms(6),
    elevation: 3,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(8),
  },
  headerBackpackIconWrap: {
    width: s(36),
    height: s(36),
    borderRadius: ms(12),
    overflow: "hidden",
  },
  headerBackpackGrad: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: ms(18),
    fontWeight: "800",
    color: "#201445",
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: ms(11),
    color: "#8676A3",
    marginTop: vs(1),
    fontWeight: "500",
  },
  scrollContent: {
    paddingHorizontal: s(14),
    paddingTop: vs(4),
  },
  equippedRow: {
    flexDirection: "row",
    gap: s(10),
    marginBottom: vs(14),
  },
  equippedCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: "#EDE6F8",
    paddingVertical: vs(10),
    paddingHorizontal: s(10),
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.05,
    shadowRadius: ms(8),
    elevation: 2,
    gap: s(8),
  },
  equippedIconContainer: {
    width: s(46),
    height: s(46),
    borderRadius: ms(23),
    backgroundColor: "#F6F1FD",
    alignItems: "center",
    justifyContent: "center",
  },
  slotPlaceholderFrame: {
    width: s(28),
    height: s(28),
    borderRadius: ms(8),
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#C4B5FD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
  },
  slotPlaceholderBadge: {
    width: s(32),
    height: s(32),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeShieldBg: {
    position: "absolute",
  },
  badgeHelpInside: {
    position: "absolute",
  },
  equippedTextCol: {
    flex: 1,
  },
  equippedMainTitle: {
    fontSize: ms(11.5),
    fontWeight: "700",
    color: "#201445",
  },
  equippedSubTitle: {
    fontSize: ms(10.5),
    color: "#9B8EB9",
    marginTop: vs(1.5),
    fontWeight: "500",
  },
  equippedChevronPill: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: "#F3ECFE",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Main Backpack Card (matching design reference) ──
  mainBackpackCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: ms(28),
    paddingVertical: vs(18),
    paddingHorizontal: s(10),
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(6) },
    shadowOpacity: 0.08,
    shadowRadius: ms(28),
    elevation: 6,
    borderWidth: 1,
    borderColor: "#EDE6F8",
  },
  ribbonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(7),
    marginBottom: vs(16),
  },
  ribbonSparkleLeft: {
    fontSize: ms(16),
    color: "#FBBF24",
    fontWeight: "700",
  },
  ribbonSparkleRight: {
    fontSize: ms(16),
    color: "#E879F9",
    fontWeight: "700",
  },
  ribbonBagIconWrap: {
    width: s(28),
    height: s(28),
    borderRadius: ms(9),
    alignItems: "center",
    justifyContent: "center",
  },
  ribbonTitle: {
    fontSize: ms(17),
    fontWeight: "800",
    color: "#201445",
    letterSpacing: -0.2,
  },

  // Category Pills (Horizontal Scroll)
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: s(6),
    paddingBottom: vs(16),
  },
  categoryPillWrap: {
    marginRight: s(2),
  },
  categoryPillActive: {
    paddingHorizontal: s(16),
    paddingVertical: vs(7),
    borderRadius: ms(20),
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.25,
    shadowRadius: ms(4),
    elevation: 2,
  },
  categoryPillInactive: {
    paddingHorizontal: s(16),
    paddingVertical: vs(7),
    borderRadius: ms(20),
    backgroundColor: "#F8F7FD",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EDE6F8",
  },
  categoryPillTextActive: {
    fontSize: ms(12),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  categoryPillTextInactive: {
    fontSize: ms(12),
    fontWeight: "700",
    color: "#7E6E9C",
  },

  // Item Grid
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  itemCard: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: ms(20),
    borderWidth: 1.2,
    borderColor: "#F2EDFB",
    paddingVertical: vs(12),
    paddingHorizontal: s(6),
    alignItems: "center",
    marginBottom: vs(12),
    position: "relative",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.04,
    shadowRadius: ms(6),
    elevation: 1,
  },
  qtyBadge: {
    position: "absolute",
    top: vs(6),
    right: s(6),
    backgroundColor: "#F1EBFC",
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  qtyBadgeText: {
    fontSize: ms(10),
    fontWeight: "800",
    color: "#7C3AED",
  },
  lockBadge: {
    position: "absolute",
    top: vs(6),
    right: s(6),
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: "#F1EBFC",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  illustrationWrap: {
    height: vs(62),
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(6),
  },
  illustrationCenterWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  itemLabel: {
    fontSize: ms(11.5),
    fontWeight: "800",
    color: "#201445",
    textAlign: "center",
    marginTop: vs(6),
    marginBottom: vs(8),
  },
  equipBtnTouchable: {
    width: "100%",
    alignItems: "center",
  },
  equipBtnGradient: {
    borderRadius: ms(14),
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    minWidth: s(66),
    alignItems: "center",
    justifyContent: "center",
  },
  equipBtnText: {
    color: "#FFFFFF",
    fontSize: ms(10),
    fontWeight: "800",
  },
  nonePill: {
    backgroundColor: "#F5F3FB",
    borderRadius: ms(14),
    paddingVertical: vs(5),
    paddingHorizontal: s(12),
    minWidth: s(54),
    alignItems: "center",
  },
  nonePillText: {
    color: "#9E96B8",
    fontSize: ms(10),
    fontWeight: "700",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: vs(32),
    gap: vs(6),
  },
  emptyTitle: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#201445",
  },
  emptySub: {
    fontSize: ms(11),
    color: "#8676A3",
  },

  // ── Go to Store Button (centered pill) ──
  storeSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: vs(16),
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    backgroundColor: "#FFFFFF",
    borderRadius: ms(26),
    borderWidth: 1.5,
    borderColor: "#F0EBF8",
    paddingVertical: vs(12),
    paddingHorizontal: s(36),
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.08,
    shadowRadius: ms(8),
    elevation: 3,
  },
  storeButtonText: {
    fontSize: ms(14.5),
    fontWeight: "800",
    color: "#201445",
  },

  // ── Illustration Specific Sub-styles ──
  avatarFrameArtWrap: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarFrameGoldRing: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    padding: s(3),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrameInnerCircle: {
    width: "100%",
    height: "100%",
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFrameCrown: {
    position: "absolute",
    top: -vs(5),
  },
  avatarFrameHeart: {
    position: "absolute",
    bottom: -vs(2),
  },
  starHaloGlow: {
    position: "absolute",
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: "#F3E8FF",
  },
  starOrbitalRing: {
    position: "absolute",
    width: s(52),
    height: s(24),
    borderRadius: ms(12),
    borderWidth: 1.5,
    borderColor: "#DDD6FE",
    transform: [{ rotate: "-20deg" }],
  },
  starCircle: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    alignItems: "center",
    justifyContent: "center",
  },
  sparkleTopRight: {
    position: "absolute",
    top: 0,
    right: s(2),
  },
  sparkleBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: s(2),
  },
  chatBubbleShape: {
    width: s(42),
    height: s(40),
    borderRadius: ms(18),
    borderBottomLeftRadius: ms(4),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  chatBubbleTail: {
    position: "absolute",
    bottom: -vs(3),
    left: s(3),
    width: s(10),
    height: s(10),
    backgroundColor: "#7C3AED",
    borderBottomLeftRadius: ms(4),
    transform: [{ rotate: "45deg" }],
  },
  chatBubbleHeartCircle: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGoldRing: {
    width: s(46),
    height: s(46),
    borderRadius: s(23),
    padding: s(3.5),
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInnerCore: {
    width: "100%",
    height: "100%",
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  vipGlowAura: {
    position: "absolute",
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: "#FEE2E2",
  },
  vipFlameWrap: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
  profileBgCard: {
    width: s(44),
    height: s(38),
    borderRadius: ms(12),
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  profileBgSun: {
    position: "absolute",
    top: vs(4),
    right: s(6),
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: "#FDE047",
  },
  defaultIconCircle: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    alignItems: "center",
    justifyContent: "center",
  },
});
