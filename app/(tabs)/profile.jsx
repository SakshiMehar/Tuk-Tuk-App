import { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getUser, updateUser } from "../../src/store/authStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const meImg = require("../../assets/images/me.png");
const profileImg = require("../../assets/images/android-icon-background.png");
const frameImg = require("../../assets/images/new-user-frame.png");

const avatarMap = {
  avatar1: require("../../assets/Avatar/avatar1.webp"),
  avatar2: require("../../assets/Avatar/avatar2.webp"),
  avatar3: require("../../assets/Avatar/avatar3.webp"),
  avatar4: require("../../assets/Avatar/avatar4.webp"),
  avatar5: require("../../assets/Avatar/avatar5.webp"),
};

// Menu pages — 8 items per page (4×2 grid)
const menuPages = [
  [
    { icon: "gift",         label: "Get Rewards",  badge: true  },
    { icon: "tasks",        label: "Task",         badge: true  },
    { icon: "id-card",      label: "Monthly Card", badge: true  },
    { icon: "store",        label: "Store",        badge: true  },
    { icon: "users",        label: "Relationship", badge: true  },
    { icon: "wallet",       label: "Wallet",       badge: false },
    { icon: "shield-alt",   label: "Premium",      badge: true  },
    { icon: "gem",          label: "VIP",          badge: false },
  ],
  [
    { icon: "ticket-alt",   label: "Coupon",       badge: false },
    { icon: "star",         label: "Honor Level",  badge: false },
    { icon: "home",         label: "Family",       badge: false },
    { icon: "heart",        label: "Matchmaker",   badge: true  },
    { icon: "briefcase",    label: "Backpack",     badge: false },
    { icon: "crown",        label: "Room Premium", badge: true  },
    { icon: "id-badge",     label: "TukTuk Pass",   badge: true  },
    { icon: "level-up-alt", label: "Level",        badge: true  },
  ],
  [
    { icon: "instagram",    label: "Instagram",    badge: false },
    { icon: "share-alt",    label: "Share",        badge: false },
    { icon: "headset",      label: "Help",         badge: true  },
    { icon: "shield",       label: "Room Badge",   badge: true  },
    { icon: "certificate",  label: "Badge",        badge: true  },
    { icon: "house-user",   label: "Room Title",   badge: false },
    { icon: "comment-dots", label: "Feedback",     badge: false },
    { icon: "facebook",     label: "Facebook",     badge: false },
  ],
];

const BOTTOM_TABS = ["Moment", "Profile", "Honor", "Gift"];

export default function Profile() {
  const router = useRouter();
  const [following] = useState(128);
  const [followers] = useState(3402);
  const [Visitor] = useState(12800);
  const [menuPage, setMenuPage] = useState(0);
  const [activeTab, setActiveTab] = useState("Moment");
  const menuRef = useRef(null);

  // Editable profile state
  const [name, setName] = useState("Tuk Tuk User");
  const [avatarId, setAvatarId] = useState("avatar1");
  const [editAvatarId, setEditAvatarId] = useState("avatar1");
  const [editVisible, setEditVisible] = useState(false);
  const avatarSource = avatarMap[avatarId] || avatarMap.avatar1;

  const avatarOptions = Object.keys(avatarMap);

  // Menu modal state
  const [activeMenu, setActiveMenu] = useState(null);
  const [expandedFaqMM, setExpandedFaqMM] = useState(null);
  const [profileFeedback, setProfileFeedback] = useState("");
  const [feedbackSentMM, setFeedbackSentMM] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        const user = await getUser();
        if (user) {
          if (user.name) setName(user.name);
          if (user.avatarId) {
            setAvatarId(user.avatarId);
            setEditAvatarId(user.avatarId);
          }
        }
      };
      loadProfile();
    }, [])
  );

  const handleSaveProfile = async () => {
    setEditVisible(false);
    await updateUser({ name, avatarId: editAvatarId });
    setAvatarId(editAvatarId);
  };

  const renderMenuContent = () => {
    if (!activeMenu) return null;
    const { label } = activeMenu;

    // ── MENU UI COMMENTED OUT ─────────────────────────────────────────────────
   

    // ── GET REWARDS ───────────────────────────────────────────────────────────
    if (label === "Get Rewards") {
      const days = [
        { day: "Mon", reward: "10💎", claimed: true },
        { day: "Tue", reward: "20💎", claimed: true },
        { day: "Wed", reward: "15🪙", claimed: true },
        { day: "Thu", reward: "30💎", claimed: false, today: true },
        { day: "Fri", reward: "25💎", claimed: false },
        { day: "Sat", reward: "50💎", claimed: false },
        { day: "Sun", reward: "100💎", claimed: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(168,85,247,0.1)"]} style={styles.mmHeroBox}>
            <Text style={{ fontSize: 48 }}>🎁</Text>
            <Text style={styles.mmHeroTitle}>Day 3 Streak!</Text>
            <Text style={styles.mmHeroSub}>Keep logging in daily to earn bigger rewards</Text>
          </LinearGradient>
          <View style={styles.mmDayGrid}>
            {days.map((d) => (
              <View key={d.day} style={[styles.mmDayCell, d.today && styles.mmDayCellActive, d.claimed && styles.mmDayCellClaimed]}>
                <Text style={styles.mmDayName}>{d.day}</Text>
                <Text style={{ fontSize: 16, marginVertical: 4 }}>{d.claimed ? "✅" : d.today ? "🎯" : "🔒"}</Text>
                <Text style={styles.mmDayVal}>{d.reward}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Claim Today's Reward  30💎</Text>
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.mmInfoRow}>
            <Ionicons name="trophy-outline" size={16} color="#fbbf24" />
            <Text style={styles.mmInfoText}>Complete 7 days for a 500💎 bonus!</Text>
          </View>
        </ScrollView>
      );
    }

    // ── TASK ──────────────────────────────────────────────────────────────────
    if (label === "Task") {
      const daily = [
        { label: "Log in today", xp: "10💎", done: true },
        { label: "Send 5 messages", xp: "20💎", done: true },
        { label: "Join a voice room", xp: "15🪙", done: false },
        { label: "Follow 2 new people", xp: "10💎", done: false },
      ];
      const weekly = [
        { label: "Reach Level 5", xp: "200💎", done: false },
        { label: "Match 3 people", xp: "100💎", done: false },
        { label: "Post a moment", xp: "50🪙", done: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmProgressCard}>
            <View style={styles.mmProgressLabelRow}>
              <Text style={styles.mmProgressTitle}>Daily Progress</Text>
              <Text style={styles.mmProgressVal}>2 / 4</Text>
            </View>
            <View style={styles.mmProgressBar}><View style={[styles.mmProgressFill, { width: "50%" }]} /></View>
          </View>
          <Text style={styles.mmSectionLabel}>Daily Tasks</Text>
          {daily.map((t) => (
            <View key={t.label} style={styles.mmTaskRow}>
              <View style={[styles.mmTaskCheck, t.done && styles.mmTaskCheckDone]}>
                {t.done && <Ionicons name="checkmark" size={13} color="white" />}
              </View>
              <Text style={[styles.mmTaskText, t.done && styles.mmTaskTextDone]}>{t.label}</Text>
              <Text style={styles.mmTaskReward}>{t.xp}</Text>
            </View>
          ))}
          <Text style={styles.mmSectionLabel}>Weekly Tasks</Text>
          {weekly.map((t) => (
            <View key={t.label} style={styles.mmTaskRow}>
              <View style={[styles.mmTaskCheck, t.done && styles.mmTaskCheckDone]}>
                {t.done && <Ionicons name="checkmark" size={13} color="white" />}
              </View>
              <Text style={[styles.mmTaskText, t.done && styles.mmTaskTextDone]}>{t.label}</Text>
              <Text style={styles.mmTaskReward}>{t.xp}</Text>
            </View>
          ))}
        </ScrollView>
      );
    }

    // ── MONTHLY CARD ──────────────────────────────────────────────────────────
    if (label === "Monthly Card") {
      const perks = ["100💎 daily for 30 days", "Exclusive Monthly Card frame", "2× XP boost for 30 days", "Priority room entry", "Ad-free experience"];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["#7c4dff", "#a855f7", "#ec4899"]} style={styles.mmCardHero}>
            <Text style={styles.mmCardHeroLabel}>MONTHLY CARD</Text>
            <Text style={styles.mmCardHeroPrice}>₹199 / month</Text>
            <Text style={styles.mmCardHeroSub}>3,000💎 total value</Text>
          </LinearGradient>
          <Text style={styles.mmSectionLabel}>What you get</Text>
          {perks.map((p) => (
            <View key={p} style={styles.mmPerkRow}>
              <Ionicons name="checkmark-circle" size={20} color="#a78bfa" />
              <Text style={styles.mmPerkText}>{p}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Subscribe Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── STORE ─────────────────────────────────────────────────────────────────
    if (label === "Store") {
      const items = [
        { emoji: "💎", label: "60 Diamonds", price: "₹59" },
        { emoji: "💎", label: "300 Diamonds", price: "₹249" },
        { emoji: "💎", label: "980 Diamonds", price: "₹799", tag: "Popular" },
        { emoji: "🪙", label: "500 Coins", price: "₹49" },
        { emoji: "🪙", label: "2500 Coins", price: "₹199", tag: "Best Value" },
        { emoji: "⭐", label: "VIP 1 Month", price: "₹399" },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmStoreGrid}>
            {items.map((it) => (
              <TouchableOpacity key={it.label} style={styles.mmStoreItem} activeOpacity={0.8}>
                {it.tag && <View style={styles.mmStoreTag}><Text style={styles.mmStoreTagText}>{it.tag}</Text></View>}
                <Text style={{ fontSize: 32, marginBottom: 6 }}>{it.emoji}</Text>
                <Text style={styles.mmStoreLabel}>{it.label}</Text>
                <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmStorePriceBtn}>
                  <Text style={styles.mmStorePriceText}>{it.price}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      );
    }

    // ── RELATIONSHIP ──────────────────────────────────────────────────────────
    if (label === "Relationship") {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(236,72,153,0.15)"]} style={styles.mmRelCard}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>💑</Text>
            <Text style={styles.mmRelTitle}>No Partner Yet</Text>
            <Text style={styles.mmRelSub}>Connect with someone special to become a couple</Text>
            <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
              <LinearGradient colors={["#7c4dff", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
                <Text style={styles.mmPrimaryBtnText}>Find a Partner</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.mmSectionLabel}>BFF</Text>
          <View style={styles.mmBFFCard}>
            <Text style={{ fontSize: 28 }}>🤝</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.mmBFFTitle}>No BFF yet</Text>
              <Text style={styles.mmBFFSub}>Add a best friend on Tuk-Tuk</Text>
            </View>
            <TouchableOpacity style={styles.mmSmallBtn} activeOpacity={0.8}>
              <Text style={styles.mmSmallBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // ── WALLET ────────────────────────────────────────────────────────────────
    if (label === "Wallet") {
      const txns = [
        { label: "Daily reward", amount: "+10💎", date: "Today", color: "#4ade80" },
        { label: "Daily reward", amount: "+10💎", date: "Yesterday", color: "#4ade80" },
        { label: "Store purchase", amount: "-60💎", date: "May 28", color: "#f87171" },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["#7c4dff", "#a855f7"]} style={styles.mmWalletCard}>
            <Text style={styles.mmWalletLabel}>Total Balance</Text>
            <View style={styles.mmWalletBalRow}>
              <Text style={{ fontSize: 26 }}>💎</Text>
              <Text style={styles.mmWalletAmount}>  2 Diamonds</Text>
            </View>
            <View style={styles.mmWalletBalRow}>
              <Text style={{ fontSize: 20 }}>🪙</Text>
              <Text style={[styles.mmWalletAmount, { fontSize: 18 }]}>  0 Coins</Text>
            </View>
            <TouchableOpacity style={styles.mmWalletTopUp} activeOpacity={0.8}>
              <Text style={styles.mmWalletTopUpText}>+ Top Up</Text>
            </TouchableOpacity>
          </LinearGradient>
          <Text style={styles.mmSectionLabel}>Recent Transactions</Text>
          {txns.map((t, i) => (
            <View key={i} style={styles.mmTxnRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mmTxnLabel}>{t.label}</Text>
                <Text style={styles.mmTxnDate}>{t.date}</Text>
              </View>
              <Text style={[styles.mmTxnAmount, { color: t.color }]}>{t.amount}</Text>
            </View>
          ))}
        </ScrollView>
      );
    }

    // ── PREMIUM ───────────────────────────────────────────────────────────────
    if (label === "Premium") {
      const features = [
        { icon: "eye-off-outline", label: "Invisible mode", free: false },
        { icon: "infinite-outline", label: "Unlimited matches", free: false },
        { icon: "star-outline", label: "Priority in search", free: false },
        { icon: "chatbubble-ellipses-outline", label: "Unlimited messages", free: true },
        { icon: "person-outline", label: "See profile visitors", free: false },
        { icon: "shield-checkmark-outline", label: "Verified badge", free: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["#7c4dff", "#a855f7", "#ec4899"]} style={styles.mmPremiumHero}>
            <Ionicons name="shield-checkmark" size={44} color="white" />
            <Text style={styles.mmPremiumHeroTitle}>Go Premium</Text>
            <Text style={styles.mmPremiumHeroSub}>Unlock the full Tuk-Tuk experience</Text>
          </LinearGradient>
          {features.map((f) => (
            <View key={f.label} style={styles.mmFeatureRow}>
              <Ionicons name={f.icon} size={20} color="#a78bfa" />
              <Text style={styles.mmFeatureLabel}>{f.label}</Text>
              <Ionicons name={f.free ? "checkmark-circle" : "lock-closed"} size={20} color={f.free ? "#4ade80" : "#f87171"} />
            </View>
          ))}
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Upgrade for ₹299/month</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── VIP ───────────────────────────────────────────────────────────────────
    if (label === "VIP") {
      const tiers = [
        { level: "VIP 1", req: "1,000 pts", colors: ["#cd7f32", "#a0522d"], emoji: "🥉" },
        { level: "VIP 2", req: "5,000 pts", colors: ["#9ca3af", "#6b7280"], emoji: "🥈" },
        { level: "VIP 3", req: "15,000 pts", colors: ["#fbbf24", "#f59e0b"], emoji: "🥇" },
        { level: "VIP 4", req: "50,000 pts", colors: ["#7c4dff", "#a855f7"], emoji: "💜" },
        { level: "VIP 5", req: "200,000 pts", colors: ["#ec4899", "#f43f5e"], emoji: "👑" },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmVIPCurrentBox}>
            <Text style={styles.mmVIPCurrentLabel}>Your VIP Status</Text>
            <Text style={styles.mmVIPCurrentVal}>Not VIP Yet</Text>
            <Text style={styles.mmVIPCurrentSub}>Top up diamonds to earn VIP points</Text>
          </View>
          {tiers.map((t) => (
            <LinearGradient key={t.level} colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmVIPTier}>
              <Text style={{ fontSize: 24 }}>{t.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.mmVIPTierName}>{t.level}</Text>
                <Text style={styles.mmVIPTierReq}>{t.req} to unlock</Text>
              </View>
              <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.65)" />
            </LinearGradient>
          ))}
        </ScrollView>
      );
    }

    // ── COUPON ────────────────────────────────────────────────────────────────
    if (label === "Coupon") {
      return (
        <View style={styles.mmEmptyCenter}>
          <Text style={{ fontSize: 64 }}>🎟️</Text>
          <Text style={styles.mmEmptyTitle}>No Coupons Yet</Text>
          <Text style={styles.mmEmptySub}>Earn coupons by completing tasks, attending events, or purchasing premium packages.</Text>
          <TouchableOpacity style={styles.mmOutlineBtn} activeOpacity={0.8}>
            <Text style={styles.mmOutlineBtnText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── HONOR LEVEL ───────────────────────────────────────────────────────────
    if (label === "Honor Level") {
      const perks = ["Custom profile border at Lv 5", "Honor badge on profile at Lv 10", "Priority in discovery at Lv 20", "Exclusive room themes at Lv 50"];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmHonorHero}>
            <Text style={{ fontSize: 52, marginBottom: 8 }}>⭐</Text>
            <Text style={styles.mmHonorLevel}>Level 1</Text>
            <Text style={styles.mmHonorXP}>0 / 500 XP to Level 2</Text>
            <View style={[styles.mmProgressBar, { width: "100%", marginTop: 10 }]}>
              <View style={[styles.mmProgressFill, { width: "3%" }]} />
            </View>
          </View>
          <Text style={styles.mmSectionLabel}>Upcoming Perks</Text>
          {perks.map((p) => (
            <View key={p} style={styles.mmPerkRow}>
              <Ionicons name="star" size={16} color="#fbbf24" />
              <Text style={styles.mmPerkText}>{p}</Text>
            </View>
          ))}
        </ScrollView>
      );
    }

    // ── FAMILY ────────────────────────────────────────────────────────────────
    if (label === "Family") {
      return (
        <View style={styles.mmEmptyCenter}>
          <Text style={{ fontSize: 64 }}>🏠</Text>
          <Text style={styles.mmEmptyTitle}>No Family Yet</Text>
          <Text style={styles.mmEmptySub}>Create or join a family to grow together, earn family rewards, and unlock exclusive perks.</Text>
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Create Family</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mmOutlineBtn, { marginTop: 10 }]} activeOpacity={0.8}>
            <Text style={styles.mmOutlineBtnText}>Join a Family</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // ── MATCHMAKER ────────────────────────────────────────────────────────────
    if (label === "Matchmaker") {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmMatchCard}>
            <LinearGradient colors={["#7c4dff", "#ec4899"]} style={styles.mmMatchCardGrad}>
              <Image source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }} style={styles.mmMatchAvatar} />
              <Text style={styles.mmMatchName}>Aria, 23</Text>
              <Text style={styles.mmMatchLocation}>📍 2 km away</Text>
              <View style={styles.mmMatchTags}>
                {["Music", "Travel", "Coffee"].map((tag) => (
                  <View key={tag} style={styles.mmMatchTag}><Text style={styles.mmMatchTagText}>{tag}</Text></View>
                ))}
              </View>
            </LinearGradient>
          </View>
          <View style={styles.mmMatchActions}>
            <TouchableOpacity style={[styles.mmMatchBtn, { backgroundColor: "rgba(248,113,113,0.15)", borderWidth: 1, borderColor: "rgba(248,113,113,0.3)" }]} activeOpacity={0.8}>
              <Ionicons name="close" size={30} color="#f87171" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.mmMatchBtn, { backgroundColor: "#7c4dff" }]} activeOpacity={0.8}>
              <Ionicons name="heart" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      );
    }

    // ── BACKPACK ──────────────────────────────────────────────────────────────
    if (label === "Backpack") {
      const items = [
        { emoji: "🎭", label: "Avatar Frame", qty: 1 },
        { emoji: "✨", label: "Entry Effect", qty: 0 },
        { emoji: "🎵", label: "Bubble Theme", qty: 0 },
        { emoji: "🏅", label: "Room Badge", qty: 2 },
        { emoji: "👑", label: "VIP Effect", qty: 0 },
        { emoji: "🌈", label: "Profile BG", qty: 1 },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmBackpackGrid}>
            {items.map((it) => (
              <View key={it.label} style={[styles.mmBackpackItem, it.qty === 0 && { opacity: 0.38 }]}>
                <Text style={{ fontSize: 32, marginBottom: 6 }}>{it.emoji}</Text>
                <Text style={styles.mmBackpackLabel}>{it.label}</Text>
                {it.qty > 0
                  ? <View style={styles.mmBackpackBadge}><Text style={styles.mmBackpackBadgeText}>×{it.qty}</Text></View>
                  : <Text style={styles.mmBackpackEmpty}>None</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // ── ROOM PREMIUM ─────────────────────────────────────────────────────────
    if (label === "Room Premium") {
      const themes = [
        { label: "Galaxy", colors: ["#1a0a2e", "#7c4dff"], emoji: "🌌" },
        { label: "Neon City", colors: ["#0f2027", "#00c6ff"], emoji: "🏙️" },
        { label: "Cherry Blossom", colors: ["#7c1c4e", "#ec4899"], emoji: "🌸" },
        { label: "Ocean Deep", colors: ["#021b79", "#0575e6"], emoji: "🌊" },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Premium Room Themes</Text>
          {themes.map((t) => (
            <TouchableOpacity key={t.label} activeOpacity={0.8}>
              <LinearGradient colors={t.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmThemeRow}>
                <Text style={{ fontSize: 28 }}>{t.emoji}</Text>
                <Text style={styles.mmThemeName}>{t.label}</Text>
                <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.7)" />
              </LinearGradient>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Upgrade Room</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── TUKTUK PASS ───────────────────────────────────────────────────────────
    if (label === "TukTuk Pass") {
      const benefits = ["Daily 50💎 for 7 days", "Exclusive pass holder frame", "Skip ads for 7 days", "Priority customer support", "Early access to new features"];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <LinearGradient colors={["#7c4dff", "#a855f7", "#ec4899"]} style={styles.mmPassCard}>
            <Text style={styles.mmPassTitle}>TUKTUK PASS</Text>
            <Text style={styles.mmPassPrice}>₹99 / week</Text>
            <Text style={styles.mmPassSub}>350💎 total value</Text>
          </LinearGradient>
          <Text style={styles.mmSectionLabel}>Pass Benefits</Text>
          {benefits.map((b) => (
            <View key={b} style={styles.mmPerkRow}>
              <Ionicons name="checkmark-circle" size={18} color="#a78bfa" />
              <Text style={styles.mmPerkText}>{b}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Text style={styles.mmPrimaryBtnText}>Get TukTuk Pass</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── LEVEL ─────────────────────────────────────────────────────────────────
    if (label === "Level") {
      const milestones = [
        { lv: 5, perk: "Custom nickname color" },
        { lv: 10, perk: "Profile animation unlock" },
        { lv: 20, perk: "Exclusive level badge" },
        { lv: 50, perk: "VIP room access" },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmLevelHero}>
            <LinearGradient colors={["#7c4dff", "#a855f7"]} style={styles.mmLevelBadge}>
              <Text style={styles.mmLevelNum}>1</Text>
            </LinearGradient>
            <Text style={styles.mmLevelTitle}>Level 1</Text>
            <Text style={styles.mmLevelXP}>0 / 200 XP to next level</Text>
            <View style={[styles.mmProgressBar, { width: "100%", marginTop: 10 }]}>
              <View style={[styles.mmProgressFill, { width: "3%" }]} />
            </View>
          </View>
          <Text style={styles.mmSectionLabel}>Level Milestones</Text>
          {milestones.map((m) => (
            <View key={m.lv} style={styles.mmTaskRow}>
              <LinearGradient colors={["#7c4dff", "#a855f7"]} style={styles.mmLevelPerkBadge}>
                <Text style={styles.mmLevelPerkNum}>Lv{m.lv}</Text>
              </LinearGradient>
              <Text style={[styles.mmTaskText, { flex: 1, marginLeft: 12 }]}>{m.perk}</Text>
              <Ionicons name="lock-closed" size={16} color="rgba(255,255,255,0.35)" />
            </View>
          ))}
        </ScrollView>
      );
    }

    // ── INSTAGRAM / FACEBOOK ──────────────────────────────────────────────────
    if (label === "Instagram" || label === "Facebook") {
      const isIG = label === "Instagram";
      return (
        <View style={styles.mmEmptyCenter}>
          <View style={[styles.mmSocialIconCircle, { backgroundColor: isIG ? "rgba(225,48,108,0.12)" : "rgba(24,119,242,0.12)" }]}>
            <Ionicons name={isIG ? "logo-instagram" : "logo-facebook"} size={56} color={isIG ? "#e1306c" : "#1877F2"} />
          </View>
          <Text style={styles.mmEmptyTitle}>Connect {label}</Text>
          <Text style={styles.mmEmptySub}>Link your {label} account to share your Tuk-Tuk profile and grow your audience.</Text>
          <TouchableOpacity style={styles.mmPrimaryBtn} activeOpacity={0.8}>
            <LinearGradient colors={isIG ? ["#f09433", "#e1306c"] : ["#1877F2", "#3b5998"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
              <Ionicons name={isIG ? "logo-instagram" : "logo-facebook"} size={16} color="white" />
              <Text style={[styles.mmPrimaryBtnText, { marginLeft: 8 }]}>Connect {label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      );
    }

    // ── SHARE ─────────────────────────────────────────────────────────────────
    if (label === "Share") {
      const options = [
        { icon: "logo-whatsapp", label: "WhatsApp", color: "#25D366" },
        { icon: "logo-twitter", label: "Twitter", color: "#1DA1F2" },
        { icon: "logo-instagram", label: "Instagram", color: "#e1306c" },
        { icon: "mail-outline", label: "Email", color: "#a78bfa" },
        { icon: "copy-outline", label: "Copy Link", color: "#60a5fa" },
        { icon: "share-social-outline", label: "More", color: "#fbbf24" },
      ];
      return (
        <View style={styles.mmScroll}>
          <Text style={styles.mmShareInvite}>Invite friends and earn 50💎 for each successful referral!</Text>
          <View style={styles.mmShareGrid}>
            {options.map((o) => (
              <TouchableOpacity key={o.label} style={styles.mmShareItem} activeOpacity={0.8}>
                <View style={[styles.mmShareIconCircle, { backgroundColor: o.color + "22" }]}>
                  <Ionicons name={o.icon} size={28} color={o.color} />
                </View>
                <Text style={styles.mmShareLabel}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // ── HELP ──────────────────────────────────────────────────────────────────
    if (label === "Help") {
      const faqs = [
        { q: "How do I match with someone?", a: "Enable Match switch in Settings and browse nearby profiles. Tap the heart to match!" },
        { q: "How do I earn diamonds?", a: "Complete daily tasks, login streaks, attend events, or purchase from the Store." },
        { q: "How do I report a user?", a: "Open the user's profile, tap the three-dot menu, then select Report. We review all reports within 24 hours." },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Frequently Asked Questions</Text>
          {faqs.map((f) => (
            <TouchableOpacity key={f.q} style={styles.mmFaqRow} activeOpacity={0.8} onPress={() => setExpandedFaqMM(expandedFaqMM === f.q ? null : f.q)}>
              <View style={styles.mmFaqQ}>
                <Ionicons name="help-circle" size={18} color="#a78bfa" />
                <Text style={styles.mmFaqQText}>{f.q}</Text>
                <Ionicons name={expandedFaqMM === f.q ? "chevron-up" : "chevron-down"} size={14} color="rgba(255,255,255,0.4)" />
              </View>
              {expandedFaqMM === f.q && <Text style={styles.mmFaqAText}>{f.a}</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.mmOutlineBtn, { marginTop: 20 }]} activeOpacity={0.8}>
            <Text style={styles.mmOutlineBtnText}>Contact Support</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    // ── ROOM BADGE ────────────────────────────────────────────────────────────
    if (label === "Room Badge") {
      const badges = [
        { emoji: "🎵", label: "Music Room", owned: true },
        { emoji: "👾", label: "Game Room", owned: false },
        { emoji: "🎤", label: "Karaoke", owned: true },
        { emoji: "📺", label: "Movie Night", owned: false },
        { emoji: "🎲", label: "Party Room", owned: false },
        { emoji: "🌟", label: "Star Room", owned: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Your Room Badges</Text>
          <View style={styles.mmBadgeGrid}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.mmBadgeItem, !b.owned && { opacity: 0.38 }]}>
                <View style={styles.mmBadgeCircle}><Text style={{ fontSize: 28 }}>{b.emoji}</Text></View>
                <Text style={styles.mmBadgeLabel}>{b.label}</Text>
                {b.owned && <View style={styles.mmBadgeOwned}><Text style={styles.mmBadgeOwnedText}>Owned</Text></View>}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // ── BADGE ─────────────────────────────────────────────────────────────────
    if (label === "Badge") {
      const badges = [
        { emoji: "🌟", label: "Early Adopter", owned: true },
        { emoji: "💬", label: "Chatterbox", owned: true },
        { emoji: "❤️", label: "Heartwarmer", owned: false },
        { emoji: "🔥", label: "On Fire", owned: false },
        { emoji: "🏆", label: "Champion", owned: false },
        { emoji: "🎯", label: "Sharpshooter", owned: false },
        { emoji: "🌈", label: "Colorful Soul", owned: false },
        { emoji: "👑", label: "Royalty", owned: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmBadgeProgress}>
            <Text style={styles.mmBadgeProgressText}>2 / 8 Badges Earned</Text>
          </View>
          <View style={styles.mmBadgeGrid}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.mmBadgeItem, !b.owned && { opacity: 0.35 }]}>
                <View style={styles.mmBadgeCircle}><Text style={{ fontSize: 28 }}>{b.emoji}</Text></View>
                <Text style={styles.mmBadgeLabel}>{b.label}</Text>
                {b.owned && <View style={styles.mmBadgeOwned}><Text style={styles.mmBadgeOwnedText}>Earned</Text></View>}
              </View>
            ))}
          </View>
        </ScrollView>
      );
    }

    // ── ROOM TITLE ────────────────────────────────────────────────────────────
    if (label === "Room Title") {
      const titles = [
        { label: "🎵 Music King", unlocked: true },
        { label: "🌟 Rising Star", unlocked: true },
        { label: "👑 Room Legend", unlocked: false },
        { label: "🔥 Party Animal", unlocked: false },
        { label: "💜 Purple Heart", unlocked: false },
      ];
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <Text style={styles.mmSectionLabel}>Select Room Title</Text>
          {titles.map((t) => (
            <View key={t.label} style={[styles.mmTitleRow, !t.unlocked && { opacity: 0.42 }]}>
              <Text style={styles.mmTitleLabel}>{t.label}</Text>
              {t.unlocked
                ? <TouchableOpacity style={styles.mmTitleSelectBtn} activeOpacity={0.8}><Text style={styles.mmTitleSelectText}>Use</Text></TouchableOpacity>
                : <Ionicons name="lock-closed" size={18} color="rgba(255,255,255,0.4)" />}
            </View>
          ))}
        </ScrollView>
      );
    }

    // ── FEEDBACK ──────────────────────────────────────────────────────────────
    if (label === "Feedback") {
      return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.mmScroll}>
          <View style={styles.mmFeedbackHero}>
            <Text style={{ fontSize: 48 }}>💬</Text>
            <Text style={styles.mmFeedbackTitle}>Share Your Thoughts</Text>
            <Text style={styles.mmFeedbackSub}>Help us improve Tuk-Tuk</Text>
          </View>
          {feedbackSentMM ? (
            <View style={styles.mmFeedbackSentBox}>
              <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
              <Text style={styles.mmFeedbackSentText}>Thank you!</Text>
              <Text style={styles.mmFeedbackSentSub}>We really appreciate your feedback.</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.mmFeedbackInput}
                placeholder="What's on your mind?"
                placeholderTextColor="rgba(255,255,255,0.35)"
                multiline
                numberOfLines={5}
                value={profileFeedback}
                onChangeText={setProfileFeedback}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.mmPrimaryBtn, !profileFeedback.trim() && { opacity: 0.4 }]}
                activeOpacity={0.8}
                disabled={!profileFeedback.trim()}
                onPress={() => {
                  setFeedbackSentMM(true);
                  setProfileFeedback("");
                  setTimeout(() => setFeedbackSentMM(false), 3000);
                }}
              >
                <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mmPrimaryBtnGrad}>
                  <Ionicons name="send" size={16} color="white" />
                  <Text style={[styles.mmPrimaryBtnText, { marginLeft: 8 }]}>Send Feedback</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      );
    }

    // ── DEFAULT FALLBACK ──────────────────────────────────────────────────────
    return (
      <View style={styles.mmEmptyCenter}>
        <Text style={{ fontSize: 48 }}>🚧</Text>
        <Text style={styles.mmEmptyTitle}>Coming Soon</Text>
        <Text style={styles.mmEmptySub}>This feature is under construction. Check back soon!</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />

      {/* Dark purple gradient background — same as login/home */}
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Pink orb — top left */}
      <View style={styles.orbPink} />
      {/* Purple orb — bottom right */}
      <View style={styles.orbPurple} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          {/* Diamond counter */}
          <TouchableOpacity style={styles.counterPill} activeOpacity={0.8}>
            <View style={styles.counterIconWrap}>
              <Text style={styles.counterEmoji}>💎</Text>
            </View>
            <Text style={styles.counterValue}>2</Text>
            <View style={styles.plusBtn}>
              <FontAwesome name="plus" size={10} color="white" />
            </View>
          </TouchableOpacity>

          {/* Coin counter */}
          <TouchableOpacity style={styles.counterPill} activeOpacity={0.8}>
            <View style={[styles.counterIconWrap, styles.coinIconWrap]}>
              <Text style={styles.counterEmoji}>🪙</Text>
            </View>
            <Text style={styles.counterValue}>0</Text>
            <View style={styles.plusBtn}>
              <FontAwesome name="plus" size={10} color="white" />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }} />

          {/* Settings */}
          <TouchableOpacity
            style={styles.settingsBtn}
            activeOpacity={0.8}
            onPress={() => router.push("/settings")}
          >
            <Ionicons name="settings-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── CHARACTER IMAGE ── */}
        <View style={styles.characterWrapper}>
          <Image
            source={meImg}
            style={styles.characterImg}
            resizeMode="contain"
          />

          {/* Strong bottom fade to hide legs */}
          <LinearGradient
            colors={["transparent", "rgba(13,6,24,0.85)", "#0d0618", "#0d0618"]}
            locations={[0, 0.5, 0.8, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.characterFade}
          />

          {/* Verify profile button — bottom right */}
          <TouchableOpacity style={styles.verifyBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={["#a78bfa", "#7c3aed"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyGradient}
            >
              <View style={styles.verifyMicCircle}>
                <FontAwesome5 name="microphone" size={14} color="white" />
              </View>
              <Text style={styles.verifyText}>Verify profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── PROFILE INFO CARD ── */}
        <View style={styles.infoCard}>

          {/* Top section: avatar left + name/id/badges right */}
          <View style={styles.profileTopSection}>

            {/* Avatar with frame */}
            <View style={styles.profilePicWrapper}>
              <Image source={avatarSource} style={styles.profilePic} />
              <Image source={frameImg} style={styles.profileFrame} resizeMode="contain" />
            </View>

            {/* Name + ID + badges */}
            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>{name}</Text>
                <TouchableOpacity style={styles.editBtn} activeOpacity={0.8} onPress={() => setEditVisible(true)}>
                  <FontAwesome name="pencil" size={13} color="#7c3aed" />
                  <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* ID + level badge inline */}
              <View style={styles.idRow}>
                <Text style={styles.userId}>ID: 167038</Text>
                <Image
                  source={require("../../assets/level/level1.png")}
                  style={styles.levelBadge}
                  resizeMode="contain"
                />
              </View>

              {/* Verified badge */}
              <Image
                source={require("../../assets/Batches/verified-batch.png")}
                style={styles.verifiedBadge}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{followers.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Visitor.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Visitor</Text>
            </View>
          </View>
        </View>

        {/* ── MENU GRID (sliding pages) ── */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Menu</Text>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
              setMenuPage(page);
            }}
          >
            {menuPages.map((page, pageIndex) => (
              <View key={pageIndex} style={styles.menuPage}>
                {/* Row 1 — items 0-3 */}
                <View style={styles.menuRow}>
                  {page.slice(0, 4).map((item) => (
                    <TouchableOpacity key={item.label} style={styles.menuGridItem} activeOpacity={0.7} onPress={() => setActiveMenu(item)}>
                      <View style={styles.menuIconBox}>
                        <FontAwesome5 name={item.icon} size={22} color="#a78bfa" solid />
                      </View>
                      <Text style={styles.menuGridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 2 — items 4-7 */}
                <View style={styles.menuRow}>
                  {page.slice(4, 8).map((item) => (
                    <TouchableOpacity key={item.label} style={styles.menuGridItem} activeOpacity={0.7} onPress={() => setActiveMenu(item)}>
                      <View style={styles.menuIconBox}>
                        <FontAwesome5 name={item.icon} size={22} color="#a78bfa" solid />
                      </View>
                      <Text style={styles.menuGridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
          {/* Page dots */}
          <View style={styles.menuDots}>
            {menuPages.map((_, i) => (
              <View key={i} style={[styles.menuDot, menuPage === i && styles.menuDotActive]} />
            ))}
          </View>
        </View>

        {/* ── BOTTOM TABS ── */}
        <View style={styles.bottomTabsBar}>
          {BOTTOM_TABS.map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.bottomTabItem}>
              <Text style={[styles.bottomTabText, activeTab === tab && styles.bottomTabActive]}>{tab}</Text>
              {activeTab === tab && <View style={styles.bottomTabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MOMENT CONTENT ── */}
        {activeTab === "Moment" && (
          <View style={styles.momentSection}>
            <TouchableOpacity style={styles.shareCard} activeOpacity={0.85}>
              <View style={styles.shareCardText}>
                <Text style={styles.shareCardTitle}>Share your moment today</Text>
                <Text style={styles.shareCardSub}>Your stories would gain more likes and friends.</Text>
              </View>
              <View style={styles.shareCardBtn}>
                <FontAwesome name="send" size={20} color="white" />
              </View>
            </TouchableOpacity>
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyText}>No moments yet</Text>
            </View>
          </View>
        )}

      </ScrollView>
      {/* ── MENU DETAIL MODAL ── */}
      <Modal visible={!!activeMenu} transparent animationType="slide" onRequestClose={() => setActiveMenu(null)}>
        <View style={styles.mmOverlay}>
          <TouchableOpacity style={styles.mmBackdrop} activeOpacity={1} onPress={() => setActiveMenu(null)} />
          <View style={styles.mmPanel}>
            <LinearGradient colors={["#1a0a2e", "#16082a", "#0d0618"]} style={StyleSheet.absoluteFill} />
            {/* Handle */}
            <View style={styles.mmHandle} />
            {/* Header */}
            <View style={styles.mmHeader}>
              <View style={styles.mmHeaderIcon}>
                <FontAwesome5 name={activeMenu?.icon} size={18} color="#a78bfa" solid />
              </View>
              <Text style={styles.mmHeaderTitle}>{activeMenu?.label}</Text>
              <TouchableOpacity style={styles.mmCloseBtn} onPress={() => setActiveMenu(null)} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.mmDivider} />
            {/* Dynamic content */}
            {renderMenuContent()}
          </View>
        </View>
      </Modal>

      {/* Edit modal */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Display name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.nameInput}
              maxLength={24}
            />

            <Text style={styles.sectionSmall}>Choose avatar</Text>
            <View style={styles.avatarRow}>
              {avatarOptions.map((id) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => setEditAvatarId(id)}
                  style={[
                    styles.avatarOption,
                    editAvatarId === id && styles.avatarSelected,
                  ]}
                >
                  <Image source={avatarMap[id]} style={styles.avatarThumb} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveProfile}
              >
                <Text style={[styles.modalBtnText, styles.saveBtnText]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  lavenderBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0d0618",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Background orbs
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: "rgba(255,0,128,0.15)",
    shadowColor: "#ff0080",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  orbPurple: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -120,
    right: -120,
    borderRadius: 175,
    backgroundColor: "rgba(138,43,226,0.18)",
    shadowColor: "#8a2be2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 8,
    gap: 10,
  },
  counterPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  counterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  coinIconWrap: {
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  counterEmoji: { fontSize: 15 },
  counterValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
    minWidth: 14,
    textAlign: "center",
  },
  plusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Character
  characterWrapper: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.42,
    overflow: "hidden",
    position: "relative",
  },
  characterImg: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85,
    alignSelf: "center",
    marginTop: -36,
  },
  characterFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 5,
  },
  verifyBtn: {
    position: "absolute",
    bottom: 170,
    right: 20,
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  verifyGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingLeft: 5,
    paddingRight: 12,
    gap: 6,
  },
  verifyMicCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },

  // Info card
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    marginTop: -160,
    backgroundColor: "rgba(56, 40, 66, 0.08)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    elevation: 1,
    zIndex: 10,
  },
  profileTopSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  profilePicWrapper: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profilePic: {
    width: 68,
    height: 68,
    borderRadius: 34,
    position: "absolute",
    zIndex: 1,
  },
  profileFrame: {
    width: 100,
    height: 90,
    position: "absolute",
    zIndex: 2,
  },
  profileInfoCol: {
    flex: 1,
    gap: 2,
  },
  profilePicRow: {}, // legacy — unused
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  userName: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    flex: 1,
    marginRight: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(124,77,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  editText: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "600",
  },
  idRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userId: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  levelBadge: {
    width: 36,
    height: 18,
  },
  verifiedBadge: {
    width: 90,
    height: 26,
    marginTop: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // Menu card (legacy)
  menuCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    elevation: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    gap: 14,
  },
  menuIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
  },

  // Sliding menu grid
  menuSection: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    paddingTop: 16,
    paddingBottom: 10,
  },
  menuTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  menuPage: {
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 4,
  },
  menuRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 4,
  },
  menuGridItem: {
    width: (SCREEN_WIDTH - 32) / 4,
    alignItems: "center",
    paddingVertical: 8,
  },
  menuIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  menuBadgeDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff3f72",
    borderWidth: 1.5,
    borderColor: "#0d0618",
  },
  menuGridLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    textAlign: "center",
    fontWeight: "500",
  },
  menuDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingBottom: 4,
  },
  menuDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  menuDotActive: {
    width: 20,
    backgroundColor: "#7c4dff",
  },

  // Bottom tabs
  bottomTabsBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  bottomTabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  bottomTabText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontWeight: "600",
  },
  bottomTabActive: {
    color: "white",
    fontWeight: "800",
  },
  bottomTabUnderline: {
    height: 3,
    width: "100%",
    backgroundColor: "#7c4dff",
    borderRadius: 2,
    marginTop: 6,
  },

  // Moment section
  momentSection: {
    paddingHorizontal: 16,
    gap: 14,
  },
  shareCard: {
    backgroundColor: "rgba(167,139,250,0.15)",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    gap: 12,
  },
  shareCardText: { flex: 1 },
  shareCardTitle: {
    color: "#c4b5fd",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  shareCardSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    lineHeight: 18,
  },
  shareCardBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyEmoji: { fontSize: 48 },
  emptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 14,
  },
  // Edit modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "rgba(13,6,24,0.95)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  modalTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 12,
  },
  nameInput: {
    backgroundColor: "rgba(255,255,255,0.03)",
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    marginBottom: 12,
  },
  sectionSmall: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  avatarOption: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarThumb: {
    width: 52,
    height: 52,
    resizeMode: "cover",
  },
  avatarSelected: {
    borderColor: "#7c3aed",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  modalBtnText: {
    color: "white",
    fontWeight: "700",
  },
  saveBtn: {
    backgroundColor: "#7c3aed",
  },
  saveBtnText: {
    color: "white",
  },

  // ── MENU MODAL SHELL ───────────────────────────────────────────────────────
  mmOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  mmBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  mmPanel: {
    height: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.35)",
  },
  mmHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  mmHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 12,
  },
  mmHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  mmHeaderTitle: {
    flex: 1,
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mmCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  mmDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 16,
    marginBottom: 4,
  },

  // ── SHARED MM COMPONENTS ──────────────────────────────────────────────────
  mmScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  mmSectionLabel: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 10,
  },
  mmPrimaryBtn: {
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 16,
    alignSelf: "stretch",
  },
  mmPrimaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  mmPrimaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  mmOutlineBtn: {
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
    backgroundColor: "rgba(124,77,255,0.1)",
    alignSelf: "stretch",
  },
  mmOutlineBtnText: {
    color: "#a78bfa",
    fontSize: 15,
    fontWeight: "700",
    alignSelf: "center",
    alignItems: "center",
  },
  mmSmallBtn: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  mmSmallBtnText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  mmInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    justifyContent: "center",
  },
  mmInfoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  mmPerkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  mmPerkText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    flex: 1,
  },
  mmProgressCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmProgressLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mmProgressTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  mmProgressVal: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "700",
  },
  mmProgressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  mmProgressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#7c4dff",
  },
  mmTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  mmTaskCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(167,139,250,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  mmTaskCheckDone: {
    backgroundColor: "#7c4dff",
    borderColor: "#7c4dff",
  },
  mmTaskText: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },
  mmTaskTextDone: {
    color: "rgba(255,255,255,0.35)",
    textDecorationLine: "line-through",
  },
  mmTaskReward: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  mmEmptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  mmEmptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  mmEmptySub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  mmFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  mmFeatureLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── GET REWARDS ───────────────────────────────────────────────────────────
  mmHeroBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    marginBottom: 4,
  },
  mmHeroTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  mmHeroSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
  },
  mmDayGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "center",
    marginVertical: 16,
  },
  mmDayCell: {
    width: 44,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmDayCellActive: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderColor: "#7c4dff",
  },
  mmDayCellClaimed: {
    backgroundColor: "rgba(74,222,128,0.08)",
    borderColor: "rgba(74,222,128,0.2)",
  },
  mmDayName: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 10,
    fontWeight: "700",
  },
  mmDayVal: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },

  // ── MONTHLY CARD / PASS ────────────────────────────────────────────────────
  mmCardHero: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
  },
  mmCardHeroLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  mmCardHeroPrice: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
  mmCardHeroSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  mmPassCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 6,
  },
  mmPassTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  mmPassPrice: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
  },
  mmPassSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },

  // ── STORE ─────────────────────────────────────────────────────────────────
  mmStoreGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  mmStoreItem: {
    width: "30%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    position: "relative",
  },
  mmStoreTag: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#ec4899",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mmStoreTagText: {
    color: "white",
    fontSize: 8,
    fontWeight: "800",
  },
  mmStoreLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  mmStorePriceBtn: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  mmStorePriceText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },

  // ── RELATIONSHIP ──────────────────────────────────────────────────────────
  mmRelCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
  },
  mmRelTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  mmRelSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  mmBFFCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmBFFTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  mmBFFSub: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },

  // ── WALLET ────────────────────────────────────────────────────────────────
  mmWalletCard: {
    borderRadius: 20,
    padding: 24,
    gap: 8,
    alignItems: "center",
  },
  mmWalletLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  mmWalletBalRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  mmWalletAmount: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  mmWalletTopUp: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  mmWalletTopUpText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  mmTxnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  mmTxnLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
  },
  mmTxnDate: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    marginTop: 2,
  },
  mmTxnAmount: {
    fontSize: 15,
    fontWeight: "800",
  },

  // ── PREMIUM ───────────────────────────────────────────────────────────────
  mmPremiumHero: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 8,
  },
  mmPremiumHeroTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  mmPremiumHeroSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },

  // ── VIP ───────────────────────────────────────────────────────────────────
  mmVIPCurrentBox: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  mmVIPCurrentLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  mmVIPCurrentVal: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mmVIPCurrentSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
  },
  mmVIPTier: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
  mmVIPTierName: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  mmVIPTierReq: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },

  // ── HONOR LEVEL ───────────────────────────────────────────────────────────
  mmHonorHero: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmHonorLevel: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  mmHonorXP: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },

  // ── MATCHMAKER ────────────────────────────────────────────────────────────
  mmMatchCard: {
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 20,
  },
  mmMatchCardGrad: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  mmMatchAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.35)",
    marginBottom: 4,
  },
  mmMatchName: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  mmMatchLocation: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  mmMatchTags: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  mmMatchTag: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mmMatchTagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  mmMatchActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 8,
  },
  mmMatchBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── BACKPACK ──────────────────────────────────────────────────────────────
  mmBackpackGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  mmBackpackItem: {
    width: "30%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmBackpackLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 6,
  },
  mmBackpackBadge: {
    backgroundColor: "#7c4dff",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mmBackpackBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },
  mmBackpackEmpty: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    fontWeight: "600",
  },

  // ── ROOM PREMIUM ─────────────────────────────────────────────────────────
  mmThemeRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    gap: 14,
  },
  mmThemeName: {
    flex: 1,
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── LEVEL ─────────────────────────────────────────────────────────────────
  mmLevelHero: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmLevelBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  mmLevelNum: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
  },
  mmLevelTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mmLevelXP: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  mmLevelPerkBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  mmLevelPerkNum: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },

  // ── SOCIAL CONNECT ────────────────────────────────────────────────────────
  mmSocialIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  // ── SHARE ─────────────────────────────────────────────────────────────────
  mmShareInvite: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  mmShareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    gap: 16,
  },
  mmShareItem: {
    alignItems: "center",
    gap: 8,
  },
  mmShareIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  mmShareLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
  },

  // ── HELP / FAQ ────────────────────────────────────────────────────────────
  mmFaqRow: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    marginBottom: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  mmFaqQ: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  mmFaqQText: {
    flex: 1,
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  mmFaqAText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  // ── BADGES ────────────────────────────────────────────────────────────────
  mmBadgeProgress: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.25)",
  },
  mmBadgeProgressText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  mmBadgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  mmBadgeItem: {
    width: "30%",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 4,
  },
  mmBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(124,77,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  mmBadgeLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  mmBadgeOwned: {
    backgroundColor: "#7c4dff",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  mmBadgeOwnedText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
  },

  // ── ROOM TITLE ────────────────────────────────────────────────────────────
  mmTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mmTitleLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  mmTitleSelectBtn: {
    backgroundColor: "rgba(124,77,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  mmTitleSelectText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },

  // ── FEEDBACK ──────────────────────────────────────────────────────────────
  mmFeedbackHero: {
    alignItems: "center",
    gap: 6,
    marginBottom: 18,
  },
  mmFeedbackTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  mmFeedbackSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
  },
  mmFeedbackInput: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 14,
    color: "white",
    fontSize: 14,
    minHeight: 110,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    marginBottom: 4,
  },
  mmFeedbackSentBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 24,
  },
  mmFeedbackSentText: {
    color: "#4ade80",
    fontSize: 20,
    fontWeight: "900",
  },
  mmFeedbackSentSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
  },
});
