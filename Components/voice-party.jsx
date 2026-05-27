import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import { useRouter } from "expo-router";
import { followUser, unfollowUser } from "../src/api/relationshipApi";
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  Power,
  Plus,
  Mic,
  MicOff,
  Smile,
  MessageSquare,
  Volume2,
  LayoutGrid,
  MessageCircle,
  AlertCircle,
  Ban,
  Crown,
  Sparkles,
  Minimize2,
  Play,
} from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");

const micSeats = [
  { id: 1, user: null, locked: true },
  {
    id: 2,
    user: {
      name: "nobby",
      avatar: "https://randomuser.me/api/portraits/men/11.jpg",
      badge: "🍁",
      active: false,
    },
  },
  { id: 3, user: null },
  {
    id: 4,
    user: {
      name: "doremon",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      badge: "💗",
    },
  },
  {
    id: 5,
    user: {
      name: "Broken 💔...",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      badge: "💗",
    },
  },
  { id: 6, user: null },
  { id: 7, user: null },
  { id: 8, user: null },
  { id: 9, user: null },
  { id: 10, user: null },
];

const initialMessages = [
  {
    id: 1,
    system: true,
    text: "🔥 • T|O|M • 🔥 cleaned the chat",
  },
  {
    id: 2,
    user: "ziddi_shehzadi_99",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    level: 6,
    text: "hmm",
    coins: 0,
    diamonds: 4,
  },
  {
    id: 3,
    user: "Broken 💔",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    level: 4,
    text: "hello everyone 👋",
    coins: 2,
    diamonds: 1,
  },
  {
    id: 4,
    user: "T|O|M",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    level: 8,
    text: "welcome to the room 🎉",
    coins: 5,
    diamonds: 3,
  },
];

const audienceAvatars = [
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/55.jpg",
  "https://randomuser.me/api/portraits/women/66.jpg",
];

const SEAT_SIZE = (W - 32 - 40) / 5;
const GIFT_CARD_W = (W - 32) / 4 - 6;

const giftItems = [
  { id: 1, name: "Cricket Gift",    price: 3077,   emoji: "🎁",  hot: true },
  { id: 2, name: "Glory Chest",     price: 7777,   emoji: "📦",  hot: false },
  { id: 3, name: "Champion Cup",    price: 60777,  emoji: "🏆",  hot: false },
  { id: 4, name: "Carnival",        price: 357777, emoji: "🎪",  hot: false },
  { id: 5, name: "Glory Crown",     price: 137777, emoji: "👑",  hot: false },
  { id: 6, name: "Shared Trophy",   price: 10777,  emoji: "🥇",  hot: false },
  { id: 7, name: "Stadium Fire",    price: 1777,   emoji: "🔥",  hot: false },
  { id: 8, name: "Serenade",        price: 87777,  emoji: "🎆",  hot: false },
];

const randomGiftOrbs = [
  { id: 1, price: 1777,  emoji: "🔮" },
  { id: 2, price: 3077,  emoji: "🔮" },
  { id: 3, price: 4777,  emoji: "🔮" },
  { id: 4, price: 7777,  emoji: "🔮" },
  { id: 5, price: 27777, emoji: "🔮" },
];

const activityEvents = ["Flamenco Fantasy", "Ethereal Ring", "TukTuk Carnival"];

const activityGiftsByEvent = {
  "Flamenco Fantasy": [
    { id: "af1", name: "Confession",      price: 9,       emoji: "💐" },
    { id: "af2", name: "Crimson Bloom",   price: 39,      emoji: "🌺" },
    { id: "af3", name: "Heart Choker",    price: 17,      emoji: "💝" },
    { id: "af4", name: "Grand Yacht",     price: 1077777, emoji: "🛥️" },
    { id: "af5", name: "Vermilion Silk",  price: 70777,   emoji: "🎀" },
    { id: "af6", name: "Jade Grace",      price: 8777,    emoji: "💚" },
    { id: "af7", name: "Scarlet Elegance",price: 3577,    emoji: "🥀" },
  ],
  "Ethereal Ring": [
    { id: "ae1", name: "Crystal Ring",   price: 777,    emoji: "💍" },
    { id: "ae2", name: "Moonstone",      price: 4777,   emoji: "🌙" },
    { id: "ae3", name: "Stardust",       price: 9777,   emoji: "⭐" },
    { id: "ae4", name: "Aurora",         price: 27777,  emoji: "🌈" },
    { id: "ae5", name: "Nebula",         price: 57777,  emoji: "🔮" },
    { id: "ae6", name: "Celestial",      price: 107777, emoji: "✨" },
    { id: "ae7", name: "Cosmic Ring",    price: 357777, emoji: "💫" },
  ],
  "TukTuk Carnival": [
    { id: "ac1", name: "Confetti",       price: 99,     emoji: "🎊" },
    { id: "ac2", name: "Carnival Box",   price: 999,    emoji: "🎪" },
    { id: "ac3", name: "Lucky Drum",     price: 3077,   emoji: "🥁" },
    { id: "ac4", name: "Firecracker",    price: 7777,   emoji: "🎆" },
    { id: "ac5", name: "Gold Elephant",  price: 37777,  emoji: "🐘" },
    { id: "ac6", name: "Royal Float",    price: 77777,  emoji: "👑" },
    { id: "ac7", name: "Festival Crown", price: 207777, emoji: "🎭" },
  ],
};

const specialGifts = [
  { id: "sp1",  name: "Star Flower",     price: 199,     emoji: "🌸",  isNew: true  },
  { id: "sp2",  name: "Love Spark",      price: 499,     emoji: "💖",  isNew: true  },
  { id: "sp3",  name: "Magic Lantern",   price: 1499,    emoji: "🏮",  isNew: false },
  { id: "sp4",  name: "Dragon Scale",    price: 3999,    emoji: "🐉",  isNew: false },
  { id: "sp5",  name: "Phoenix Flame",   price: 9999,    emoji: "🔥",  isNew: false },
  { id: "sp6",  name: "Sakura Storm",    price: 19999,   emoji: "🌸",  isNew: false },
  { id: "sp7",  name: "Golden Torii",    price: 49999,   emoji: "⛩️", isNew: false },
  { id: "sp8",  name: "TukTuk Special",  price: 99999,   emoji: "🛺",  isNew: true  },
  { id: "sp9",  name: "Diamond Lotus",   price: 199999,  emoji: "💠",  isNew: false },
  { id: "sp10", name: "Emperor Gift",    price: 499999,  emoji: "🏯",  isNew: false },
  { id: "sp11", name: "Celestial Fox",   price: 777777,  emoji: "🦊",  isNew: false },
  { id: "sp12", name: "Cosmic Gem",      price: 1077777, emoji: "💎",  isNew: false },
];

const vipGifts = [
  { id: "vip1", name: "VIP Throne",   price: 9999,    emoji: "🪑" },
  { id: "vip2", name: "Gold Armor",   price: 19999,   emoji: "🛡️" },
  { id: "vip3", name: "Royal Sword",  price: 49999,   emoji: "⚔️" },
  { id: "vip4", name: "Divine Halo",  price: 99999,   emoji: "😇" },
  { id: "vip5", name: "Titan's Fist", price: 199999,  emoji: "✊" },
  { id: "vip6", name: "Sacred Lotus", price: 399999,  emoji: "🪷" },
  { id: "vip7", name: "Galaxy Ship",  price: 777777,  emoji: "🚀" },
  { id: "vip8", name: "God's Eye",    price: 1077777, emoji: "👁️" },
];

const intimacyVideos = [
  { id: "iv1", name: "Moment 1", uri: require("../assets/videos/v1.mp4"), colors: ["#4a1080", "#7c4dff"] },
  { id: "iv2", name: "Moment 2", uri: require("../assets/videos/v2.mp4"), colors: ["#0d2952", "#4a6cf7"] },
  { id: "iv3", name: "Moment 3", uri: require("../assets/videos/v3.mp4"), colors: ["#4a0a28", "#c2185b"] },
  { id: "iv4", name: "Moment 4", uri: require("../assets/videos/v4.mp4"), colors: ["#0a2010", "#2e7d32"] },
  { id: "iv5", name: "Moment 5", uri: require("../assets/videos/v5.mp4"), colors: ["#3d1800", "#e65100"] },
  { id: "iv6", name: "Moment 6", uri: require("../assets/videos/v6.mp4"), colors: ["#2a0a3e", "#9c27b0"] },
];

const roomOwner = {
  name: "demouser",
  id: "893429426",
  avatar: "https://randomuser.me/api/portraits/men/32.jpg",
};

export default function VoiceParty() {
  const router = useRouter();
  const [messages, setMessages] = useState(initialMessages);
  const [inputText, setInputText] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showPlayCenter, setShowPlayCenter] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [showBackpack, setShowBackpack] = useState(false);
  const [backpackMainTab, setBackpackMainTab] = useState("Backpack");
  const [backpackSubTab, setBackpackSubTab] = useState("Gift");
  const [selectedGift, setSelectedGift] = useState(null);
  const [giftQty, setGiftQty] = useState(1);
  const [activityEvent, setActivityEvent] = useState("Flamenco Fantasy");
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);

  const videoPlayer = useVideoPlayer(null, (p) => { p.loop = false; });

  useEffect(() => {
    if (showVideoModal && currentVideo) {
      videoPlayer.replace(currentVideo.uri);
      videoPlayer.play();
    } else {
      videoPlayer.pause();
    }
  }, [showVideoModal, currentVideo?.id]);
  const [emojiTab, setEmojiTab] = useState("😊");
  const [showChatInput, setShowChatInput] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser(roomOwner.id);
      } else {
        await followUser(roomOwner.id);
      }
      setIsFollowing((v) => !v);
    } catch (err) {
      Alert.alert(
        isFollowing ? "Unfollow failed" : "Follow failed",
        err.message || "Please try again."
      );
    } finally {
      setFollowLoading(false);
    }
  };
  const [shareTab, setShareTab] = useState("Recently");
  const scrollRef = useRef(null);

  const shareTabs = ["Recently", "Friends", "Followers", "Room Followers"];

  const sharePlatforms = [
    { label: "Moment",    bg: "#7c4dff", icon: "🪐" },
    { label: "Facebook",  bg: "#1877f2", icon: "f" },
    { label: "Instagram", bg: "#e1306c", icon: "📸" },
    { label: "WhatsApp",  bg: "#25d366", icon: "💬" },
  ];

  const emojiCategories = [
    {
      tab: "😊",
      emojis: ["😊","😂","🤣","😍","🥰","😘","😎","🤩","😜","🤪","😏","🥳","😇","🤗","😴","🥺","😭","😤","🤬","😱","🤯","🥶","🤮","😵","🤠","👻","💀","🤡","👽","🤖"],
    },
    {
      tab: "❤️",
      emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟","♥️","🔥","✨","💫","⭐","🌟","💥","🎉","🎊","🎈","🎁","🏆"],
    },
    {
      tab: "👋",
      emojis: ["👋","🤚","🖐️","✋","🖖","👌","🤌","🤏","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","🤲","🙏","💪"],
    },
    {
      tab: "🌹",
      emojis: ["🌹","🌸","🌺","🌻","🌼","💐","🌷","🍀","🌿","🍃","🌱","🌲","🌳","🌴","🍁","🍂","🍄","🌾","🌵","🎋","🎍","🍇","🍓","🍒","🍑","🥭","🍍","🥥","🍌","🍋"],
    },
    {
      tab: "🎵",
      emojis: ["🎵","🎶","🎸","🎹","🎺","🎻","🥁","🎷","🎤","🎧","🎼","🎙️","📻","🎮","🕹️","🎲","🎯","🎳","🎰","🃏","🀄","🎭","🎨","🖼️","🎬","🎥","📽️","🎞️","📺","📷"],
    },
  ];



  const moreMenuItems = [
    {
      icon: <MessageCircle size={22} color="#a78bfa" />,
      label: "Feedback",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Feedback", "Thank you for your feedback!");
      },
    },
    {
      icon: <AlertCircle size={22} color="#a78bfa" />,
      label: "Report",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Report", "Room has been reported.");
      },
    },
    {
      icon: <Ban size={22} color="#a78bfa" />,
      label: "Block",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Block", "User has been blocked.");
      },
    },
    {
      icon: <Crown size={22} color="#a78bfa" />,
      label: "Room Premium",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Room Premium", "Upgrade to Room Premium!");
      },
    },
    {
      icon: <Sparkles size={22} color="#a78bfa" />,
      label: "Effect Settings",
      onPress: () => {
        setShowMoreMenu(false);
        Alert.alert("Effect Settings", "Effect settings coming soon.");
      },
    },
  ];

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: "You",
        avatar: "https://randomuser.me/api/portraits/men/32.jpg",
        level: 3,
        text: inputText.trim(),
        coins: 0,
        diamonds: 0,
      },
    ]);
    setInputText("");
    setShowChatInput(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── VIDEO PLAYER MODAL ── */}
      <Modal
        visible={showVideoModal}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setShowVideoModal(false); setCurrentVideo(null); }}
      >
        <View style={styles.videoPlayerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="black" />

          {/* Header */}
          <View style={styles.videoHeader}>
            <TouchableOpacity
              style={styles.videoCloseBtn}
              onPress={() => { setShowVideoModal(false); setCurrentVideo(null); }}
            >
              <Text style={styles.videoCloseBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.videoHeaderTitle} numberOfLines={1}>
              {currentVideo?.name ?? ""}
            </Text>
            <View style={{ width: 42 }} />
          </View>

          {/* Video */}
          <View style={styles.videoWrapper}>
            <VideoView
              player={videoPlayer}
              style={styles.videoPlayer}
              nativeControls
              allowsFullscreen
              contentFit="contain"
            />
          </View>
        </View>
      </Modal>

      {/* ── BACKPACK MODAL ── */}
      <Modal
        visible={showBackpack}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBackpack(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowBackpack(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.backpackBox}>
            <View style={{ height: H * 0.82 }}>
            {/* Handle */}
            <View style={styles.shareHandle} />

            {/* Promo banner */}
            <LinearGradient
              colors={["#3b0f6e", "#7c4dff", "#5c1fa8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bpBanner}
            >
              <Text style={styles.bpBannerGift}>🎁</Text>
              <Text style={styles.bpBannerText}>Get newbie bonus, recharge for free lottery.</Text>
              <TouchableOpacity style={styles.bpBannerArrow} activeOpacity={0.8}>
                <Text style={styles.bpBannerArrowText}>›</Text>
              </TouchableOpacity>
              <View style={styles.bpPkBadge}>
                <Text style={styles.bpPkBadgeText}>🏆 Room PK Challenge</Text>
              </View>
            </LinearGradient>

            {/* Currency row */}
            <View style={styles.bpCurrencyRow}>
              <TouchableOpacity style={styles.bpCurrencyItem} activeOpacity={0.8}>
                <Text style={styles.bpDiamondIcon}>💎</Text>
                <Text style={styles.bpCurrencyVal}>2</Text>
                <Text style={styles.bpCurrencyChev}> ›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bpCurrencyItem} activeOpacity={0.8}>
                <Text style={styles.bpCoinIcon}>🪙</Text>
                <Text style={styles.bpCurrencyVal}>0</Text>
                <Text style={styles.bpCurrencyChev}> ›</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bpGetListBtn} activeOpacity={0.8}>
                <Text style={styles.bpGetListText}>Get on the list</Text>
              </TouchableOpacity>
            </View>

            {/* Main tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.bpMainTabScroll}
              contentContainerStyle={styles.bpMainTabContent}
            >
              {["Backpack", "Gift", "Activity", "Relationship", "Special", "VIP", "Rank"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.bpMainTabItem}
                  activeOpacity={0.8}
                  onPress={() => { setBackpackMainTab(tab); setSelectedGift(null); }}
                >
                  <Text style={[styles.bpMainTabText, backpackMainTab === tab && styles.bpMainTabTextActive]}>
                    {tab}
                  </Text>
                  {backpackMainTab === tab && <View style={styles.bpMainTabUnderline} />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* ── GIFT TAB ── */}
            {backpackMainTab === "Gift" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  {/* Random gifts row */}
                  <View style={styles.bpRandomRow}>
                    <LinearGradient
                      colors={["#4a1080", "#7c4dff"]}
                      style={styles.bpRandomBox}
                    >
                      <Text style={styles.bpRandomBoxEmoji}>🎲</Text>
                      <Text style={styles.bpRandomBoxLabel}>Random{"\n"}gifts</Text>
                    </LinearGradient>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                      {randomGiftOrbs.map((orb) => (
                        <TouchableOpacity
                          key={orb.id}
                          style={styles.bpOrbWrap}
                          activeOpacity={0.8}
                          onPress={() => setSelectedGift({ id: `r${orb.id}`, name: "Random Gift", price: orb.price, emoji: orb.emoji })}
                        >
                          <LinearGradient colors={["#2a1060", "#5c2daf"]} style={styles.bpOrbCircle}>
                            <Text style={styles.bpOrbEmoji}>{orb.emoji}</Text>
                          </LinearGradient>
                          <Text style={styles.bpOrbPrice}>💎 {orb.price.toLocaleString()}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Event banner */}
                  <LinearGradient
                    colors={["#1a0a2e", "#2d1060", "#1a0a2e"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpEventBanner}
                  >
                    <Text style={styles.bpEventIcon}>✨</Text>
                    <Text style={styles.bpEventText}>2026 TukTuk Carnival</Text>
                    <View style={styles.bpEventArrow}>
                      <Text style={styles.bpEventArrowText}>›</Text>
                    </View>
                  </LinearGradient>

                  {/* Gift grid */}
                  <View style={styles.bpGiftGrid}>
                    {giftItems.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={[styles.bpGiftCard, selectedGift?.id === gift.id && styles.bpGiftCardSelected]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGift(gift)}
                      >
                        {gift.hot && (
                          <View style={styles.bpHotBadge}>
                            <Text style={styles.bpHotText}>HOT</Text>
                          </View>
                        )}
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {gift.price.toLocaleString()}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Send bar */}
                <View style={styles.bpSendBar}>
                  <Image
                    source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                    style={styles.bpSendAvatar}
                  />
                  <TouchableOpacity style={styles.bpSendRecipient} activeOpacity={0.8}>
                    <Text style={styles.bpSendHeart}>❤️ </Text>
                    <Text style={styles.bpSendName}>{roomOwner.name}</Text>
                    <Text style={styles.bpSendChev}> ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendQtyBtn}
                    activeOpacity={0.8}
                    onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
                  >
                    <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (selectedGift) {
                        Alert.alert("Gift Sent! 🎁", `You sent ${giftQty}x ${selectedGift.name}!`);
                        setSelectedGift(null);
                        setGiftQty(1);
                      } else {
                        Alert.alert("Select a gift", "Tap any gift to select it first.");
                      }
                    }}
                  >
                    <Text style={styles.bpSendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── BACKPACK TAB ── */}
            {backpackMainTab === "Backpack" && (
              <View style={{ flex: 1 }}>
                <View style={styles.bpSubTabRow}>
                  {["Gift", "Property", "Ring", "Resource"].map((sub) => (
                    <TouchableOpacity
                      key={sub}
                      style={[styles.bpSubTabItem, backpackSubTab === sub && styles.bpSubTabItemActive]}
                      activeOpacity={0.8}
                      onPress={() => setBackpackSubTab(sub)}
                    >
                      <Text style={[styles.bpSubTabText, backpackSubTab === sub && styles.bpSubTabTextActive]}>
                        {sub}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.bpEmptyState}>
                  <Text style={styles.bpEmptyEmoji}>🎒</Text>
                  <Text style={styles.bpEmptyText}>Your backpack is empty.</Text>
                </View>
              </View>
            )}

            {/* ── ACTIVITY TAB ── */}
            {backpackMainTab === "Activity" && (
              <View style={{ flex: 1 }}>
                {/* Event sub-tabs */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.bpActEventScroll}
                  contentContainerStyle={styles.bpActEventContent}
                >
                  {activityEvents.map((ev) => (
                    <TouchableOpacity
                      key={ev}
                      style={[styles.bpActEventTab, activityEvent === ev && styles.bpActEventTabActive]}
                      activeOpacity={0.8}
                      onPress={() => { setActivityEvent(ev); setSelectedGift(null); }}
                    >
                      <Text style={[styles.bpActEventText, activityEvent === ev && styles.bpActEventTextActive]}>
                        {ev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Gift grid */}
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {(activityGiftsByEvent[activityEvent] || []).map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={[styles.bpGiftCard, selectedGift?.id === gift.id && styles.bpGiftCardSelected]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGift(gift)}
                      >
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#2a0d50", "#4a1d80"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {gift.price.toLocaleString()}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Send bar */}
                <View style={styles.bpSendBar}>
                  <Image
                    source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                    style={styles.bpSendAvatar}
                  />
                  <TouchableOpacity style={styles.bpSendRecipient} activeOpacity={0.8}>
                    <Text style={styles.bpSendHeart}>❤️ </Text>
                    <Text style={styles.bpSendName}>{roomOwner.name}</Text>
                    <Text style={styles.bpSendChev}> ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendQtyBtn}
                    activeOpacity={0.8}
                    onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
                  >
                    <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (selectedGift) {
                        Alert.alert("Gift Sent! 🎁", `You sent ${giftQty}x ${selectedGift.name}!`);
                        setSelectedGift(null);
                        setGiftQty(1);
                      } else {
                        Alert.alert("Select a gift", "Tap any gift to select it first.");
                      }
                    }}
                  >
                    <Text style={styles.bpSendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── RELATIONSHIP TAB ── */}
            {backpackMainTab === "Relationship" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {intimacyVideos.map((video, idx) => (
                      <TouchableOpacity
                        key={video.id}
                        style={[styles.bpGiftCard, selectedGift?.id === video.id && styles.bpGiftCardSelected]}
                        activeOpacity={0.85}
                        onPress={() => { setSelectedGift(video); setCurrentVideo(video); setShowVideoModal(true); }}
                      >
                        {/* Gradient thumbnail */}
                        <LinearGradient
                          colors={video.colors}
                          style={styles.bpVideoThumb}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          {/* Video number badge */}
                          <View style={styles.bpVideoNumBadge}>
                            <Text style={styles.bpVideoNumText}>{idx + 1}</Text>
                          </View>
                          {/* Play circle */}
                          <View style={styles.bpVideoPlayCircle}>
                            <Play size={22} color="white" fill="white" />
                          </View>
                          {/* Shimmer dots */}
                          <View style={styles.bpVideoShimmerWrap}>
                            <Text style={styles.bpVideoShimmerText}>✦ ✦ ✦</Text>
                          </View>
                        </LinearGradient>

                        <Text style={styles.bpGiftName} numberOfLines={1}>{video.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpVideoTagText}>🎬 Video</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>

                {/* Send bar */}
                <View style={styles.bpSendBar}>
                  <Image
                    source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                    style={styles.bpSendAvatar}
                  />
                  <TouchableOpacity style={styles.bpSendRecipient} activeOpacity={0.8}>
                    <Text style={styles.bpSendHeart}>❤️ </Text>
                    <Text style={styles.bpSendName}>{roomOwner.name}</Text>
                    <Text style={styles.bpSendChev}> ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendQtyBtn}
                    activeOpacity={0.8}
                    onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
                  >
                    <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (currentVideo) {
                        setShowVideoModal(true);
                      } else {
                        Alert.alert("Select a video", "Tap any video to play it.");
                      }
                    }}
                  >
                    <Text style={styles.bpSendBtnText}>Play</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── SPECIAL TAB ── */}
            {backpackMainTab === "Special" && (
              <View style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {specialGifts.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={[styles.bpGiftCard, selectedGift?.id === gift.id && styles.bpGiftCardSelected]}
                        activeOpacity={0.8}
                        onPress={() => setSelectedGift(gift)}
                      >
                        {gift.isNew && (
                          <View style={styles.bpNewBadge}>
                            <Text style={styles.bpNewBadgeText}>NEW</Text>
                          </View>
                        )}
                        <View style={styles.bpGiftSendBtn}>
                          <Text style={{ fontSize: 9 }}>🎁</Text>
                        </View>
                        <LinearGradient colors={["#1a0a3e", "#6a1590"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpGiftPriceText}>💎 {gift.price.toLocaleString()}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={styles.bpSendBar}>
                  <Image
                    source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
                    style={styles.bpSendAvatar}
                  />
                  <TouchableOpacity style={styles.bpSendRecipient} activeOpacity={0.8}>
                    <Text style={styles.bpSendHeart}>❤️ </Text>
                    <Text style={styles.bpSendName}>{roomOwner.name}</Text>
                    <Text style={styles.bpSendChev}> ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bpSendQtyBtn}
                    activeOpacity={0.8}
                    onPress={() => setGiftQty((q) => (q < 99 ? q + 1 : 1))}
                  >
                    <Text style={styles.bpSendQtyText}>{giftQty} ▼</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.bpSendBtn, !selectedGift && { opacity: 0.5 }]}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!selectedGift) Alert.alert("Select a gift", "Tap any gift to select it first.");
                    }}
                  >
                    <Text style={styles.bpSendBtnText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── VIP TAB ── */}
            {backpackMainTab === "VIP" && (
              <View style={{ flex: 1 }}>
                <View style={styles.bpVipBanner}>
                  <LinearGradient
                    colors={["#3d1a00", "#8b5e00", "#3d1a00"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpVipBannerGrad}
                  >
                    <Text style={styles.bpVipBannerIcon}>👑</Text>
                    <Text style={styles.bpVipBannerText}>Exclusive VIP Gifts — Upgrade to unlock</Text>
                  </LinearGradient>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                  <View style={styles.bpGiftGrid}>
                    {vipGifts.map((gift) => (
                      <TouchableOpacity
                        key={gift.id}
                        style={styles.bpGiftCard}
                        activeOpacity={0.85}
                        onPress={() => Alert.alert("VIP Exclusive 👑", "Upgrade to VIP to unlock and send this gift.")}
                      >
                        <LinearGradient colors={["#2a1800", "#5c3a00"]} style={styles.bpGiftEmojiWrap}>
                          <Text style={styles.bpGiftEmoji}>{gift.emoji}</Text>
                        </LinearGradient>
                        <Text style={styles.bpGiftName} numberOfLines={1}>{gift.name}</Text>
                        <View style={styles.bpGiftPriceRow}>
                          <Text style={styles.bpVipPriceText}>💎 {gift.price.toLocaleString()}</Text>
                        </View>
                        {/* Lock overlay */}
                        <View style={styles.bpVipLockOverlay}>
                          <View style={styles.bpVipLockCircle}>
                            <Text style={styles.bpVipLockEmoji}>🔒</Text>
                          </View>
                          <View style={styles.bpVipTag}>
                            <Text style={styles.bpVipTagText}>VIP</Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <View style={styles.bpVipUpgradeBar}>
                  <LinearGradient
                    colors={["#3d1a00", "#b8860b"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.bpVipUpgradeGrad}
                  >
                    <Text style={styles.bpVipUpgradeText}>👑  Upgrade to VIP to unlock all gifts</Text>
                    <TouchableOpacity style={styles.bpVipUpgradeBtn} activeOpacity={0.8}>
                      <Text style={styles.bpVipUpgradeBtnText}>Upgrade</Text>
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}

            {/* ── OTHER TABS EMPTY STATE ── */}
            {!["Gift", "Backpack", "Activity", "Relationship", "Special", "VIP"].includes(backpackMainTab) && (
              <View style={styles.bpEmptyState}>
                <Text style={styles.bpEmptyEmoji}>✨</Text>
                <Text style={styles.bpEmptyText}>Coming soon</Text>
              </View>
            )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── GIFT / LISTEN REWARDS MODAL ── */}
      <Modal
        visible={showGiftPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGiftPanel(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowGiftPanel(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.giftPanelBox}>
            {/* Handle */}
            <View style={styles.shareHandle} />

            {/* Header banner */}
            <View style={styles.giftBannerRow}>
              <View style={styles.giftBannerText}>
                <Text style={styles.giftBannerTitle}>Listen Rewards</Text>
                <Text style={styles.giftBannerSub}>Daily refresh</Text>
              </View>
              <Text style={styles.giftBannerEmoji}>🎁</Text>
            </View>

            {/* Reward cards */}
            <View style={styles.giftCardsRow}>
              {[
                {
                  img: require("../assets/Gift/gift1.png"),
                  qty: "x1d",
                  action: "00:14",
                  active: true,
                },
                {
                  img: require("../assets/Batches/vip-batch.png"),
                  qty: "x1d",
                  action: "listen 1 min",
                  active: false,
                },
                {
                  img: require("../assets/Gift/gift2.png"),
                  qty: "x1d",
                  action: "listen 10 min",
        
                  active: false,
                },
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.giftCard}
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowGiftPanel(false);
                    Alert.alert("Reward", item.active ? "Reward claimed!" : "Keep listening to unlock!");
                  }}
                >
                  <Image source={item.img} style={styles.giftCardImg} resizeMode="contain" />
                  <Text style={styles.giftCardQty}>{item.qty}</Text>
                  <View style={[styles.giftCardBtn, item.active && styles.giftCardBtnActive]}>
                    <Text style={[styles.giftCardBtnText, item.active && styles.giftCardBtnTextActive]}>
                      {item.action}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── EMOJI PICKER MODAL ── */}
      <Modal
        visible={showEmojiPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowEmojiPicker(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.emojiBox}>
            {/* Handle */}
            <View style={styles.shareHandle} />

            {/* Category tabs */}
            <View style={styles.emojiTabRow}>
              {emojiCategories.map((cat) => (
                <TouchableOpacity
                  key={cat.tab}
                  style={[styles.emojiTabItem, emojiTab === cat.tab && styles.emojiTabItemActive]}
                  onPress={() => setEmojiTab(cat.tab)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emojiTabIcon}>{cat.tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Emoji grid */}
            <ScrollView showsVerticalScrollIndicator={false} style={styles.emojiGrid}>
              <View style={styles.emojiGridInner}>
                {emojiCategories
                  .find((c) => c.tab === emojiTab)
                  ?.emojis.map((emoji, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.emojiCell}
                      activeOpacity={0.7}
                      onPress={() => {
                        setInputText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                    >
                      <Text style={styles.emojiCellText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── PLAY CENTER MODAL ── */}
      <Modal
        visible={showPlayCenter}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlayCenter(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPlayCenter(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.playCenterBox}>
            <Text style={styles.playCenterTitle}>Play center</Text>
            <View style={styles.playCenterRow}>
              {/* Music */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPlayCenter(false);
                  Alert.alert("Music", "Music player coming soon!");
                }}
              >
                <View style={styles.playCenterIconWrap}>
                  <Text style={styles.playCenterEmoji}>🎵</Text>
                </View>
                <Text style={styles.playCenterLabel}>Music</Text>
              </TouchableOpacity>

              {/* Lucky bag */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPlayCenter(false);
                  Alert.alert("Lucky Bag", "Lucky bag coming soon!");
                }}
              >
                <View style={styles.playCenterIconWrap}>
                  <Text style={styles.playCenterEmoji}>💰</Text>
                </View>
                <Text style={styles.playCenterLabel}>Lucky bag</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── POWER MODAL ── */}
      <Modal
        visible={showPowerMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPowerMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPowerMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.powerBox}>
            <Text style={styles.playCenterTitle}>Leave room?</Text>
            <View style={styles.playCenterRow}>
              {/* Keep */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => setShowPowerMenu(false)}
              >
                <View style={styles.playCenterIconWrap}>
                  <Minimize2 size={28} color="#a78bfa" />
                </View>
                <Text style={styles.playCenterLabel}>Keep</Text>
              </TouchableOpacity>

              {/* Exit */}
              <TouchableOpacity
                style={styles.playCenterItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPowerMenu(false);
                  router.back();
                }}
              >
                <View style={[styles.playCenterIconWrap, styles.powerExitIconWrap]}>
                  <Power size={28} color="#ff6b6b" />
                </View>
                <Text style={[styles.playCenterLabel, { color: "#ff6b6b" }]}>Exit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── SHARE MODAL ── */}
      <Modal
        visible={showShareMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShareMenu(false)}
      >
        <TouchableOpacity
          style={styles.shareOverlay}
          activeOpacity={1}
          onPress={() => setShowShareMenu(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.shareBox}>
            {/* Handle bar */}
            <View style={styles.shareHandle} />

            <Text style={styles.shareTitle}>Invite your friends</Text>

            {/* Platform icons */}
            <View style={styles.sharePlatformRow}>
              {sharePlatforms.map((p) => (
                <TouchableOpacity key={p.label} style={styles.sharePlatformItem} activeOpacity={0.8}>
                  <View style={[styles.sharePlatformIcon, { backgroundColor: p.bg }]}>
                    {typeof p.icon === "string"
                      ? <Text style={styles.sharePlatformEmoji}>{p.icon}</Text>
                      : p.icon}
                  </View>
                  <Text style={styles.sharePlatformLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Tabs */}
            <View style={styles.shareTabRow}>
              {shareTabs.map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.shareTabItem}
                  onPress={() => setShareTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.shareTabText, shareTab === tab && styles.shareTabTextActive]}>
                    {tab}
                  </Text>
                  {shareTab === tab && <View style={styles.shareTabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.shareCancelBtn}
              activeOpacity={0.8}
              onPress={() => setShowShareMenu(false)}
            >
              <Text style={styles.shareCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── MORE MENU MODAL ── */}
      <Modal
        visible={showMoreMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMoreMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMoreMenu(false)}
        >
          <View style={styles.moreMenuBox}>
            {moreMenuItems.map((item, i) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.moreMenuItem,
                  i < moreMenuItems.length - 1 && styles.moreMenuItemBorder,
                ]}
                activeOpacity={0.7}
                onPress={item.onPress}
              >
                <View style={styles.moreMenuIcon}>{item.icon}</View>
                <Text style={styles.moreMenuLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── BACKGROUND ── */}
      <Image
        source={{ uri: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400" }}
        style={styles.bgImage}
        resizeMode="cover"
      />
      <View style={styles.bgOverlay} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          {/* Owner info + follow button */}
          <View style={styles.ownerSection}>
            <Image source={{ uri: roomOwner.avatar }} style={styles.ownerAvatar} />
            <View style={styles.ownerTextCol}>
              <Text style={styles.ownerName}>
                {roomOwner.name}'s room
              </Text>
              <Text style={styles.ownerId}>ID:{roomOwner.id}</Text>
            </View>
            <TouchableOpacity
              style={[styles.plusBtn, isFollowing && styles.plusBtnFollowing]}
              onPress={handleFollowToggle}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading
                ? <ActivityIndicator size="small" color="white" />
                : <Plus size={20} color="white" />
              }
            </TouchableOpacity>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowShareMenu(true)}>
              <Share2 size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowMoreMenu(true)}>
              <MoreVertical size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerBtn} onPress={() => setShowPowerMenu(true)}>
              <Power size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
 
        {/* ── BADGES ROW ── */}
        <View style={styles.badgesRow}>
          <View style={styles.trophyBadge}>
            <Text style={styles.trophyText}>🏆 9 ›</Text>
          </View>
        </View>

        {/* ── MIC SEATS GRID ── */}
        <View style={styles.seatsGrid}>
          {micSeats.map((seat) => (
            <TouchableOpacity key={seat.id} style={styles.seatItem} activeOpacity={0.8}>
              {seat.user ? (
                <View style={styles.seatUserWrap}>
                  {seat.user.active && (
                    <LinearGradient
                      colors={["#ffd700", "#ff8c00"]}
                      style={styles.activeRing}
                    />
                  )}
                  <View style={[styles.seatEmpty, seat.user.active && { borderColor: "#ffd700" }]}>
                    <Mic size={18} color={seat.user.active ? "#ffd700" : "rgba(255,255,255,0.8)"} />
                  </View>
                  {seat.user.rank && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{seat.user.rank}</Text>
                    </View>
                  )}
                </View>
              ) : seat.locked ? (
                <View style={styles.seatEmpty}>
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
              ) : (
                <View style={styles.seatEmpty}>
                  <Mic size={18} color="rgba(255,255,255,0.5)" />
                </View>
              )}
              <Text style={styles.seatNum}>{seat.id}</Text>
              {seat.user && (
                <Text style={styles.seatName} numberOfLines={1}>
                  {seat.user.badge} {seat.user.name}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── CHAT + RIGHT PANEL ── */}
        <View style={styles.chatArea}>
          <View style={styles.chatLeft}>
            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {messages.map((msg) =>
                msg.system ? (
                  <View key={msg.id} style={styles.systemMsg}>
                    <Text style={styles.systemMsgText}>{msg.text}</Text>
                  </View>
                ) : (
                  <View key={msg.id} style={styles.chatMsg}>
                    {msg.avatar ? (
                      <Image source={{ uri: msg.avatar }} style={styles.chatAvatar} />
                    ) : (
                      <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                          {msg.user?.[0]?.toUpperCase() ?? "?"}
                        </Text>
                      </View>
                    )}
                    <View style={styles.chatBubble}>
                      <View style={styles.chatMeta}>
                        <Text style={styles.chatUser}>{msg.user}</Text>
                        <View style={styles.lvBadge}>
                          <Text style={styles.lvText}>Lv.{msg.level}</Text>
                        </View>
                        {msg.coins > 0 && <Text style={styles.chatCoin}>🪙 {msg.coins}</Text>}
                        {msg.diamonds > 0 && <Text style={styles.chatDiamond}>💎 {msg.diamonds}</Text>}
                      </View>
                      <Text style={styles.chatText}>{msg.text}</Text>
                    </View>
                  </View>
                )
              )}
            </ScrollView>
          </View>

          {/* Right panel */}
          <View style={styles.chatRight}>
            <TouchableOpacity style={styles.rightIconBtn} onPress={() => setShowGiftPanel(true)}>
              <Text style={styles.rightIconEmoji}>🎁</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rightIconBtn} onPress={() => router.push("/(tabs)/chat")}>
              <MessageSquare size={22} color="white" />
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>25</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.takeMicBtn}>
              <Text style={styles.takeMicEmoji}>🎤</Text>
              <Text style={styles.takeMicText}>Take Mic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── BOTTOM BAR ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomIconBtn}
            onPress={() => setIsMuted((v) => !v)}
          >
            {isMuted ? (
              <MicOff size={24} color="white" />
            ) : (
              <Volume2 size={24} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={() => setShowEmojiPicker(true)}>
            <Smile size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={() => setShowChatInput((v) => !v)}>
            <MessageSquare size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.bottomIconBtn, styles.giftShortcutHighlight]} onPress={() => setShowBackpack(true)}>
            <Text style={styles.giftShortcutEmoji}>💰</Text>
            <Text style={styles.giftShortcutLabel}>Recharge{"\n"}Bonus</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomIconBtn} onPress={() => setShowPlayCenter(true)}>
            <LayoutGrid size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* ── CHAT INPUT ── */}
        {showChatInput && (
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Say something..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            autoFocus
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1a0a2e" },
  bgImage: { position: "absolute", width: W, height: H },
  bgOverlay: {
    position: "absolute",
    width: W,
    height: H,
    backgroundColor: "rgba(30,10,60,0.72)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 48,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  ownerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ownerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#a78bfa",
  },
  ownerTextCol: {
    gap: 2,
  },
  ownerName: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  ownerId: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#392257ff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  plusBtnFollowing: {
    backgroundColor: "rgba(124,77,255,0.3)",
    borderColor: "rgba(167,139,250,0.6)",
    shadowOpacity: 0.2,
  },  audienceRow: { flexDirection: "row", alignItems: "center" },
  audienceAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#1a0a2e",
  },
  audienceCount: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -10,
  },
  audienceCountText: { color: "white", fontSize: 11, fontWeight: "700" },
  headerRight: { flexDirection: "row", gap: 6 },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 8,
    marginBottom: 10,
  },
  trophyBadge: {
    backgroundColor: "rgba(255,215,0,0.2)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,215,0,0.4)",
  },
  trophyText: { color: "#ffd700", fontSize: 12, fontWeight: "700" },
  badgeDot: { color: "rgba(255,255,255,0.3)", fontSize: 16 },
  badgeEmoji: { fontSize: 20 },
  seatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  seatItem: { width: SEAT_SIZE, alignItems: "center", gap: 4 },
  seatUserWrap: {
    position: "relative",
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    alignItems: "center",
    justifyContent: "center",
  },
  activeRing: {
    position: "absolute",
    width: SEAT_SIZE - 2,
    height: SEAT_SIZE - 2,
    borderRadius: (SEAT_SIZE - 2) / 2,
  },
  seatAvatar: {
    width: SEAT_SIZE - 10,
    height: SEAT_SIZE - 10,
    borderRadius: (SEAT_SIZE - 10) / 2,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  rankBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ffd700",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: { color: "#000", fontSize: 9, fontWeight: "800" },
  seatEmpty: {
    width: SEAT_SIZE - 4,
    height: SEAT_SIZE - 4,
    borderRadius: (SEAT_SIZE - 4) / 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lockIcon: { fontSize: 16 },
  seatNum: { color: "rgba(255,255,255,0.5)", fontSize: 10 },
  seatName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    textAlign: "center",
    maxWidth: SEAT_SIZE,
  },
  chatArea: { flex: 1, flexDirection: "row", paddingHorizontal: 12, gap: 8 },
  chatLeft: { flex: 1, maxHeight: 200 },
  systemMsg: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  systemMsgText: { color: "rgba(255,255,255,0.7)", fontSize: 12 },
  chatMsg: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  chatAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatBubble: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    padding: 8,
    flex: 1,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
    flexWrap: "wrap",
  },
  chatUser: { color: "#b44dff", fontSize: 12, fontWeight: "700" },
  lvBadge: {
    backgroundColor: "#f5a623",
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  lvText: { color: "white", fontSize: 10, fontWeight: "700" },
  chatCoin: { fontSize: 11, color: "#ffd700" },
  chatDiamond: { fontSize: 11, color: "#4dc8ff" },
  chatText: { color: "white", fontSize: 13 },
  chatRight: { width: 60, alignItems: "center", gap: 10, justifyContent: "flex-end" },
  luckyStarBox: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    padding: 6,
    width: 58,
  },
  luckyStarEmoji: { fontSize: 22 },
  luckyStarLabel: {
    color: "#ffd700",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  luckyProgress: {
    backgroundColor: "#8b0000",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginTop: 2,
  },
  luckyProgressText: { color: "white", fontSize: 9, fontWeight: "700" },
  rightIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightIconEmoji: { fontSize: 22 },
  rightBannerBtn: {
    width: 44,
    height: 60,
    borderRadius: 10,
    backgroundColor:" rgba(61, 52, 88, 0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  rightBannerText: { fontSize: 26 },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#4dc8ff",
    borderRadius: 8,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  chatBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  giftBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#ff4ea3",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  giftBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  takeMicBtn: {
    alignItems: "center",
    backgroundColor: "#16131eb3",
    borderRadius: 22,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: 54,
  },
  takeMicEmoji: { fontSize: 20 },
  takeMicText: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  bottomIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftRow: { flex: 1, flexDirection: "row", gap: 8, justifyContent: "center" },
  giftShortcut: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftShortcutHighlight: {
    backgroundColor: "rgba(255,255,255,0.1)",
    width: 64,
    borderRadius: 24,
    paddingHorizontal: 4,
  },
  giftShortcutEmoji: { fontSize: 18 },
  giftShortcutLabel: {
    color: "#ffd700",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  inputRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 26,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: "white",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  sendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 26,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnText: { color: "white", fontWeight: "700", fontSize: 16 },

  // More menu modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 90,
    paddingRight: 12,
  },
  moreMenuBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    minWidth: 200,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  moreMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 18,
    gap: 14,
  },
  moreMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
  },
  moreMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreMenuLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },

  // ── Share modal ──
  shareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  shareBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  shareHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.4)",
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  shareTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  sharePlatformRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  sharePlatformItem: { alignItems: "center", gap: 6 },
  sharePlatformIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  sharePlatformEmoji: { fontSize: 26 },
  sharePlatformLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "500",
  },
  shareTabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    marginBottom: 8,
  },
  shareTabItem: { paddingVertical: 8, paddingHorizontal: 10, alignItems: "center" },
  shareTabText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  shareTabTextActive: { color: "white" },
  shareTabUnderline: {
    height: 2,
    width: "100%",
    backgroundColor: "#7c4dff",
    borderRadius: 2,
    marginTop: 4,
  },
  shareBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  shareBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  shareCancelBtn: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  shareCancelText: { color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: "600" },

  // ── Power modal ──
  powerBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 220,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  powerOption: {
    alignItems: "center",
    gap: 14,
  },
  powerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
    // profile-style purple glow shadow
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 24,
    elevation: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  powerLabel: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  powerOverlay: {
    flex: 1,
    backgroundColor: "rgba(13,6,24,0.82)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Play center modal ──
  playCenterBox: {
    backgroundColor: "#1a0a2e",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingVertical: 18,
    paddingHorizontal: 20,
    minWidth: 220,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  playCenterTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  playCenterRow: {
    flexDirection: "row",
    gap: 24,
  },
  playCenterItem: {
    alignItems: "center",
    gap: 8,
  },
  playCenterIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  playCenterEmoji: { fontSize: 28 },
  playCenterLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  powerExitIconWrap: {
    backgroundColor: "rgba(255,107,107,0.15)",
    borderColor: "rgba(255,107,107,0.3)",
  },

  // ── Gift / Listen Rewards panel ──
  giftPanelBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 20,
    paddingBottom: 32,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  giftBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  giftBannerText: { gap: 4 },
  giftBannerTitle: {
    color: "#c4b5fd",
    fontSize: 22,
    fontWeight: "800",
    fontStyle: "italic",
  },
  giftBannerSub: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "600",
    fontStyle: "italic",
  },
  giftBannerEmoji: { fontSize: 52 },
  giftCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  giftCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 8,
  },
  giftCardImg: {
    width: 64,
    height: 64,
  },
  giftCardQty: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  giftCardBtn: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  giftCardBtnActive: {
    backgroundColor: "rgba(124,77,255,0.45)",
    borderColor: "#a78bfa",
  },
  giftCardBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  giftCardBtnTextActive: {
    color: "white",
  },

  // ── Emoji picker ──
  emojiBox: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 12,
    paddingBottom: 24,
    maxHeight: "55%",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  emojiTabRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    marginBottom: 10,
    paddingBottom: 4,
  },
  emojiTabItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  emojiTabItemActive: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  emojiTabIcon: { fontSize: 22 },
  emojiGrid: { flex: 1 },
  emojiGridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  emojiCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emojiCellText: { fontSize: 26 },

  // ── Backpack modal ──
  backpackBox: {
    backgroundColor: "#0f0720",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 14,
  },
  bpBanner: {
    marginHorizontal: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    overflow: "hidden",
  },
  bpBannerGift: { fontSize: 30 },
  bpBannerText: { flex: 1, color: "white", fontSize: 13, fontWeight: "700" },
  bpBannerArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  bpBannerArrowText: { color: "white", fontSize: 18, fontWeight: "700", lineHeight: 22 },
  bpPkBadge: {
    position: "absolute",
    top: 6,
    right: 50,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  bpPkBadgeText: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },
  bpCurrencyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 10,
  },
  bpCurrencyItem: { flexDirection: "row", alignItems: "center" },
  bpDiamondIcon: { fontSize: 20 },
  bpCoinIcon: { fontSize: 20 },
  bpCurrencyVal: { color: "white", fontSize: 15, fontWeight: "700", marginLeft: 5 },
  bpCurrencyChev: { color: "#a78bfa", fontSize: 15, fontWeight: "700" },
  bpGetListBtn: {
    marginLeft: "auto",
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  bpGetListText: { color: "#c4b5fd", fontSize: 12, fontWeight: "600" },
  bpMainTabScroll: { borderBottomWidth: 1, borderBottomColor: "rgba(167,139,250,0.15)", flexGrow: 0, flexShrink: 0 },
  bpMainTabContent: { paddingHorizontal: 12, gap: 2 },
  bpMainTabItem: { paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  bpMainTabText: { color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: "600" },
  bpMainTabTextActive: { color: "white" },
  bpMainTabUnderline: {
    height: 2,
    width: "80%",
    backgroundColor: "#a78bfa",
    borderRadius: 2,
    marginTop: 4,
  },
  bpScrollArea: { flex: 1 },

  // Random gifts
  bpRandomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 12,
    gap: 10,
  },
  bpRandomBox: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  bpRandomBoxEmoji: { fontSize: 26 },
  bpRandomBoxLabel: { color: "white", fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 3 },
  bpOrbWrap: { alignItems: "center", marginRight: 10, gap: 5 },
  bpOrbCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.35)",
  },
  bpOrbEmoji: { fontSize: 28 },
  bpOrbPrice: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },

  // Event banner
  bpEventBanner: {
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  bpEventIcon: { fontSize: 22 },
  bpEventText: { flex: 1, color: "white", fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
  bpEventArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(167,139,250,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  bpEventArrowText: { color: "#a78bfa", fontSize: 18, fontWeight: "700", lineHeight: 22 },

  // Gift grid
  bpGiftGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  bpGiftCard: {
    width: GIFT_CARD_W,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 5,
    position: "relative",
    overflow: "hidden",
  },
  bpGiftCardSelected: {
    borderColor: "#a78bfa",
    backgroundColor: "rgba(124,77,255,0.28)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  bpHotBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#ff4ea3",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  bpHotText: { color: "white", fontSize: 8, fontWeight: "800" },
  bpGiftSendBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(124,77,255,0.5)",
    borderRadius: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bpGiftEmojiWrap: {
    width: GIFT_CARD_W - 20,
    height: GIFT_CARD_W - 20,
    borderRadius: (GIFT_CARD_W - 20) / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  bpGiftEmoji: { fontSize: 32 },
  bpGiftName: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    width: "100%",
    paddingHorizontal: 2,
  },
  bpGiftPriceRow: { flexDirection: "row", alignItems: "center" },
  bpGiftPriceText: { color: "#c4b5fd", fontSize: 10, fontWeight: "700" },

  // Send bar
  bpSendBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.15)",
    backgroundColor: "#0f0720",
    gap: 10,
  },
  bpSendAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: "#7c4dff",
  },
  bpSendRecipient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendHeart: { fontSize: 13 },
  bpSendName: { color: "white", fontSize: 13, fontWeight: "600", flex: 1 },
  bpSendChev: { color: "#a78bfa", fontSize: 12 },
  bpSendQtyBtn: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  bpSendQtyText: { color: "white", fontSize: 13, fontWeight: "700" },
  bpSendBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 10,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  bpSendBtnText: { color: "white", fontSize: 15, fontWeight: "700" },

  // Backpack sub-tabs & empty
  bpSubTabRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  bpSubTabItem: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  bpSubTabItemActive: {
    backgroundColor: "rgba(124,77,255,0.25)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  bpSubTabText: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "600" },
  bpSubTabTextActive: { color: "white" },
  bpEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 10,
  },
  bpEmptyEmoji: { fontSize: 48 },
  bpEmptyText: { color: "rgba(255,255,255,0.35)", fontSize: 15, fontWeight: "500" },

  // Activity event sub-tabs
  bpActEventScroll: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.15)",
    flexGrow: 0,
  },
  bpActEventContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: "center",
  },
  bpActEventTab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
  },
  bpActEventTabActive: {
    backgroundColor: "rgba(124,77,255,0.35)",
    borderColor: "#a78bfa",
  },
  bpActEventText: { color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: "600" },
  bpActEventTextActive: { color: "white" },

  // ── Intimacy video thumbnail cards ──
  bpVideoThumb: {
    width: GIFT_CARD_W - 8,
    height: GIFT_CARD_W - 8,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bpVideoNumBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bpVideoNumText: { color: "white", fontSize: 10, fontWeight: "800" },
  bpVideoPlayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.55)",
  },
  bpVideoShimmerWrap: {
    position: "absolute",
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bpVideoShimmerText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    letterSpacing: 3,
  },
  bpVideoTagText: { color: "#a78bfa", fontSize: 10, fontWeight: "600" },

  // ── Full-screen video player ──
  videoPlayerContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  videoHeaderTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  videoCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  videoCloseBtnText: { color: "white", fontSize: 20, fontWeight: "700" },
  videoWrapper: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  videoPlayer: {
    width: W,
    height: H * 0.75,
  },

  // ── Special tab ──
  bpNewBadge: {
    position: "absolute",
    top: 5,
    left: 5,
    backgroundColor: "#00c853",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    zIndex: 2,
  },
  bpNewBadgeText: { color: "white", fontSize: 8, fontWeight: "800" },

  // ── VIP tab ──
  bpVipBanner: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  bpVipBannerGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  bpVipBannerIcon: { fontSize: 18 },
  bpVipBannerText: { flex: 1, color: "#ffd700", fontSize: 12, fontWeight: "700" },

  bpVipLockOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bpVipLockCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(184,134,11,0.35)",
    borderWidth: 1.5,
    borderColor: "#b8860b",
    alignItems: "center",
    justifyContent: "center",
  },
  bpVipLockEmoji: { fontSize: 16 },
  bpVipTag: {
    backgroundColor: "#b8860b",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  bpVipTagText: { color: "#fff8e1", fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  bpVipPriceText: { color: "#ffd700", fontSize: 10, fontWeight: "700" },

  bpVipUpgradeBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    overflow: "hidden",
  },
  bpVipUpgradeGrad: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 10,
  },
  bpVipUpgradeText: { flex: 1, color: "#fff8e1", fontSize: 13, fontWeight: "700" },
  bpVipUpgradeBtn: {
    backgroundColor: "#fff8e1",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  bpVipUpgradeBtnText: { color: "#7c4000", fontSize: 13, fontWeight: "800" },
});
