import { useState, useEffect, useRef } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, Alert, Dimensions, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WalletUserCard from "./WalletUserCard";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import DiamondRechargeModal from "./DiamondRechargeModal";
import { resolveImageSource } from "../src/utils/videoSource";
import { getUser } from "../src/store/authStore";
import { resolveProfileAvatarSource } from "../src/utils/profileAvatar";
import { useWalletBalance } from "../src/hooks/useWalletBalance";
import {
  VIP_TIER_THRESHOLDS,
  VIP_PROFILE_FRAME_LAYOUT,
} from "../src/constants/vip";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CONTENT_PADDING = 16;
const TIER_SLIDE_WIDTH = SCREEN_WIDTH - CONTENT_PADDING * 2;

// Derived from the same VIP_TIER_THRESHOLDS loadMyVipAssets uses to pick a
// user's actual tier, so this carousel's exp requirements can never drift
// out of sync with what actually unlocks each tier's cosmetics.
const VIP_TIERS = VIP_TIER_THRESHOLDS.map(({ tier, exp, assets }) => ({
  id: tier,
  label: `VIP ${tier}`,
  exp,
  image: assets.logo,
}));

const TIER_ASSETS_BY_ID = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets])
);

// Each VIP tier has its own dress-up set — this row pages in sync with the
// tier crest above. All four assets (logo/profileFrame/entryFrame/chatFrame)
// are now provided for every tier 1-8 — see TIER_ASSETS_BY_ID / src/constants/vip.js
// for any tier still missing one, which falls back to an icon placeholder.
const DRESS_UP_ITEMS_BY_TIER = Object.fromEntries(
  VIP_TIERS.map((tier) => {
    const assets = TIER_ASSETS_BY_ID[tier.id] ?? {};
    return [
      tier.id,
      [
        { id: "logo", icon: "ribbon", label: "VIP Logo", image: assets.logo },
        { id: "frame", icon: "square-outline", label: "Profile Frame", image: assets.profileFrame },
        {
          id: "entrance",
          icon: "people",
          label: "Entrance",
          image: assets.entryFrame,
        },
        { id: "chatframe", icon: "chatbubble-ellipses", label: "Chat Frame", image: assets.chatFrame },
      ],
    ];
  })
);

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
  { id: "specialEnter", icon: "person-add", label: "Special Enter effect", unlocked: false },
  { id: "giftTrack", icon: "gift-outline", label: "VIP Gift Track", unlocked: false },
  { id: "profileCard", icon: "id-card", label: "Personal Profile Card", unlocked: false },
  { id: "sendImageRoom", icon: "images", label: "Send image in room", unlocked: false },
  { id: "vipOnlineListFrame", icon: "list", label: "VIP Online List Frame", unlocked: false },
  { id: "customizeProfileBg", icon: "color-palette", label: "Customize profile background", unlocked: false },
  { id: "unlimitedText", icon: "chatbox-ellipses", label: "Unlimited text", unlocked: false },
  { id: "micProtection", icon: "mic-circle", label: "Mic Protection", unlocked: false },
  { id: "roomActivityPromotion", icon: "megaphone", label: "Room activity promotion", unlocked: false },
  { id: "addFriendsFunction", icon: "people-circle", label: "Add friends function", unlocked: false },
  { id: "vipRoomBubble", icon: "chatbubble-ellipses-outline", label: "VIP Room Bubble", unlocked: false },
  { id: "customizeRoomTheme", icon: "color-fill", label: "Customize room theme", unlocked: false },
  { id: "frontRowUserList", icon: "arrow-up-circle", label: "Front row on User list", unlocked: false },
  { id: "doubleSignInTasks", icon: "calendar", label: "Double sign in and tasks rewards", unlocked: false },
  { id: "gifProfileBg", icon: "images-outline", label: "GIF profile background", unlocked: false },
  { id: "gifAvatar", icon: "happy-outline", label: "GIF avatar", unlocked: false },
  { id: "vipMiniCardBg", icon: "card-outline", label: "VIP Mini Card Bg", unlocked: false },
  { id: "roomBroadcast", icon: "megaphone-outline", label: "Room Broadcast", unlocked: false },
  { id: "coloredUsername", icon: "text", label: "Colored username", unlocked: false },
  { id: "uniquePersonalId", icon: "finger-print", label: "Unique personal id", unlocked: false },
  { id: "mysteriousVisitors", icon: "eye-off", label: "Mysterious vistors", unlocked: false },
  { id: "customerServiceExpert", icon: "headset", label: "Customer service expert", unlocked: false },
  { id: "unlimitedChat", icon: "chatbubbles-outline", label: "Unlimited chat", unlocked: false },
  { id: "roomListFrame", icon: "albums-outline", label: "Room List Frame", unlocked: false },
  { id: "globalBroadcast", icon: "globe", label: "Global Broadcast", unlocked: false },
  { id: "vipMomentFrame", icon: "camera", label: "VIP Moment Frame", unlocked: false },
  { id: "vipProfileAnimation", icon: "sparkles", label: "VIP Profile Animation", unlocked: false },
  { id: "roomProtection", icon: "shield", label: "Room Protection", unlocked: false },
  { id: "kickCard", icon: "exit-outline", label: "Kick Card", unlocked: false },
  { id: "antiKickCard", icon: "shield-half", label: "Anti-Kick Card", unlocked: false },
  { id: "vipChatListFrame", icon: "chatbox", label: "VIP Chat List Frame", unlocked: false },
  { id: "vipMicAnimation", icon: "mic", label: "VIP Mic Animation", unlocked: false },
  { id: "custRepSendGifts", icon: "gift", label: "Customer representative send gifts", unlocked: false },
  { id: "namedGifts", icon: "pricetags", label: "Named gifts", unlocked: false },
  { id: "blacklistImmunity", icon: "ban", label: "Blacklist Immunity", unlocked: false },
  { id: "vipMicBubble", icon: "mic-outline", label: "Vip Mic Bubble", unlocked: false },
  { id: "exclusiveCustomAvatarFrame", icon: "person-circle-outline", label: "Exclusive customize avatar frame", unlocked: false },
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
  const { diamonds: walletDiamonds } = useWalletBalance();
  const [rechargeVisible, setRechargeVisible] = useState(false);

  // Self avatar, for the "how this looks on your profile pic" preview popup below.
  const [selfUser, setSelfUser] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getUser().then((u) => {
      if (!cancelled) setSelfUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const selfAvatarSource = resolveProfileAvatarSource(selfUser);

  // "Profile Frame" gets the full avatar-composite preview (it's the only item
  // that actually overlays the user's own photo); every other tile just pops
  // up its raw image.
  const [previewItem, setPreviewItem] = useState(null);
  const [previewImageItem, setPreviewImageItem] = useState(null);
  const handleDressItemPress = (item) => {
    if (!item.image) {
      notWiredYet();
      return;
    }
    if (item.id === "frame") {
      setPreviewItem(item);
    } else {
      setPreviewImageItem(item);
    }
  };

  // Keeps the "Level dressing up" row paged in lockstep with the VIP tier
  // crest carousel above it — swiping either one carries the other along.
  const [activeTierIndex, setActiveTierIndex] = useState(0);
  const tierScrollRef = useRef(null);
  const dressScrollRef = useRef(null);

  const handleTierScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TIER_SLIDE_WIDTH);
    setActiveTierIndex(idx);
  };
  const handleDressScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / TIER_SLIDE_WIDTH);
    setActiveTierIndex(idx);
  };

  useEffect(() => {
    tierScrollRef.current?.scrollTo({ x: activeTierIndex * TIER_SLIDE_WIDTH, animated: true });
    dressScrollRef.current?.scrollTo({ x: activeTierIndex * TIER_SLIDE_WIDTH, animated: true });
  }, [activeTierIndex]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <WalletUserCard />

        <ScrollView
          ref={tierScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tierScrollContent}
          snapToInterval={TIER_SLIDE_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleTierScrollEnd}
        >
          {VIP_TIERS.map((tier) => (
            <View key={tier.id} style={styles.tierSlide}>
              {tier.image ? (
                <Image
                  source={resolveImageSource(tier.image)}
                  style={styles.tierCrestImage}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient colors={["#7c4dff", "#e879f9"]} style={styles.tierCrest}>
                  <Ionicons name="shield" size={52} color="white" />
                  <Text style={styles.tierCrestLabel}>VIP{tier.id}</Text>
                </LinearGradient>
              )}
              <Text style={styles.tierName}>{tier.label}</Text>
              <Text style={styles.tierExp}>Exp {tier.exp.toLocaleString("en-IN")}</Text>
            </View>
          ))}
        </ScrollView>

        <SectionRibbon title="Level dressing up" />
        <ScrollView
          ref={dressScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={TIER_SLIDE_WIDTH}
          decelerationRate="fast"
          onMomentumScrollEnd={handleDressScrollEnd}
        >
          {VIP_TIERS.map((tier) => (
            <View key={tier.id} style={styles.dressPage}>
              <View style={styles.dressRow}>
                {(DRESS_UP_ITEMS_BY_TIER[tier.id] ?? []).map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dressItem}
                    activeOpacity={0.8}
                    onPress={() => handleDressItemPress(item)}
                  >
                    <LinearGradient colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]} style={StyleSheet.absoluteFill} />
                    {item.image ? (
                      <Image
                        source={resolveImageSource(item.image)}
                        style={styles.dressItemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name={item.icon} size={26} color="#e879f9" />
                    )}
                    {item.playable ? (
                      <View style={styles.playBadge}>
                        <Ionicons name="play" size={9} color="white" />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
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
        <TouchableOpacity activeOpacity={0.85} onPress={() => setRechargeVisible(true)}>
          <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.rechargeBtn}>
            <Text style={styles.rechargeBtnText}>Recharge now</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>

      <DiamondRechargeModal
        visible={rechargeVisible}
        onClose={() => setRechargeVisible(false)}
        currentDiamonds={walletDiamonds}
      />

      {/* Dress-up preview — shows the tapped item's frame/décor over the user's
          own profile picture, centered on screen. */}
      <Modal
        visible={!!previewItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewItem(null)}
      >
        <TouchableOpacity
          style={styles.previewBackdrop}
          activeOpacity={1}
          onPress={() => setPreviewItem(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.previewCard} onPress={() => {}}>
            <LinearGradient colors={["#2a1257", "#1a0a2e"]} style={StyleSheet.absoluteFill} />
            <TouchableOpacity
              style={styles.previewCloseBtn}
              activeOpacity={0.8}
              onPress={() => setPreviewItem(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>

            <ProfileAvatarWithFrame
              avatarSource={selfAvatarSource}
              frameSource={previewItem?.image ? resolveImageSource(previewItem.image) : null}
              size={110}
              wrapperStyle={styles.previewAvatarWrap}
              frameScale={VIP_PROFILE_FRAME_LAYOUT.frameScale}
              frameResizeMode={VIP_PROFILE_FRAME_LAYOUT.frameResizeMode}
              frameOffsetX={VIP_PROFILE_FRAME_LAYOUT.frameOffsetX}
              frameOffsetY={VIP_PROFILE_FRAME_LAYOUT.frameOffsetY}
              frameBleed={VIP_PROFILE_FRAME_LAYOUT.frameBleed}
              avatarBoost={VIP_PROFILE_FRAME_LAYOUT.avatarBoost}
              avatarOffsetY={VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY}
            />
            <Text style={styles.previewLabel}>{previewItem?.label}</Text>
            <Text style={styles.previewHint}>This is how it appears on your profile picture</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Plain image popup for every dress-up tile other than Profile Frame —
          just shows the asset itself, no avatar compositing. */}
      <Modal
        visible={!!previewImageItem}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageItem(null)}
      >
        <TouchableOpacity
          style={styles.previewBackdrop}
          activeOpacity={1}
          onPress={() => setPreviewImageItem(null)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.previewCard} onPress={() => {}}>
            <LinearGradient colors={["#2a1257", "#1a0a2e"]} style={StyleSheet.absoluteFill} />
            <TouchableOpacity
              style={styles.previewCloseBtn}
              activeOpacity={0.8}
              onPress={() => setPreviewImageItem(null)}
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>

            {previewImageItem?.image && (
              <View style={styles.previewPlainImageWrap}>
                <Image
                  source={resolveImageSource(previewImageItem.image)}
                  style={styles.previewPlainImage}
                  resizeMode="contain"
                />
              </View>
            )}
            <Text style={styles.previewLabel}>{previewImageItem?.label}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  tierCrestImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    marginBottom: 10,
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
  dressPage: {
    width: TIER_SLIDE_WIDTH,
  },
  dressRow: {
    flexDirection: "row",
    justifyContent: "center",
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
  dressItemImage: {
    width: "100%",
    height: "100%",
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
  previewBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 32,
  },
  previewCard: {
    width: "100%",
    maxWidth: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.35)",
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  previewCloseBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarWrap: {
    marginBottom: 16,
  },
  previewPlainImageWrap: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  previewPlainImage: {
    width: "100%",
    height: "100%",
  },
  previewLabel: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
  },
  previewHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
  },
});
