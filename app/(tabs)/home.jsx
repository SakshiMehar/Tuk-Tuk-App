import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  StatusBar,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { ChevronRight } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const H_PAD = 14;
const CARD_GAP = 10;
const CARD_SIZE = (SCREEN_WIDTH - H_PAD * 2 - CARD_GAP) / 2 * 0.88;

// 4 equal action cards — 2×2 grid
const actionCards = [
  {
    title: "Voice Party",
    subtitle: "Join a live room",
    colors: ["#362407ff", "#f76b1c"],
    img: require("../../assets/images/TM1.png"),
    route: "/voice-party",
    showWave: true,
    imgSize: CARD_SIZE * 0.80,
  },
  {
    title: "Find Friends",
    subtitle: "Meet new people",
    colors: ["#180c3aff", "#a647eaff"],
    img: require("../../assets/images/ofcchat.gif"),
    route: "/find-friends",
    imgSize: CARD_SIZE * 0.88,
  },
  {
    title: "Nearby",
    subtitle: "People around you",
    colors: ["#143238ff", "#0077b6"],
    img: require("../../assets/images/TM3.gif"),
    route: "/nearby",
    imgSize: CARD_SIZE * 0.90,
  },
  {
    title: "Blind Pick",
    subtitle: "Mystery match",
    colors: ["#dc62bcff", "#351743ff"],
    img: require("../../assets/images/TM2B.gif"),
    route: "/(tabs)/blind-pick",
    imgSize: CARD_SIZE * 0.80,
  },
];

const iconItems = [
  {
    label: "Voice Call",
    img: require("../../assets/images/officialchat.png"),
    colors: ["#cf91b6ff", "#180a31ff"],
    imgSize: 70,
  },
  {
    label: "Personality Test",
    img: require("../../assets/images/blindpick.png"),
    colors: ["#080334ff", "#ac4dffff"],
    imgSize: 60,
  
  },
  {
    label: "Truth & Dare",
    img: require("../../assets/images/truthdare.png"),
    colors: ["#15072dff", "#486ba8ff"],
    imgSize: 150,
  },
  {
    label: "Invitation\nRewards",
    img: require("../../assets/images/invitationReward.png"),
    colors: ["#76093fff", "#ba741eff"],
    imgSize: 80,
  },
   {
    label: "Ludo",
    img: require("../../assets/images/ludo.jpg"),
    colors: ["#041e04ff", "#175726ff"],
     imgSize: 70,
  },

  {
    label: "Snakes & ladders",
    img: require("../../assets/images/Snakes&Ladders.jpg"),
    colors: ["#0c250cff", "#d2ec23cf"],
    imgSize: 50,
  },
  {
    label: "Draw & Guess",
    img: require("../../assets/images/draw n guess.jpg"),
    colors: ["#5f0909ff", "#9e4c3eff"],
    imgSize: 50,
    
  },
];

const TABS = ["For You", "Selfie", "Online", "Following", "New"];

const bannerSlides = [
  {
    id: "1",
    img: require("../../assets/images/cat gif.gif"),
    title: "Invite Friends\nTo Get Diamonds",
  },
  {
    id: "2",
    img: require("../../assets/images/labelgif (1).jpg"),
    title: "Play Games\nMeet New People",
  },
  {
    id: "3",
    img: require("../../assets/images/labelgif (2).jpg"),
    title: "Win Suprises\n Be a Winner",
  },
  {
    id: "4",
    img: require("../../assets/images/labelgif (3).jpg"),
    title: "Earn Money\nFind Your Match",
  },
  {
    id: "5",
    img: require("../../assets/images/labelgif (4).jpg"),
    title: "Search for Calmness\n Choose Your Area Of Intrest",
  },
];

const recommendedUsers = [
  { id: "1", name: "Sanu 🇮🇳 —...", avatar: "https://randomuser.me/api/portraits/men/11.jpg" },
  { id: "2", name: "Sanjay ❤️❤️", avatar: "https://randomuser.me/api/portraits/men/22.jpg" },
  { id: "3", name: "Rajput sha...", avatar: "https://randomuser.me/api/portraits/men/33.jpg" },
  { id: "4", name: "M+D=< 🔺 ...", avatar: "https://randomuser.me/api/portraits/men/44.jpg" },
  { id: "5", name: "Aryan 🔥...", avatar: "https://randomuser.me/api/portraits/men/55.jpg" },
  { id: "6", name: "Priya 💫...", avatar: "https://randomuser.me/api/portraits/women/22.jpg" },
  { id: "7", name: "Zara ✨...", avatar: "https://randomuser.me/api/portraits/women/33.jpg" },
];

const feedPosts = [
  {
    id: 1,
    name: "Sk Jobiulla",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "# 🇯🇵 Japan is turning footsteps into electricity! Using piezoelectric tiles, every step you take generates a small amount of energy. Millions of steps together can power LED lights...",
    hasVideo: true,
    duration: "00:12",
  },
  {
    id: 2,
    name: "Priya Singh",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    text: "Just had the most amazing sunset view from the rooftop. Life is beautiful when you slow down and appreciate the little things around you 🌅",
    hasVideo: false,
  },
  {
    id: 3,
    name: "Arjun Mehta",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    text: "🎵 Music is the shortcut to every emotion. Been jamming all night and honestly this is the best therapy. Drop your favorite song below 👇",
    hasVideo: false,
  },
  {
    id: 4,
    name: "Zara Khan",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    text: "✈️ Solo trip to Manali was the best decision of 2024. The mountains don't judge you, they just welcome you. Already planning the next one!",
    hasVideo: true,
    duration: "00:28",
  },
  {
    id: 5,
    name: "Rohan Das",
    avatar: "https://randomuser.me/api/portraits/men/76.jpg",
    text: "🤯 Did you know octopuses have three hearts and blue blood? Nature is absolutely wild. Share a crazy animal fact below 👇",
    hasVideo: false,
  },
];

const moreFeedPosts = [
  {
    id: 6,
    name: "Aisha Verma",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    text: "☕ There's something magical about the first sip of coffee in the morning. It's not just a drink, it's a whole ritual. What's your morning routine? 🌅",
  },
  {
    id: 7,
    name: "Kabir Singh",
    avatar: "https://randomuser.me/api/portraits/men/62.jpg",
    text: "💡 Reminder: You don't have to be perfect to be amazing. Progress over perfection, always. Keep going, you're doing better than you think 💪",
  },
  {
    id: 8,
    name: "Neha Sharma",
    avatar: "https://randomuser.me/api/portraits/women/71.jpg",
    text: "🌸 Spring is finally here and the flowers outside my window are absolutely stunning. Nature has a way of healing everything silently 🌺",
  },
  {
    id: 9,
    name: "Dev Patel",
    avatar: "https://randomuser.me/api/portraits/men/83.jpg",
    text: "🎮 Just finished a 6-hour gaming session and honestly no regrets. Sometimes you just need to unplug from reality and plug into another world 😄",
  },
  {
    id: 10,
    name: "Riya Joshi",
    avatar: "https://randomuser.me/api/portraits/women/88.jpg",
    text: "📚 Currently reading Atomic Habits and it's genuinely changing the way I think about small daily actions. Highly recommend to everyone here 🔥",
  },
];

const notifications = [
  {
    id: "1",
    type: "like",
    icon: "❤️",
    title: "Priya liked your post",
    subtitle: "\"Living the dream in Goa ✈️\"",
    time: "2m ago",
    avatar: "https://randomuser.me/api/portraits/women/32.jpg",
    unread: true,
  },
  {
    id: "2",
    type: "follow",
    icon: "👤",
    title: "Rohan started following you",
    subtitle: "Tap to view profile",
    time: "15m ago",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    unread: true,
  },
  {
    id: "3",
    type: "gift",
    icon: "🎁",
    title: "You received a gift!",
    subtitle: "Arjun sent you 200 💎 diamonds",
    time: "1h ago",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    unread: true,
  },
  {
    id: "4",
    type: "comment",
    icon: "💬",
    title: "Sneha commented on your post",
    subtitle: "\"You're so beautiful 😍\"",
    time: "2h ago",
    avatar: "https://randomuser.me/api/portraits/women/56.jpg",
    unread: false,
  },
  {
    id: "5",
    type: "party",
    icon: "🎉",
    title: "Voice Party started!",
    subtitle: "Rahul's room is live now — join in!",
    time: "3h ago",
    avatar: "https://randomuser.me/api/portraits/men/12.jpg",
    unread: false,
  },
  {
    id: "6",
    type: "system",
    icon: "🔔",
    title: "New match found!",
    subtitle: "Someone is waiting for you in Blind Pick",
    time: "5h ago",
    avatar: null,
    unread: false,
  },
  {
    id: "7",
    type: "reward",
    icon: "🏆",
    title: "Daily login reward claimed",
    subtitle: "You earned 50 💎 diamonds today",
    time: "8h ago",
    avatar: null,
    unread: false,
  },
];

const searchSuggestions = ["Voice Party", "Find Friends", "Nearby Users", "Blind Pick", "Truth & Dare", "Ludo"];

const gifts = [
  {
    id: "1",
    name: "Golden Coins",
    emoji: "🪙",
    value: 100,
    colors: ["#ff9500ff", "#ffb700ff"],
    description: "Get 100 coins daily",
    isFree: true,
  },
  {
    id: "2",
    name: "Diamond Box",
    emoji: "💎",
    value: 50,
    colors: ["#0077b6", "#00b4d8ff"],
    description: "Get 50 diamonds daily",
    isFree: true,
  },
  {
    id: "3",
    name: "Heart Gift",
    emoji: "❤️",
    value: 25,
    colors: ["#dc62bcff", "#ff4ea3"],
    description: "Get 25 hearts daily",
    isFree: true,
  },
  {
    id: "4",
    name: "Star Bonus",
    emoji: "⭐",
    value: 10,
    colors: ["#ffd700", "#ffed4e"],
    description: "Get 10 stars daily",
    isFree: true,
  },
  {
    id: "5",
    name: "Mystery Box",
    emoji: "🎁",
    value: 200,
    colors: ["#a647eaff", "#7c4dff"],
    description: "Random rewards",
    isFree: false,
  },
];

export default function Home() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("For You");
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);

  // Tab press animations: scale bounce + underline slide-in per tab
  const tabScales = useRef(TABS.reduce((acc, t) => { acc[t] = new Animated.Value(1); return acc; }, {})).current;
  const tabUnderlineScales = useRef(TABS.reduce((acc, t) => { acc[t] = new Animated.Value(t === "For You" ? 1 : 0); return acc; }, {})).current;

  const handleTabPress = (tab) => {
    // Reset previous underline
    Animated.timing(tabUnderlineScales[selectedTab], { toValue: 0, duration: 150, useNativeDriver: true }).start();
    // Bounce the pressed tab
    Animated.sequence([
      Animated.timing(tabScales[tab], { toValue: 0.82, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.spring(tabScales[tab], { toValue: 1, tension: 260, friction: 7, useNativeDriver: true }),
    ]).start();
    // Slide-in underline
    Animated.timing(tabUnderlineScales[tab], { toValue: 1, duration: 220, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }).start();
    setSelectedTab(tab);
  };
  const [searchVisible, setSearchVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [giftsVisible, setGiftsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(
    notifications.filter((n) => n.unread).map((n) => n.id)
  );

  const handleMarkAllRead = () => {
    setUnreadNotifications([]);
  };

  const handleSearchQuery = (text) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    const query = text.toLowerCase();
    const results = [];

    actionCards.forEach((card) => {
      if (
        card.title.toLowerCase().includes(query) ||
        card.subtitle.toLowerCase().includes(query)
      ) {
        results.push({
          id: card.title,
          title: card.title,
          subtitle: card.subtitle,
          type: "action",
          route: card.route,
          colors: card.colors,
        });
      }
    });

    iconItems.forEach((item) => {
      if (item.label.toLowerCase().includes(query)) {
        results.push({
          id: item.label,
          title: item.label,
          type: "icon",
          colors: item.colors,
        });
      }
    });

    searchSuggestions.forEach((suggestion) => {
      if (
        suggestion.toLowerCase().includes(query) &&
        !results.some((r) => r.title === suggestion)
      ) {
        results.push({
          id: suggestion,
          title: suggestion,
          type: "suggestion",
        });
      }
    });

    setSearchResults(results);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner((prev) => {
        const next = (prev + 1) % bannerSlides.length;
        bannerRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── BACKGROUND (same as login) ── */}
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
        {/* ── HEADER ── */}
        <View style={styles.headerCard}>
          {/* Row 1: Avatar + Welcome/Title + Diamonds + Icons */}
          <View style={styles.headerTopRow}>

            {/* Avatar with green dot */}
            <View style={styles.avatarWrapper}>
              <Image
                source={require("../../assets/images/android-icon-background.png")}
                style={styles.headerAvatar}
              />
              <View style={styles.onlineDot} />
            </View>

            {/* Welcome + App name */}
            <View style={styles.headerTitleCol}>
              <Text style={styles.helloText}>Welcome to 👋</Text>
              <MaskedView
                maskElement={<Text style={styles.appName}>Tuk Tuk</Text>}
              >
                <LinearGradient
                  colors={["#ffffff", "#f0e6ff", "#ff69b4"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.appName, { opacity: 0 }]}>Tuk Tuk</Text>
                </LinearGradient>
              </MaskedView>
            </View>

            {/* Right icons */}
            <View style={styles.headerIcons}>
              {/* Diamond count */}
              <View style={styles.diamondPill}>
                <Text style={styles.diamondEmoji}>💎</Text>
                <Text style={styles.diamondCount}>2,480</Text>
              </View>
              <TouchableOpacity
                style={styles.headerIconBtn}
                activeOpacity={0.8}
                onPress={() => setGiftsVisible(true)}
              >
                <Text style={styles.headerIconEmoji}>🎁</Text>
                <View style={[styles.headerIconBadge, { backgroundColor: "#ff3f72" }]}>
                  <Text style={styles.headerIconBadgeText}>!</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8} onPress={() => setNotifVisible(true)}>
                <Text style={styles.headerIconEmoji}>🔔</Text>
                <View style={[styles.headerIconBadge, { backgroundColor: "#7c4dff" }]}>
                  <Text style={styles.headerIconBadgeText}>4</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.headerDivider} />

          {/* Row 2: Active now pill + search */}
          <View style={styles.activeRow}>
            <TouchableOpacity
              style={styles.matchPill}
              activeOpacity={0.85}
              onPress={() => router.push("/chat")}
            >
              <Image
                source={{ uri: "https://randomuser.me/api/portraits/men/45.jpg" }}
                style={styles.matchAvatar}
              />
              <View style={styles.matchWaves}>
                {[5, 10, 7, 13, 9, 6, 11].map((h, i) => (
                  <View key={i} style={[styles.matchWaveBar, { height: h }]} />
                ))}
              </View>
              <View style={styles.activeTextCol}>
                <Text style={styles.activeNumber}>167,038</Text>
                <Text style={styles.activeLabel}>Active now</Text>
              </View>
              <View style={styles.matchArrow}>
                <ChevronRight size={14} color="white" />
              </View>
            </TouchableOpacity>

            {/* Search button */}
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8} onPress={() => setSearchVisible(true)}>
              <Text style={styles.searchIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ── 2×2 ACTION CARDS ── */}
        <View style={styles.actionGrid}>
          {actionCards.map((card) => (
            <TouchableOpacity
              key={card.title}
              style={styles.actionCard}
              activeOpacity={0.88}
              onPress={() => router.push(card.route)}
            >
              <LinearGradient
                colors={card.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionCardGradient}
              >
                <Text style={styles.cardTitle}>{card.title}</Text>
                {card.subtitle && (
                  <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                )}
                {card.showWave && (
                  <View style={styles.waveRow}>
                    {[8, 14, 10, 18, 12].map((h, wi) => (
                      <View key={wi} style={[styles.waveBar, { height: h }]} />
                    ))}
                  </View>
                )}
                <Image
                  source={typeof card.img === "string" ? { uri: card.img } : card.img}
                  style={[styles.cardIllustration, card.imgSize && { width: card.imgSize, height: card.imgSize }]}
                  resizeMode="contain"
                />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── ICON ROW ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.iconScroll}
          style={styles.iconContainer}
        >
          {iconItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.iconItem} activeOpacity={0.8}>
              <LinearGradient
                colors={item.colors}
                style={styles.iconBox}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image source={typeof item.img === "string" ? { uri: item.img } : item.img} style={[styles.iconImg, item.imgSize && { width: item.imgSize, height: item.imgSize }]} resizeMode="contain" />
              </LinearGradient>
              <Text style={styles.iconLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── TABS ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScroll}
          style={styles.tabsBar}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => handleTabPress(tab)}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <Animated.Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.tabActive,
                  { transform: [{ scale: tabScales[tab] }] },
                ]}
              >
                {tab}
              </Animated.Text>
              <Animated.View
                style={[
                  styles.tabUnderline,
                  { transform: [{ scaleX: tabUnderlineScales[tab] }], opacity: tabUnderlineScales[tab] },
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── RECOMMEND USER IN THE ROOM ── */}
        <View style={styles.recommendSection}>
          <Text style={styles.recommendTitle}>Recommend user in the room</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendScroll}
          >
          {recommendedUsers.map((user) => (
              <TouchableOpacity key={user.id} style={styles.recommendItem} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#7c4dff", "#ff4ea3"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.recommendAvatarRing}
                >
                  <Image source={{ uri: user.avatar }} style={styles.recommendAvatar} />
                </LinearGradient>
                <Text style={styles.recommendName} numberOfLines={1}>{user.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── FEED ── */}
        <View style={styles.feed}>
          {feedPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
                <Text style={styles.postName}>{post.name}</Text>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>👤 Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                  <Text style={styles.moreBtnText}>⋯</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.postText} numberOfLines={4}>
                {post.text}{" "}
                <Text style={styles.moreText}>More</Text>
              </Text>
              {post.hasVideo && (
                <View style={styles.videoBox}>
                  <View style={styles.playBtn}>
                    <Text style={styles.playIcon}>▶</Text>
                  </View>
                  <Text style={styles.videoDuration}>{post.duration}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ── BANNER SLIDER ── */}
        <View style={styles.bannerWrapper}>
          <FlatList
            ref={bannerRef}
            data={bannerSlides}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - H_PAD * 2));
              setActiveBanner(index);
            }}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.9} style={styles.bannerSlide}>
                <Image
                  source={item.img}
                  style={styles.bannerImg}
                  resizeMode="cover"
                />
                <View style={styles.bannerOverlay}>
                  <Text style={styles.bannerTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
          {/* Dots */}
          <View style={styles.bannerDots}>
            {bannerSlides.map((_, i) => (
              <View
                key={i}
                style={[styles.bannerDot, activeBanner === i && styles.bannerDotActive]}
              />
            ))}
          </View>
        </View>

        {/* ── MORE FEED POSTS ── */}
        <View style={styles.feed}>
          {moreFeedPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
                <Text style={styles.postName}>{post.name}</Text>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>👤 Follow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.moreBtn}>
                  <Text style={styles.moreBtnText}>⋯</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.postText} numberOfLines={4}>
                {post.text}{" "}
                <Text style={styles.moreText}>More</Text>
              </Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── SEARCH MODAL ── */}
      <Modal
        visible={searchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSearchVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => { setSearchVisible(false); setSearchQuery(""); }} />
          <View style={styles.searchPanel}>
            <LinearGradient
              colors={["#1e0a3c", "#2d1b4e"]}
              style={StyleSheet.absoluteFill}
              borderRadius={24}
            />
            {/* Search header */}
            <View style={styles.searchHeader}>
              <Text style={styles.searchPanelTitle}>Search</Text>
              <TouchableOpacity onPress={() => { setSearchVisible(false); setSearchQuery(""); }} style={styles.searchCloseBtn}>
                <Text style={styles.searchCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Input row */}
            <View style={styles.searchInputRow}>
              <Text style={styles.searchInputIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search people, parties, games…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={searchQuery}
                onChangeText={handleSearchQuery}
                autoFocus
                selectionColor="#7c4dff"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <Text style={styles.searchClearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results or Suggestions */}
            {searchResults.length > 0 ? (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchSuggestLabel}>Search Results</Text>
                {searchResults.map((result) => (
                  <TouchableOpacity
                    key={result.id}
                    style={styles.searchResultItem}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (result.route) {
                        router.push(result.route);
                        setSearchVisible(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={result.colors || ["#3d1a6e", "#5b2d8e"]}
                      style={styles.resultIconBox}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.resultIcon}>
                        {result.type === "action" ? "🎮" : "✨"}
                      </Text>
                    </LinearGradient>
                    <View style={styles.resultTextCol}>
                      <Text style={styles.resultTitle}>{result.title}</Text>
                      {result.subtitle && (
                        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                      )}
                    </View>
                    <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : searchQuery.length === 0 ? (
              <>
                {/* Suggestions */}
                <View style={styles.searchSuggestSection}>
                  <Text style={styles.searchSuggestLabel}>Quick explore</Text>
                  <View style={styles.searchSuggestRow}>
                    {searchSuggestions.map((s) => (
                      <TouchableOpacity key={s} style={styles.searchChip} activeOpacity={0.8}>
                        <LinearGradient
                          colors={["#3d1a6e", "#5b2d8e"]}
                          style={styles.searchChipGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <Text style={styles.searchChipText}>{s}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Trending section */}
                <View style={styles.searchSuggestSection}>
                  <Text style={styles.searchSuggestLabel}>Trending now 🔥</Text>
                  {["#VoiceParty", "#BlindDate", "#TruthOrDare", "#TukTukGames"].map(
                    (tag) => (
                      <View key={tag} style={styles.trendingRow}>
                        <View style={styles.trendingDot} />
                        <Text style={styles.trendingTag}>{tag}</Text>
                      </View>
                    )
                  )}
                </View>
              </>
            ) : (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsText}>No results found</Text>
                <Text style={styles.noResultsSubtext}>Try searching for features like Voice Party, Games, or People</Text>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── GIFT MODAL ── */}
      <Modal
        visible={giftsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setGiftsVisible(false)}
      >
        <View style={styles.giftsOverlay}>
          <TouchableOpacity
            style={styles.giftBackdrop}
            activeOpacity={1}
            onPress={() => setGiftsVisible(false)}
          />
          <SafeAreaView style={styles.giftsPanel}>
            <LinearGradient
              colors={["#1a0a2e", "#16082a", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Header */}
            <View style={styles.giftsHeader}>
              <Text style={styles.giftsTitle}>Daily Gifts</Text>
              <TouchableOpacity
                onPress={() => setGiftsVisible(false)}
                style={styles.giftCloseBtn}
              >
                <Text style={styles.giftCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Free Gift Info */}
            <View style={styles.freeGiftBanner}>
              <LinearGradient
                colors={["#ffb700", "#ff9500"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.freeGiftGradient}
              >
                <View style={styles.freeGiftContent}>
                  <Text style={styles.freeGiftEmoji}>🎉</Text>
                  <View style={styles.freeGiftText}>
                    <Text style={styles.freeGiftTitle}>Free Gift Daily!</Text>
                    <Text style={styles.freeGiftSubtitle}>
                      Claim one free gift every 24 hours
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Gifts Grid */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.giftsScrollContent}
            >
              <View style={styles.giftsGrid}>
                {gifts.map((gift) => (
                  <TouchableOpacity
                    key={gift.id}
                    style={styles.giftCard}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={gift.colors}
                      style={styles.giftCardGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                      <Text style={styles.giftName}>{gift.name}</Text>
                      <Text style={styles.giftValue}>+{gift.value}</Text>
                      <Text style={styles.giftDescription}>{gift.description}</Text>
                      {gift.isFree && (
                        <View style={styles.freeTag}>
                          <Text style={styles.freeTagText}>FREE</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── NOTIFICATION MODAL ── */}
      <Modal
        visible={notifVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifVisible(false)}
      >
        <View style={styles.notifOverlay}>
          <TouchableOpacity style={styles.notifBackdrop} activeOpacity={1} onPress={() => setNotifVisible(false)} />
          <SafeAreaView style={styles.notifPanel}>
            <LinearGradient
              colors={["#1a0a2e", "#16082a", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />
            {/* Header */}
            <View style={styles.notifHeader}>
              <Text style={styles.notifTitle}>Notifications</Text>
              <View style={styles.notifHeaderRight}>
                <TouchableOpacity
                  style={styles.notifMarkAll}
                  onPress={handleMarkAllRead}
                >
                  <Text style={styles.notifMarkAllText}>Mark all read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setNotifVisible(false)} style={styles.notifCloseBtn}>
                  <Text style={styles.notifCloseTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Divider */}
            <LinearGradient
              colors={["transparent", "#7c4dff", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.notifDivider}
            />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
              {notifications.map((notif) => (
                <TouchableOpacity
                  key={notif.id}
                  style={[
                    styles.notifItem,
                    unreadNotifications.includes(notif.id) && styles.notifItemUnread,
                  ]}
                  activeOpacity={0.8}
                >
                  {unreadNotifications.includes(notif.id) && (
                    <View style={styles.unreadDot} />
                  )}
                  {/* Avatar or icon bubble */}
                  {notif.avatar ? (
                    <View style={styles.notifAvatarWrapper}>
                      <Image source={{ uri: notif.avatar }} style={styles.notifAvatar} />
                      <View style={styles.notifIconBubble}>
                        <Text style={styles.notifIconBubbleTxt}>{notif.icon}</Text>
                      </View>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={["#3d1a6e", "#7c4dff"]}
                      style={styles.notifSystemIcon}
                    >
                      <Text style={{ fontSize: 20 }}>{notif.icon}</Text>
                    </LinearGradient>
                  )}

                  {/* Text */}
                  <View style={styles.notifTextCol}>
                    <Text style={styles.notifItemTitle}>{notif.title}</Text>
                    <Text style={styles.notifItemSub} numberOfLines={1}>
                      {notif.subtitle}
                    </Text>
                    <Text style={styles.notifTime}>{notif.time}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </SafeAreaView>
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

  // Background orbs (same as login)
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: "rgba(255,0,128,0.18)",
    shadowColor: "#ff0080",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },
  orbPurple: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -120,
    right: -120,
    borderRadius: 175,
    backgroundColor: "rgba(138,43,226,0.22)",
    shadowColor: "#8a2be2",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
  },

  // Header glass card
  headerCard: {
    marginTop: 20,
    marginHorizontal: H_PAD,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatarWrapper: {
    position: "relative",
  },
  headerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#00e676",
    borderWidth: 2,
    borderColor: "#1a0a2e",
  },
  headerTitleCol: {
    flex: 1,
  },
  helloText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  appName: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    lineHeight: 26,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diamondPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(80,50,160,0.6)",
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.5)",
    gap: 3,
  },
  diamondEmoji: { fontSize: 12 },
  diamondCount: {
    color: "white",
    fontSize: 12,
    fontWeight: "700",
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconEmoji: { fontSize: 16 },
  headerIconBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
    borderWidth: 1.5,
    borderColor: "#0d0618",
  },
  headerIconBadgeText: {
    color: "white",
    fontSize: 8,
    fontWeight: "800",
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  // Active now row
  activeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d63384",
    borderRadius: 28,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 7,
  },
  matchAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  matchWaves: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  matchWaveBar: {
    width: 3,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 2,
  },
  activeTextCol: {
    flex: 1,
  },
  activeNumber: {
    color: "#4eff91",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 19,
  },
  activeLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    lineHeight: 14,
  },
  matchArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: { fontSize: 18 },

  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // 2×2 Action grid — all equal size
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
    marginBottom: 14,
    justifyContent: "center",
  },
  actionCard: {
    width: CARD_SIZE,
    height: CARD_SIZE * 1.15,
    borderRadius: 20,
    overflow: "hidden",
  },
  actionCardGradient: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
  },
  cardTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    marginBottom: 4,
  },
  waveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 8,
  },
  waveBar: {
    width: 4,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 2,
  },
  cardIllustration: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: CARD_SIZE * 0.48,
    height: CARD_SIZE * 0.48,
  },

  // Icon row
  iconContainer: { marginBottom: 14 },
  iconScroll: {
    paddingHorizontal: H_PAD,
    gap: 14,
  },
  iconItem: {
    alignItems: "center",
    width: 76,
  },
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconImg: { width: 44, height: 44 },
  iconLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 14,
  },

  // Tabs
  tabsBar: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  tabsScroll: {
    paddingHorizontal: H_PAD,
    gap: 22,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    paddingBottom: 2,
  },
  tabText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15,
    fontWeight: "500",
  },
  tabActive: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },
  tabUnderline: {
    width: "100%",
    height: 3,
    backgroundColor: "#7c4dff",
    borderRadius: 3,
    marginTop: 6,
  },

  // Active now panel (unused legacy — kept for reference)
  activePanel: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: H_PAD,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(78,255,145,0.2)",
  },

  // Feed
  feed: {
    paddingHorizontal: H_PAD,
    gap: 10,
  },
  postCard: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  postName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  followBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  followBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  moreBtn: { paddingHorizontal: 4 },
  moreBtnText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 18,
    letterSpacing: 1,
  },
  postText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  moreText: {
    color: "#7c4dff",
    fontWeight: "600",
  },
  videoBox: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: {
    color: "white",
    fontSize: 20,
    marginLeft: 3,
  },
  videoDuration: {
    position: "absolute",
    bottom: 10,
    right: 12,
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },

  // Recommend users
  recommendSection: {
    paddingHorizontal: H_PAD,
    marginBottom: 16,
    marginTop: 4,
  },
  recommendTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 14,
  },
  recommendScroll: {
    gap: 16,
    paddingRight: 8,
  },
  recommendItem: {
    alignItems: "center",
    width: 76,
  },
  recommendAvatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    marginBottom: 8,
  },
  recommendAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 33,
  },
  recommendName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "center",
    fontWeight: "500",
  },

  // Banner Slider
  bannerWrapper: {
    marginHorizontal: H_PAD,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerSlide: {
    width: SCREEN_WIDTH - H_PAD * 2,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
  },
  bannerImg: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  bannerTitle: {
    color: "#ffd700",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bannerDots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: "#7c4dff",
  },

  // ── SEARCH MODAL ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  searchPanel: {
    marginHorizontal: 14,
    borderRadius: 24,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  searchHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  searchPanelTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  searchCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  searchInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 20,
  },
  searchInputIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 15,
    fontWeight: "500",
  },
  searchClearBtn: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  searchSuggestSection: { marginBottom: 18 },
  searchSuggestLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  searchSuggestRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  searchChip: {
    borderRadius: 20,
    overflow: "hidden",
  },
  searchChipGradient: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  searchChipText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
  },
  trendingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  trendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7c4dff",
  },
  trendingTag: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: "600",
  },

  // ── NOTIFICATION MODAL ──
  notifOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  notifBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  notifPanel: {
    height: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },
  notifTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  notifHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  notifMarkAll: {
    backgroundColor: "rgba(124,77,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  notifMarkAllText: {
    color: "#a47dff",
    fontSize: 12,
    fontWeight: "600",
  },
  notifCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  notifDivider: {
    height: 1,
    marginBottom: 6,
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  notifItemUnread: {
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  unreadDot: {
    position: "absolute",
    left: 8,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#7c4dff",
  },
  notifAvatarWrapper: {
    width: 50,
    height: 50,
    position: "relative",
  },
  notifAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "rgba(124,77,255,0.5)",
  },
  notifIconBubble: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#1a0a2e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.4)",
  },
  notifIconBubbleTxt: { fontSize: 12 },
  notifSystemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  notifTextCol: { flex: 1 },
  notifItemTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  notifItemSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    marginBottom: 4,
  },
  notifTime: {
    color: "#7c4dff",
    fontSize: 11,
    fontWeight: "600",
  },

  // ── SEARCH RESULTS ──
  searchResultsSection: {
    marginBottom: 18,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    gap: 12,
  },
  resultIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  resultIcon: {
    fontSize: 20,
  },
  resultTextCol: {
    flex: 1,
  },
  resultTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  resultSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  noResultsEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  noResultsText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  noResultsSubtext: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 30,
    lineHeight: 18,
  },

  // ── GIFT MODAL ──
  giftsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  giftBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  giftsPanel: {
    height: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  giftsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },
  giftsTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  giftCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  giftCloseTxt: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "700",
  },
  freeGiftBanner: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  freeGiftGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  freeGiftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  freeGiftEmoji: {
    fontSize: 32,
  },
  freeGiftText: {
    flex: 1,
  },
  freeGiftTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  freeGiftSubtitle: {
    color: "rgba(0,0,0,0.7)",
    fontSize: 12,
    fontWeight: "500",
  },
  giftsScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  giftsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  giftCard: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    aspectRatio: 1,
  },
  giftCardGradient: {
    flex: 1,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  giftEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  giftName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  giftValue: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  giftDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    textAlign: "center",
    marginBottom: 8,
  },
  freeTag: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  freeTagText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
});
