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
} from "react-native";
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
    route: "/chat",
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

export default function Home() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState("For You");
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerRef = useRef(null);

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
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8}>
                <Text style={styles.headerIconEmoji}>🎁</Text>
                <View style={[styles.headerIconBadge, { backgroundColor: "#ff3f72" }]}>
                  <Text style={styles.headerIconBadgeText}>!</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} activeOpacity={0.8}>
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
            <TouchableOpacity style={styles.searchBtn} activeOpacity={0.8}>
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
              onPress={() => setSelectedTab(tab)}
              style={styles.tabItem}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabActive]}>
                {tab}
              </Text>
              {selectedTab === tab && <View style={styles.tabUnderline} />}
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
});
