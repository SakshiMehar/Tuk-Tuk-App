import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StoreHeader from "./StoreHeader";
import { useWalletBalance } from "../src/hooks/useWalletBalance";
import storeData from "../src/data/storeData.json";

const { width } = Dimensions.get("window");
// 3 columns for Intimacy / Ring cards
const ITEM_WIDTH = Math.floor((width - 32 - 20) / 3);

// Local assets
const sampleFrameImage = require("../assets/images/new-user-frame.png");
const intimacySilverWingImg = require("../assets/images/intimacy_silver_wing.jpg");
const intimacyGoldenDiamondImg = require("../assets/images/intimacy_golden_diamond.jpg");

const resolveStoreImage = (imageKey) => {
  switch (imageKey) {
    case "intimacy_golden_diamond":
      return intimacyGoldenDiamondImg;
    case "intimacy_silver_wing":
    default:
      return intimacySilverWingImg;
  }
};

export default function StorePanel({ onClose }) {
  const insets = useSafeAreaInsets();
  const wallet = useWalletBalance();
  const diamondsBalance = wallet?.diamonds ?? 13536;
  const coinsBalance = wallet?.coins ?? 0;
  const formattedDiamonds = Math.floor(Number(diamondsBalance || 0)).toLocaleString();
  const formattedCoins = Math.floor(Number(coinsBalance || 0)).toLocaleString();

  // Selected category & sub-tab
  const [selectedCategory, setSelectedCategory] = useState("intimacy");
  const [selectedSubTab, setSelectedSubTab] = useState("ring");

  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    const subList = storeData.subTabs?.[catId];
    if (subList && subList.length > 0) {
      setSelectedSubTab(subList[0].id);
    }
  };

  // Filter items matching active category and subcategory
  const currentItems = (storeData.items || []).filter((it) => {
    if (it.category !== selectedCategory) return false;
    if (it.subCategory && it.subCategory !== selectedSubTab) return false;
    return true;
  });

  const activeSubTabs = storeData.subTabs?.[selectedCategory] || [];

  // Category Icon Renderer matching screenshot
  const renderCategoryIcon = (type) => {
    switch (type) {
      case "intimacy":
      case "treasure":
        return (
          <View style={styles.catIconWrap}>
            <LinearGradient
              colors={["#FDA4AF", "#F43F5E"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.catIconSoftBg}
            >
              <MaterialCommunityIcons name="ring" size={23} color="#FFFFFF" />
            </LinearGradient>
          </View>
        );
      case "avatar":
        return (
          <View style={styles.catIconWrap}>
            <Image
              source={sampleFrameImage}
              style={styles.catAvatarFrame}
              contentFit="contain"
            />
          </View>
        );
      case "profile":
        return (
          <View style={styles.catIconWrap}>
            <LinearGradient
              colors={["#FEF08A", "#FBBF24"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.catIconSoftBg}
            >
              <Ionicons name="moon" size={23} color="#D97706" />
            </LinearGradient>
          </View>
        );
      case "entrance":
        return (
          <View style={styles.catIconWrap}>
            <LinearGradient
              colors={["#FED7AA", "#FB923C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.catIconSoftBg}
            >
              <Ionicons name="car-sport" size={24} color="#9A3412" />
            </LinearGradient>
          </View>
        );
      case "chatFrame":
        return (
          <View style={styles.catIconWrap}>
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.catIconSoftBg, { borderRadius: 10, position: "relative" }]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "900", fontSize: 13 }}>Hi</Text>
              <View style={{ position: "absolute", top: -3, right: -2 }}>
                <FontAwesome5 name="crown" size={8} color="#FEF08A" />
              </View>
            </LinearGradient>
          </View>
        );
      case "miniCard":
        return (
          <View style={styles.catIconWrap}>
            <LinearGradient
              colors={["#FB7185", "#E11D48"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.catIconSoftBg, { borderRadius: 8, paddingHorizontal: 3 }]}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 9 }}>Name</Text>
            </LinearGradient>
          </View>
        );
      default:
        return (
          <View style={styles.catIconWrap}>
            <Ionicons name="sparkles" size={24} color="#7C4DFF" />
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── HEADER ── */}
      <StoreHeader
        title="Store"
        onClose={onClose}
        couponCount={1}
      />

      {/* ── GLOBAL BALANCE BAR ── */}
      <View style={styles.balanceBar}>
        <Text style={styles.balanceLabel}>Balance:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.balanceScrollContent}
        >
          {/* 1. Purple Faceted Diamond + Value + Purple Plus */}
          <View style={styles.currencyChip}>
            <View style={styles.diamondIconWrap}>
              <Ionicons name="diamond" size={18} color="#8B5CF6" />
            </View>
            <Text style={styles.currencyVal}>{formattedDiamonds}</Text>
            <View style={styles.plusTouch}>
              <Text style={styles.diamondPlusText}>+</Text>
            </View>
          </View>

          {/* 2. Gold Coin Badge */}
          <View style={styles.currencyChip}>
            <LinearGradient
              colors={["#FDE047", "#EAB308", "#B45309"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coinBadge}
            >
              <View style={styles.coinInnerBorder}>
                <FontAwesome5 name="coins" size={10} color="#78350F" />
              </View>
            </LinearGradient>
            <Text style={styles.currencyVal}>{formattedCoins}</Text>
          </View>

          {/* 3. Crown Coin Badge */}
          <View style={styles.currencyChip}>
            <LinearGradient
              colors={["#FDE68A", "#D97706", "#78350F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coinBadge}
            >
              <View style={styles.coinInnerBorder}>
                <FontAwesome5 name="crown" size={10} color="#FEF3C7" />
              </View>
            </LinearGradient>
            <Text style={styles.currencyVal}>0</Text>
          </View>

          {/* 4. Dark Honor Medal Badge */}
          <View style={styles.currencyChip}>
            <LinearGradient
              colors={["#475569", "#1E293B", "#0F172A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.coinBadge, { borderWidth: 1, borderColor: "#F59E0B" }]}
            >
              <FontAwesome5 name="medal" size={10.5} color="#FBBF24" />
            </LinearGradient>
            <Text style={styles.currencyVal}>0</Text>
          </View>

          {/* 5. Pink Star Badge */}
          <View style={styles.currencyChip}>
            <LinearGradient
              colors={["#FBCFE8", "#F472B6", "#DB2777"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.coinBadge}
            >
              <Ionicons name="star" size={12} color="#FEF08A" />
            </LinearGradient>
            <Text style={styles.currencyVal}>0</Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.mainScroll,
          { paddingBottom: Math.max(insets.bottom + 24, 30) },
        ]}
      >
        {/* ── TOP CATEGORIES HORIZONTAL ROW ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topCategoriesRow}
        >
          {(storeData.categories || []).map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                activeOpacity={0.8}
                onPress={() => handleSelectCategory(cat.id)}
              >
                {renderCategoryIcon(cat.iconType)}
                <Text
                  style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}
                  numberOfLines={1}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── SUB TABS (Ring, Jewelry, Love Zone, Mic Link, Special Card) ── */}
        {activeSubTabs.length > 0 && (
          <View style={styles.subTabsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subTabsScrollContent}
            >
              {activeSubTabs.map((tab) => {
                const isSelected = selectedSubTab === tab.id;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    style={styles.subTabItem}
                    activeOpacity={0.75}
                    onPress={() => setSelectedSubTab(tab.id)}
                  >
                    <Text style={[styles.subTabText, isSelected && styles.subTabTextSelected]}>
                      {tab.label}
                    </Text>
                    {isSelected && <View style={styles.subTabIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── 3-COLUMN RINGS GRID ── */}
        <View style={styles.gridContainer}>
          {currentItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No items found in this section</Text>
            </View>
          ) : (
            currentItems.map((item) => {
              const itemImage = resolveStoreImage(item.imageKey);

              return (
                <View key={item.id} style={styles.itemCard}>
                  {/* Ring Image Showcase */}
                  <View style={styles.itemVisualWrap}>
                    <Image
                      source={itemImage}
                      style={styles.frameImgOverlay}
                      contentFit="contain"
                    />
                  </View>

                  {/* Ring Name */}
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {/* Diamond Price */}
                  <View style={styles.priceRow}>
                    <Ionicons name="diamond" size={13} color="#60A5FA" />
                    <Text style={styles.priceText}>{item.diamonds.toLocaleString()}</Text>
                  </View>

                  {/* Duration */}
                  <Text style={styles.durationText}>{item.duration}</Text>

                  {/* Action Button: Purchase (Orange) or Activity (Grey) */}
                  <View style={styles.actionBtn}>
                    {item.buttonType === "Purchase" ? (
                      <LinearGradient
                        colors={["#FB923C", "#EA580C"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionBtnGrad}
                      >
                        <Text style={styles.actionBtnText}>{item.buttonType}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.actionBtnGrad, { backgroundColor: "#BAC3D2" }]}>
                        <Text style={styles.actionBtnText}>{item.buttonType}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainScroll: {
    backgroundColor: "#FFFFFF",
  },

  // ── Global Balance Bar ──
  balanceBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 7,
    backgroundColor: "#FFFFFF",
  },
  balanceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#8E95A5",
    marginRight: 10,
  },
  balanceScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  currencyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  currencyVal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1E2022",
  },
  plusTouch: {
    marginLeft: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  diamondPlusText: {
    color: "#7C4DFF",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 20,
  },
  diamondIconWrap: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  coinBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 1,
  },
  coinInnerBorder: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 0.8,
    borderColor: "rgba(255, 255, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Top Categories Row ──
  topCategoriesRow: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 10,
  },
  categoryCard: {
    width: 76,
    height: 84,
    borderRadius: 14,
    backgroundColor: "#F6F7FB",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    backgroundColor: "#FFFFFF",
    borderColor: "#7C4DFF",
    borderWidth: 2,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  catIconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  catIconSoftBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  catAvatarFrame: {
    width: 44,
    height: 44,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  categoryLabelSelected: {
    fontWeight: "700",
    color: "#1E2022",
  },

  // ── Sub Tabs Row ──
  subTabsContainer: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  subTabsScrollContent: {
    paddingHorizontal: 16,
    gap: 22,
    alignItems: "center",
  },
  subTabItem: {
    paddingBottom: 6,
    position: "relative",
  },
  subTabText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#8E95A5",
  },
  subTabTextSelected: {
    fontWeight: "700",
    color: "#1E2022",
  },
  subTabIndicator: {
    position: "absolute",
    bottom: 0,
    left: "10%",
    right: "10%",
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#7C4DFF",
  },

  // ── 3-Column Rings Grid ──
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 8,
  },
  emptyState: {
    width: "100%",
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: {
    color: "#94A3B8",
    fontSize: 14,
  },
  itemCard: {
    width: ITEM_WIDTH,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: "center",
    marginBottom: 8,
  },
  itemVisualWrap: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  frameImgOverlay: {
    width: 80,
    height: 80,
  },
  itemName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E2022",
    marginTop: 8,
    textAlign: "center",
    width: "100%",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  priceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E2022",
  },
  durationText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  actionBtn: {
    marginTop: 8,
    borderRadius: 16,
    overflow: "hidden",
    width: "90%",
    maxWidth: 88,
    alignSelf: "center",
  },
  actionBtnGrad: {
    paddingVertical: 5,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 28,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
