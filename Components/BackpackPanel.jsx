import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ms, s, vs } from "react-native-size-matters";
import Svg, {
  Defs,
  Ellipse,
  Path,
  Rect,
  Stop,
  LinearGradient as SvgGradient,
} from "react-native-svg";
import { getAvatarInventory } from "../src/api/avatarApi";
import { getIntimacyBackpackInventory, INTIMACY_INVENTORY_TYPES } from "../src/api/giftApi";

const { width } = Dimensions.get("window");
const ITEM_CARD_WIDTH = Math.floor((width - 32 - 20) / 3);

// ── Categories ──────────────────────────────────────────────────────────────
const BACKPACK_CATEGORIES = [
  { id: "intimacy", label: "Intimacy" },
  { id: "avatar", label: "Avatar" },
  { id: "profile", label: "Profile" },
  { id: "entrance", label: "Entrance" },
  { id: "chatFrame", label: "Chat Frame" },
  { id: "miniCard", label: "Mini Card" },
];

// ── SubTabs for each category ───────────────────────────────────────────────
const BACKPACK_SUBTABS = {
  avatar: [
    { id: "avatar_frame", label: "Avatar Frame" },
    { id: "cp_avatar_frame", label: "CP Avatar Frame" },
    { id: "dynamic_avatar", label: "Dynamic Avatar" },
  ],
  intimacy: [
    { id: INTIMACY_INVENTORY_TYPES.RING, label: "Ring" },
    { id: INTIMACY_INVENTORY_TYPES.JEWELRY, label: "Jewelry" },
    { id: INTIMACY_INVENTORY_TYPES.LOVE_ZONE, label: "Love Zone" },
    { id: INTIMACY_INVENTORY_TYPES.MIC_LINK, label: "Mic Link" },
    { id: INTIMACY_INVENTORY_TYPES.SPECIAL_CARD, label: "Special Card" },
    { id: INTIMACY_INVENTORY_TYPES.CP_CARD, label: "CP Card" },
    { id: INTIMACY_INVENTORY_TYPES.INTIMACY_CARD, label: "Intimacy Card" },
  ],
  profile: [
    { id: "profile_show", label: "Profile Show" },
    { id: "profile_animation", label: "Profile Animation" },
    { id: "personal_profile_card", label: "Personal Profile Card" },
  ],
  entrance: [
    { id: "user_car", label: "User Car" },
    { id: "pair_car", label: "Pair Car" },
    { id: "enter_message", label: "Enter Message" },
    { id: "pair_enter_message", label: "Pair Enter Message" },
  ],
  chatFrame: [
    { id: "chat_bubble", label: "Chat Frame" },
    { id: "room_bubble", label: "Room Bubble" },
  ],
  miniCard: [
    { id: "mini_card", label: "Mini Card" },
  ],
};

const FILTER_PILLS = [
  { id: "all", label: "All" },
  { id: "normal", label: "Normal Outfit" },
  { id: "privilege", label: "Privilege Outfit" },
];

// ── Sad Box Illustration (Pixel-perfect to reference Image 2) ───────────────
function SadBoxIllustration({ size = 150 }) {
  return (
    <View style={styles.illustrationCenter}>
      <Svg width={size * 1.4} height={size} viewBox="0 0 200 150" fill="none">
        <Defs>
          <SvgGradient id="boxGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#A78BFA" />
            <Stop offset="100%" stopColor="#818CF8" />
          </SvgGradient>
          <SvgGradient id="boxTopGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor="#C4B5FD" />
            <Stop offset="100%" stopColor="#DDD6FE" />
          </SvgGradient>
          <SvgGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.8" />
            <Stop offset="100%" stopColor="#F5F3FF" stopOpacity="0.2" />
          </SvgGradient>
        </Defs>

        {/* Soft Lavender Hill Ground */}
        <Ellipse cx="100" cy="132" rx="85" ry="22" fill="url(#groundGrad)" />

        {/* Floating Delicate Leaves / Petals */}
        <Path
          d="M 42 112 C 38 102, 52 98, 56 108 C 54 116, 44 117, 42 112 Z"
          fill="#DDD6FE"
          opacity={0.85}
        />
        <Path
          d="M 158 98 C 153 88, 168 83, 172 94 C 170 103, 161 105, 158 98 Z"
          fill="#DDD6FE"
          opacity={0.8}
        />
        <Path
          d="M 166 112 C 162 106, 174 102, 177 109 C 175 116, 169 117, 166 112 Z"
          fill="#C4B5FD"
          opacity={0.65}
        />

        {/* 3D Box Front Face */}
        <Rect
          x="65"
          y="50"
          width="70"
          height="62"
          rx="12"
          fill="url(#boxGrad)"
        />

        {/* 3D Box Top Isometric Plane */}
        <Path
          d="M 65 59 Q 65 50, 77 50 L 123 50 Q 135 50, 135 59 L 128 44 Q 123 38, 112 38 L 88 38 Q 77 38, 72 44 Z"
          fill="url(#boxTopGrad)"
          opacity={0.92}
        />

        {/* Eyes: Two vertical rounded white pills */}
        <Rect x="84" y="72" width="6" height="13" rx="3" fill="#FFFFFF" />
        <Rect x="110" y="72" width="6" height="13" rx="3" fill="#FFFFFF" />

        {/* Mouth: Downward sad frown curve */}
        <Path
          d="M 88 99 C 88 91, 112 91, 112 99"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </View>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function BackpackPanel({ onClose, onGoToStore }) {
  const insets = useSafeAreaInsets();

  // Active Category (default "intimacy")
  const [selectedCategory, setSelectedCategory] = useState("intimacy");
  // Active SubTab
  const [selectedSubTab, setSelectedSubTab] = useState(
    BACKPACK_SUBTABS.intimacy[0].id
  );
  // Active Filter Pill
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Items State & Loading
  const [inventoryItems, setInventoryItems] = useState({});
  const [loading, setLoading] = useState(false);

  // Switch category
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    const subList = BACKPACK_SUBTABS[catId] || [];
    if (subList.length > 0) {
      setSelectedSubTab(subList[0].id);
    }
    setSelectedFilter("all");
  };

  // Switch subtab
  const handleSelectSubTab = (subTabId) => {
    setSelectedSubTab(subTabId);
    setSelectedFilter("all");
  };

  // ── Fetch Intimacy Backpack Inventory ─────────────────────────────────────
  // Endpoint: GET http://localhost:8084/api/app/gifts/inventory/intimecy/{type}?page=0&size=20
  useEffect(() => {
    if (selectedCategory !== "intimacy") return;
    const cacheKey = `intimacy_${selectedSubTab}`;
    if (inventoryItems[cacheKey]) return;

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log(
          `[BackpackPanel] Fetching intimacy inventory for type: ${selectedSubTab}...`
        );
        const res = await getIntimacyBackpackInventory(selectedSubTab, 0, 20);
        if (isMounted) {
          const rawList = Array.isArray(res)
            ? res
            : Array.isArray(res?.content)
              ? res.content
              : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.items)
                  ? res.items
                  : [];

          const mapped = rawList.map((it, idx) => ({
            id: String(it.inventoryId ?? it.userGiftId ?? `${it.id ?? "gift"}_${idx}`),
            giftId: it.id,
            name: it.name ?? it.giftName ?? it.title ?? "Intimacy Item",
            imageUrl: it.iconUrl ?? it.imageUrl ?? it.coverImage ?? null,
            quantity: Number(it.quantity ?? it.qty ?? it.count ?? 1),
            duration: it.expiryDays
              ? `${it.expiryDays} Day${it.expiryDays > 1 ? "s" : ""}`
              : it.duration ?? "Permanent",
            outfitType: (it.outfitType || "all").toLowerCase(),
            isEquipped: Boolean(it.isEquipped || it.equipped),
            category: "intimacy",
            subCategory: selectedSubTab,
            raw: it,
          }));

          setInventoryItems((prev) => ({ ...prev, [cacheKey]: mapped }));
        }
      } catch (err) {
        console.warn(
          `[BackpackPanel] Intimacy inventory error for ${selectedSubTab}:`,
          err?.message || err
        );
        if (isMounted) {
          setInventoryItems((prev) => ({ ...prev, [cacheKey]: [] }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedSubTab, inventoryItems]);

  // ── Fetch Avatar Backpack Inventory ───────────────────────────────────────
  // Endpoint: GET http://localhost:8084/api/store/avatar/inventory
  useEffect(() => {
    if (selectedCategory !== "avatar") return;
    const cacheKey = `avatar_${selectedSubTab}`;
    if (inventoryItems[cacheKey]) return;

    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        console.log(
          `[BackpackPanel] Fetching avatar inventory for ${selectedSubTab}...`
        );
        const res = await getAvatarInventory();
        if (isMounted) {
          const rawList = Array.isArray(res)
            ? res
            : Array.isArray(res?.inventory)
              ? res.inventory
              : Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res?.items)
                  ? res.items
                  : [];

          const mapped = rawList.map((it, idx) => ({
            id: String(it.inventoryId ?? it.userAvatarId ?? `${it.id ?? "avatar"}_${idx}`),
            avatarId: it.id,
            name: it.name ?? it.title ?? "Avatar Item",
            imageUrl: it.iconUrl ?? it.imageUrl ?? it.frameUrl ?? null,
            quantity: Number(it.quantity ?? it.qty ?? 1),
            duration: it.duration ?? "1 Day",
            outfitType: (it.outfitType || "all").toLowerCase(),
            isEquipped: Boolean(it.isEquipped || it.equipped),
            category: "avatar",
            subCategory: selectedSubTab,
            raw: it,
          }));

          setInventoryItems((prev) => ({ ...prev, [cacheKey]: mapped }));
        }
      } catch (err) {
        console.warn(
          `[BackpackPanel] Avatar inventory fetch error:`,
          err?.message || err
        );
        if (isMounted) {
          setInventoryItems((prev) => ({ ...prev, [cacheKey]: [] }));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, selectedSubTab, inventoryItems]);

  // Visible Items filter
  const activeCacheKey = `${selectedCategory}_${selectedSubTab}`;
  const visibleItems = useMemo(() => {
    const list = inventoryItems[activeCacheKey] || [];
    if (selectedFilter === "all") return list;
    return list.filter((it) => it.outfitType === selectedFilter);
  }, [inventoryItems, activeCacheKey, selectedFilter]);

  const handleStorePress = () => {
    if (onGoToStore) {
      onGoToStore();
    } else {
      Alert.alert("Store", "Opening Tuk-Tuk Item Store...");
    }
  };

  const currentSubTabs = BACKPACK_SUBTABS[selectedCategory] || [];

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Top Header Bar (Back button, Centered Backpack, Storefront icon) ── */}
      <View
        style={[
          styles.headerRow,
          { paddingTop: Math.max(insets.top + vs(6), vs(16)) },
        ]}
      >
        <TouchableOpacity
          style={styles.navIconBtn}
          activeOpacity={0.7}
          onPress={onClose}
        >
          <Ionicons name="arrow-back" size={ms(20)} color="#1E293B" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Backpack</Text>

        <TouchableOpacity
          style={styles.navIconBtn}
          activeOpacity={0.7}
          onPress={handleStorePress}
        >
          <MaterialCommunityIcons
            name="storefront-outline"
            size={ms(22)}
            color="#1E293B"
          />
        </TouchableOpacity>
      </View>

      {/* ── Categories Row (Horizontal Scroll) ── */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {BACKPACK_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                activeOpacity={0.8}
                onPress={() => handleSelectCategory(cat.id)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextSelected,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Sub-Tabs Row (Horizontal Scroll) ── */}
      {currentSubTabs.length > 0 && (
        <View style={styles.subTabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subTabScroll}
          >
            {currentSubTabs.map((sub) => {
              const isSelected = selectedSubTab === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectSubTab(sub.id)}
                  style={[
                    styles.subTabPill,
                    isSelected && styles.subTabPillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.subTabText,
                      isSelected && styles.subTabTextSelected,
                    ]}
                  >
                    {sub.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── Filter Pills Row (All / Normal Outfit / Privilege Outfit) ── */}
      <View style={styles.filterPillsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsScroll}
        >
          {FILTER_PILLS.map((pill) => {
            const isSelected = selectedFilter === pill.id;
            return (
              <TouchableOpacity
                key={pill.id}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(pill.id)}
                style={[
                  styles.filterPill,
                  isSelected && styles.filterPillSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && styles.filterPillTextSelected,
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Main Content Area ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.mainScrollContent,
          { paddingBottom: Math.max(insets.bottom + vs(20), vs(32)) },
        ]}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading inventory...</Text>
          </View>
        ) : visibleItems.length === 0 ? (
          /* ── Empty State: Sad Box Character ── */
          <View style={styles.emptyWrap}>
            <SadBoxIllustration size={s(150)} />

            {/* ── Go to Store Button (Kept unchanged as requested) ── */}
            <View style={styles.storeSection}>
              <TouchableOpacity
                style={styles.storeButton}
                activeOpacity={0.85}
                onPress={handleStorePress}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={ms(18)}
                  color="#7C3AED"
                />
                <Text style={styles.storeButtonText}>Go to Store</Text>
                <Ionicons name="chevron-forward" size={ms(15)} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ── Item Grid when inventory items exist ── */
          <View>
            <View style={styles.itemGrid}>
              {visibleItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  {/* Quantity Badge */}
                  {item.quantity > 1 && (
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
                    </View>
                  )}

                  {/* Image */}
                  <View style={styles.itemImgWrap}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.itemImg}
                        contentFit="contain"
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="gift"
                        size={ms(42)}
                        color="#A78BFA"
                      />
                    )}
                  </View>

                  {/* Label */}
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Duration */}
                  <Text style={styles.itemDuration}>{item.duration}</Text>
                </View>
              ))}
            </View>

            {/* Go to store button at bottom of items list */}
            <View style={styles.storeSection}>
              <TouchableOpacity
                style={styles.storeButton}
                activeOpacity={0.85}
                onPress={handleStorePress}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={ms(18)}
                  color="#7C3AED"
                />
                <Text style={styles.storeButtonText}>Go to Store</Text>
                <Ionicons name="chevron-forward" size={ms(15)} color="#7C3AED" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header Bar
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: s(16),
    paddingBottom: vs(6),
    backgroundColor: "#FFFFFF",
  },
  navIconBtn: {
    width: s(38),
    height: s(38),
    borderRadius: s(19),
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: ms(18),
    fontWeight: "700",
    color: "#0F172A",
  },

  // Category Tabs
  categoryContainer: {
    marginTop: vs(6),
    paddingBottom: vs(8),
  },
  categoryScroll: {
    paddingHorizontal: s(16),
    alignItems: "center",
    gap: s(6),
  },
  categoryPill: {
    paddingVertical: vs(7),
    paddingHorizontal: s(14),
    borderRadius: s(20),
    backgroundColor: "transparent",
  },
  categoryPillSelected: {
    backgroundColor: "#7C3AED",
  },
  categoryText: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#334155",
  },
  categoryTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Sub-Tabs
  subTabContainer: {
    marginTop: vs(4),
    paddingBottom: vs(8),
  },
  subTabScroll: {
    paddingHorizontal: s(16),
    alignItems: "center",
    gap: s(6),
  },
  subTabPill: {
    paddingVertical: vs(6),
    paddingHorizontal: s(14),
    borderRadius: s(18),
    backgroundColor: "transparent",
  },
  subTabPillSelected: {
    backgroundColor: "#8B5CF6",
  },
  subTabText: {
    fontSize: ms(13),
    fontWeight: "500",
    color: "#475569",
  },
  subTabTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Filter Pills (All / Normal Outfit / Privilege Outfit)
  filterPillsContainer: {
    marginTop: vs(4),
    paddingBottom: vs(12),
  },
  filterPillsScroll: {
    paddingHorizontal: s(16),
    alignItems: "center",
    gap: s(8),
  },
  filterPill: {
    paddingVertical: vs(6),
    paddingHorizontal: s(16),
    borderRadius: s(18),
    backgroundColor: "#F1F5F9",
  },
  filterPillSelected: {
    backgroundColor: "#7C3AED",
  },
  filterPillText: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#64748B",
  },
  filterPillTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Main Scroll Content
  mainScrollContent: {
    flexGrow: 1,
    paddingHorizontal: s(16),
    paddingTop: vs(20),
  },

  // Loading
  loadingWrap: {
    paddingVertical: vs(80),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: vs(12),
    fontSize: ms(13),
    color: "#64748B",
    fontWeight: "500",
  },

  // Empty State
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: vs(40),
  },
  illustrationCenter: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Go to Store Button (Kept unchanged as requested)
  storeSection: {
    alignItems: "center",
    marginTop: vs(28),
    marginBottom: vs(16),
  },
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: s(8),
    backgroundColor: "#FFFFFF",
    paddingVertical: vs(13),
    paddingHorizontal: s(28),
    borderRadius: s(25),
    borderWidth: 1,
    borderColor: "#EDE9FE",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.12,
    shadowRadius: s(8),
    elevation: 3,
  },
  storeButtonText: {
    fontSize: ms(14),
    fontWeight: "700",
    color: "#2E1E5B",
  },

  // Items Grid
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: s(10),
  },
  itemCard: {
    width: ITEM_CARD_WIDTH,
    backgroundColor: "#FAF5FE",
    borderRadius: s(14),
    padding: s(10),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EDE9FE",
    position: "relative",
  },
  qtyBadge: {
    position: "absolute",
    top: vs(6),
    right: s(6),
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(8),
  },
  qtyBadgeText: {
    fontSize: ms(10),
    fontWeight: "700",
    color: "#7C3AED",
  },
  itemImgWrap: {
    width: s(64),
    height: s(64),
    alignItems: "center",
    justifyContent: "center",
    marginVertical: vs(6),
  },
  itemImg: {
    width: "100%",
    height: "100%",
  },
  itemName: {
    fontSize: ms(12),
    fontWeight: "600",
    color: "#1E293B",
    textAlign: "center",
    width: "100%",
  },
  itemDuration: {
    fontSize: ms(10),
    color: "#94A3B8",
    marginTop: vs(2),
    marginBottom: vs(4),
  },
});
