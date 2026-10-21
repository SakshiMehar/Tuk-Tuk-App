import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * StoreHeader - Dedicated header for the Tuk-Tuk Store
 * Clean light header with back button, center "Store" title,
 * and right-side coupon/tag and shopping bag action buttons.
 */
export default function StoreHeader({
  title = "Store",
  onClose,
  onPressCoupons,
  onPressCart,
  couponCount = 1,
  cartCount = 0,
}) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top + 6, 16);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Center: Title (Layered above background, centered on screen) */}
      <View style={[styles.centerWrap, { top: topPad }]} pointerEvents="none">
        <Text style={styles.titleText}>{title}</Text>
      </View>

      {/* Left: Back Button */}
      <TouchableOpacity
        style={styles.circleBtn}
        activeOpacity={0.7}
        onPress={onClose}
        accessibilityLabel="Go Back"
        accessibilityRole="button"
      >
        <Ionicons name="arrow-back" size={22} color="#1E2022" />
      </TouchableOpacity>

      {/* Right: Actions (Coupons & Shopping Bag) */}
      <View style={styles.rightActions}>
        {/* Coupon / Tag Button */}
        <TouchableOpacity
          style={styles.squareActionBtn}
          activeOpacity={0.7}
          onPress={onPressCoupons}
          accessibilityLabel="Coupons"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="ticket-percent-outline" size={21} color="#1E2022" />
          {couponCount > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>

        {/* Shopping Bag Button */}
        <TouchableOpacity
          style={styles.squareActionBtn}
          activeOpacity={0.7}
          onPress={onPressCart}
          accessibilityLabel="Backpack / Inventory"
          accessibilityRole="button"
        >
          <Ionicons name="bag-handle-outline" size={20} color="#1E2022" />
          {cartCount > 0 && (
            <View style={styles.badgeNum}>
              <Text style={styles.badgeNumText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F7",
    position: "relative",
  },
  centerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E2022",
    letterSpacing: -0.2,
  },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F4F5F9",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    zIndex: 10,
  },
  squareActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#F4F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#EAEBED",
    position: "relative",
  },
  badgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  badgeNum: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#7C4DFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeNumText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
  },
});
