import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WalletUserCard from "./WalletUserCard";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 16;
const TIER_SLIDE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

const VIP_TIERS = [
  { id: 1, label: "VIP 1", exp: 1000 },
  { id: 2, label: "VIP 2", exp: 3000 },
  { id: 3, label: "VIP 3", exp: 8000 },
  { id: 4, label: "VIP 4", exp: 20000 },
];

const DRESS_UP_ITEMS = [
  { id: "bg", icon: "image", label: "Room BG" },
  { id: "entrance", icon: "people", label: "Entrance", playable: true },
  { id: "ring", icon: "person-circle", label: "Avatar Ring", playable: true },
  { id: "frame", icon: "square-outline", label: "Profile Frame" },
];

const PRIVILEGES = [
  { id: "badge", icon: "diamond", label: "VIP Badge", unlocked: true },
  { id: "avatarFrame", icon: "person-circle", label: "VIP avatar frame", unlocked: true },
  { id: "gifts", icon: "gift", label: "Exclusive VIP gifts", unlocked: true },
  { id: "chat", icon: "chatbubbles", label: "Chat privileges", unlocked: true },
  { id: "profileShow", icon: "man", label: "VIP Profile Show", unlocked: true },
  { id: "chatFrame", icon: "pricetag", label: "VIP chat frame", unlocked: true },
  { id: "customAvatar", icon: "person", label: "Customize avatar", unlocked: false },
  { id: "stickers", icon: "happy", label: "Exclusive stickers on MIC", unlocked: false },
  { id: "roomBg", icon: "image", label: "VIP Room Background", unlocked: false },
  { id: "specialEnter", icon: "person-add", label: "Special enter", unlocked: false },
  { id: "giftTrack", icon: "gift-outline", label: "VIP Gift Track", unlocked: false },
  { id: "profileCard", icon: "id-card", label: "Personal Profile Card", unlocked: false },
];

const notWiredYet = () => Alert.alert("Not available yet", "This isn't wired up to the backend yet.");

// Hexagonal ribbon banner, same shape language used across the other menu panels.
function SectionRibbon({ title }) {
  return (
    <View style={styles.ribbonOuter}>
      <View style={styles.ribbonWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Polygon points="6,0 94,0 100,50 94,100 6,100 0,50" fill="rgba(59,26,120,0.9)" stroke="#e879f9" strokeWidth={1.4} />
        </Svg>
        <Text style={styles.ribbonText} numberOfLines={1}>{title}</Text>
      </View>
    </View>
  );
}

export default function VipCenterPanel() {
  const insets = useSafeAreaInsets();
  const unlockedCount = PRIVILEGES.filter((p) => p.unlocked).length;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <WalletUserCard xpCurrent={0} xpTarget={VIP_TIERS[0].exp} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierScrollContent}
          snapToInterval={TIER_SLIDE_WIDTH}
          decelerationRate="fast"
        >
          {VIP_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierSlide}>
              <LinearGradient colors={["#7c4dff", "#e879f9"]} style={styles.tierCrest}>
                <Ionicons name="shield" size={52} color="white" />
                <Text style={styles.tierCrestLabel}>VIP{tier.id}</Text>
              </LinearGradient>
              <Text style={styles.tierName}>{tier.label}</Text>
              <Text style={styles.tierExp}>Exp {tier.exp.toLocaleString("en-IN")}</Text>
            </View>
          ))}
        </ScrollView>

        <SectionRibbon title="Level dressing up" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dressRow}
        >
          {DRESS_UP_ITEMS.map((item) => (
            <TouchableOpacity key={item.id} style={styles.dressItem} activeOpacity={0.8} onPress={notWiredYet}>
              <LinearGradient colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]} style={StyleSheet.absoluteFill} />
              <Ionicons name={item.icon} size={26} color="#e879f9" />
              {item.playable ? (
                <View style={styles.playBadge}>
                  <Ionicons name="play" size={9} color="white" />
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.privilegesDivider}>
          <LinearGradient
            colors={["rgba(232,121,249,0)", "rgba(232,121,249,0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privilegesDividerLine}
          />
          <Text style={styles.privilegesDividerText}>
            Privileges({unlockedCount}/{PRIVILEGES.length})
          </Text>
          <LinearGradient
            colors={["rgba(232,121,249,0.6)", "rgba(232,121,249,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.privilegesDividerLine}
          />
        </View>

        <View style={styles.privilegeGrid}>
          {PRIVILEGES.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={styles.privilegeCell}
              activeOpacity={0.8}
              onPress={notWiredYet}
            >
              <View style={[styles.privilegeIconWrap, !p.unlocked && styles.privilegeIconWrapLocked]}>
                <Ionicons name={p.icon} size={22} color={p.unlocked ? "#e879f9" : "rgba(255,255,255,0.25)"} />
              </View>
              <Text
                style={[styles.privilegeLabel, !p.unlocked && styles.privilegeLabelLocked]}
                numberOfLines={2}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 90 + insets.bottom }} />
      </ScrollView>

      <LinearGradient
        colors={["rgba(26,10,46,0.98)", "#1a0a2e"]}
        style={[styles.bottomBar, { paddingBottom: 16 + insets.bottom }]}
      >
        <TouchableOpacity activeOpacity={0.85} onPress={notWiredYet}>
          <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rechargeBtn}>
            <Text style={styles.rechargeBtnText}>Recharge now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: CONTENT_PADDING,
  },
  tierScrollContent: {
    paddingVertical: 20,
  },
  tierSlide: {
    width: TIER_SLIDE_WIDTH,
    alignItems: "center",
  },
  tierCrest: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  tierCrestLabel: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "white",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  tierName: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  tierExp: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
  },
  ribbonOuter: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  ribbonWrap: {
    width: "70%",
    height: 34,
  },
  ribbonText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  dressRow: {
    gap: 10,
    paddingBottom: 4,
  },
  dressItem: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  playBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  privilegesDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  privilegesDividerLine: {
    flex: 1,
    height: 1,
  },
  privilegesDividerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
  },
  privilegeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  privilegeCell: {
    width: "31%",
    alignItems: "center",
    marginBottom: 20,
  },
  privilegeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  privilegeIconWrapLocked: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  privilegeLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  privilegeLabelLocked: {
    color: "rgba(255,255,255,0.3)",
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  rechargeBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  rechargeBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
});
