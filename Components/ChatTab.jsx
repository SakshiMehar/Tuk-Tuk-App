import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, UserPlus, X, Check, ChevronDown, AlignJustify } from "lucide-react-native";
import { useRouter } from "expo-router";

const { width: W } = Dimensions.get("window");

// ── Mock data ──────────────────────────────────────────────────────────────

const featureCards = [
  {
    id: "fc1",
    label: "Voice Party",
    emoji: "🎙️",
    colors: ["#ff8c00", "#ffb347"],
    badge: null,
    borderColors: ["#ff8c00", "#ffd700"],
  },
  {
    id: "fc2",
    label: "Game",
    emoji: "🎮",
    colors: ["#3a1fa0", "#7c4dff"],
    badge: null,
    borderColors: ["#7c4dff", "#a78bfa"],
  },
  {
    id: "fc3",
    label: "Followers",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    colors: null,
    badge: 67,
    borderColors: ["#00c853", "#69f0ae"],
  },
  {
    id: "fc4",
    label: "Visitors",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    colors: null,
    badge: 84,
    borderColors: ["#f953c6", "#b91d73"],
  },
  {
    id: "fc5",
    label: "Nearby",
    emoji: "📍",
    colors: ["#f7971e", "#ffd200"],
    badge: null,
    borderColors: ["#f7971e", "#ffd200"],
  },
  {
    id: "fc6",
    label: "Moments",
    emoji: "✨",
    colors: ["#0d2952", "#4a6cf7"],
    badge: 12,
    borderColors: ["#4a6cf7", "#a78bfa"],
  },
];

const recommendedUsers = [
  {
    id: "ru1",
    name: "do yo...",
    avatar: "https://randomuser.me/api/portraits/men/21.jpg",
    ringColors: ["#7c4dff", "#a78bfa"],
  },
  {
    id: "ru2",
    name: "Sachin...",
    avatar: "https://randomuser.me/api/portraits/men/34.jpg",
    ringColors: ["#4a6cf7", "#7c4dff"],
  },
  {
    id: "ru3",
    name: "ALONE...",
    avatar: "https://randomuser.me/api/portraits/women/55.jpg",
    ringColors: ["#f953c6", "#7c4dff"],
  },
  {
    id: "ru4",
    name: "(Deep)/(...",
    avatar: "https://randomuser.me/api/portraits/men/67.jpg",
    ringColors: ["#7c4dff", "#4a6cf7"],
  },
  {
    id: "ru5",
    name: "Riya 🌸",
    avatar: "https://randomuser.me/api/portraits/women/22.jpg",
    ringColors: ["#ff4ea3", "#a78bfa"],
  },
];

const chatList = [
  {
    id: "ch1",
    name: "Amit yadav ji",
    avatar: "https://randomuser.me/api/portraits/men/11.jpg",
    lastMsg: "[Share]",
    time: "2:42 AM",
    unread: 2,
    verified: true,
    live: true,
    liked: true,
  },
  {
    id: "ch2",
    name: "thakor and thakor",
    avatar: "https://randomuser.me/api/portraits/men/55.jpg",
    lastMsg: "hi",
    time: "12:09 AM",
    unread: 0,
    verified: false,
    live: false,
    liked: false,
  },
  {
    id: "ch3",
    name: "goopu thakor",
    avatar: "https://randomuser.me/api/portraits/men/66.jpg",
    lastMsg: "Hello! Sab kuch theek h...",
    time: "Yesterday",
    unread: 0,
    verified: true,
    live: false,
    liked: false,
  },
  {
    id: "ch4",
    name: "Priya Sharma",
    avatar: "https://randomuser.me/api/portraits/women/33.jpg",
    lastMsg: "😍 sent a gift",
    time: "Yesterday",
    unread: 0,
    verified: false,
    live: false,
    liked: true,
  },
  {
    id: "ch5",
    name: "Raj Kumar",
    avatar: "https://randomuser.me/api/portraits/men/77.jpg",
    lastMsg: "okay bro 👍",
    time: "Mon",
    unread: 0,
    verified: true,
    live: false,
    liked: false,
  },
  {
    id: "ch6",
    name: "Sneha Patel",
    avatar: "https://randomuser.me/api/portraits/women/88.jpg",
    lastMsg: "Come to my room!",
    time: "Sun",
    unread: 0,
    verified: false,
    live: true,
    liked: true,
  },
  {
    id: "ch7",
    name: "DJ Badshah",
    avatar: "https://randomuser.me/api/portraits/men/42.jpg",
    lastMsg: "🎵 voice message",
    time: "Sat",
    unread: 0,
    verified: true,
    live: false,
    liked: false,
  },
];

// ── Contacts data ─────────────────────────────────────────────────────────

const contactMenuItems = [
  { id: "friends",   label: "Friends",   emoji: "👥", iconBg: ["#1a2a6c", "#4a6cf7"], count: null },
  { id: "followers", label: "Followers", emoji: "🫂", iconBg: ["#3a1080", "#7c4dff"], count: 62   },
  { id: "following", label: "Following", emoji: "⭐", iconBg: ["#7c2d00", "#ff8c00"], count: 4    },
  { id: "family",    label: "Family",    emoji: "🏠", iconBg: ["#064e3b", "#00c853"], count: null },
];

const contactsData = {
  friends: [
    { id: "f1", name: "Amit yadav ji",    handle: "@amit_yadav",    avatar: "https://randomuser.me/api/portraits/men/11.jpg",    online: true,  verified: true  },
    { id: "f2", name: "Priya Sharma",     handle: "@priya_s",       avatar: "https://randomuser.me/api/portraits/women/33.jpg",  online: true,  verified: false },
    { id: "f3", name: "Raj Kumar",        handle: "@rajkumar99",    avatar: "https://randomuser.me/api/portraits/men/77.jpg",    online: false, verified: true  },
    { id: "f4", name: "Sneha Patel",      handle: "@sneha_p",       avatar: "https://randomuser.me/api/portraits/women/88.jpg",  online: true,  verified: false },
    { id: "f5", name: "DJ Badshah",       handle: "@djbadshah",     avatar: "https://randomuser.me/api/portraits/men/42.jpg",    online: false, verified: true  },
    { id: "f6", name: "goopu thakor",     handle: "@goopu_t",       avatar: "https://randomuser.me/api/portraits/men/66.jpg",    online: true,  verified: true  },
  ],
  followers: [
    { id: "fl1", name: "Sachin Verma",   handle: "@sachinv",       avatar: "https://randomuser.me/api/portraits/men/34.jpg",    online: true,  verified: false, followBack: false },
    { id: "fl2", name: "Riya 🌸",        handle: "@riya_bloom",    avatar: "https://randomuser.me/api/portraits/women/22.jpg",  online: true,  verified: false, followBack: true  },
    { id: "fl3", name: "Deep Singh",     handle: "@deepsingh",     avatar: "https://randomuser.me/api/portraits/men/67.jpg",    online: false, verified: true,  followBack: false },
    { id: "fl4", name: "Kavya Nair",     handle: "@kavyanair",     avatar: "https://randomuser.me/api/portraits/women/44.jpg",  online: true,  verified: false, followBack: false },
    { id: "fl5", name: "Arjun Mehta",    handle: "@arjunm",        avatar: "https://randomuser.me/api/portraits/men/21.jpg",    online: false, verified: false, followBack: true  },
    { id: "fl6", name: "Simran Kaur",    handle: "@simran_k",      avatar: "https://randomuser.me/api/portraits/women/55.jpg",  online: true,  verified: true,  followBack: false },
    { id: "fl7", name: "Rohit Sharma",   handle: "@rohit_s",       avatar: "https://randomuser.me/api/portraits/men/55.jpg",    online: false, verified: false, followBack: false },
  ],
  following: [
    { id: "fw1", name: "Raj Kumar",      handle: "@rajkumar99",    avatar: "https://randomuser.me/api/portraits/men/77.jpg",    online: false, verified: true  },
    { id: "fw2", name: "DJ Badshah",     handle: "@djbadshah",     avatar: "https://randomuser.me/api/portraits/men/42.jpg",    online: false, verified: true  },
    { id: "fw3", name: "Amit yadav ji",  handle: "@amit_yadav",    avatar: "https://randomuser.me/api/portraits/men/11.jpg",    online: true,  verified: true  },
    { id: "fw4", name: "Deep Singh",     handle: "@deepsingh",     avatar: "https://randomuser.me/api/portraits/men/67.jpg",    online: false, verified: true  },
  ],
  family: [
    { id: "fm1", name: "Mom 💖",         handle: "@family_mom",    avatar: "https://randomuser.me/api/portraits/women/60.jpg",  online: true,  verified: false },
    { id: "fm2", name: "Bhai Sahab",     handle: "@bhai_sahab",    avatar: "https://randomuser.me/api/portraits/men/60.jpg",    online: false, verified: false },
    { id: "fm3", name: "Choti Didi",     handle: "@choti_didi",    avatar: "https://randomuser.me/api/portraits/women/70.jpg",  online: true,  verified: false },
  ],
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ChatTab() {
  const router = useRouter();
  const [activeTopTab, setActiveTopTab] = useState("Chats");
  const [searchText, setSearchText] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [chatFilter, setChatFilter] = useState("All");
  const [contactsPage, setContactsPage] = useState(null); // null | "friends"|"followers"|"following"|"family"
  const [contactSearch, setContactSearch] = useState("");
  const [followedBack, setFollowedBack] = useState({});

  const filteredChats = chatList.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0720" />

      {/* ── TOP HEADER ── */}
      <LinearGradient colors={["#160d30", "#0f0720"]} style={styles.header}>
        {contactsPage ? (
          /* Sub-page header */
          <View style={styles.subPageHeader}>
            <TouchableOpacity
              style={styles.backBtn}
              activeOpacity={0.8}
              onPress={() => { setContactsPage(null); setContactSearch(""); }}
            >
              <Text style={styles.backArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.subPageTitle}>
              {contactMenuItems.find((m) => m.id === contactsPage)?.label}
            </Text>
            <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
              <UserPlus size={20} color="#a78bfa" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Chats / Contacts tabs */}
            <View style={styles.headerTabs}>
              {["Chats", "Contacts"].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={styles.headerTabBtn}
                  activeOpacity={0.8}
                  onPress={() => { setActiveTopTab(tab); setContactsPage(null); }}
                >
                  <Text style={[styles.headerTabText, activeTopTab === tab && styles.headerTabTextActive]}>
                    {tab}
                  </Text>
                  {activeTopTab === tab && <View style={styles.headerTabUnderline} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Search + Add */}
            <View style={styles.headerActions}>
              <View style={styles.searchBar}>
                <Search size={15} color="rgba(167,139,250,0.6)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(167,139,250,0.45)"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
                <UserPlus size={20} color="#a78bfa" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

        {/* ══════════ CONTACTS TAB ══════════ */}
        {activeTopTab === "Contacts" && !contactsPage && (
          <View style={styles.contactsMenu}>
            {contactMenuItems.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.contactMenuItem, idx === contactMenuItems.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.75}
                onPress={() => { setContactsPage(item.id); setContactSearch(""); }}
              >
                <LinearGradient colors={item.iconBg} style={styles.contactMenuIcon}>
                  <Text style={styles.contactMenuEmoji}>{item.emoji}</Text>
                </LinearGradient>
                <Text style={styles.contactMenuLabel}>{item.label}</Text>
                <View style={styles.contactMenuRight}>
                  {item.count !== null && (
                    <Text style={styles.contactMenuCount}>{item.count}</Text>
                  )}
                  <Text style={styles.contactMenuChevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTopTab === "Contacts" && contactsPage && (
          <View style={{ flex: 1 }}>
            {/* Search bar */}
            <View style={styles.contactSearchWrap}>
              <View style={styles.contactSearchBar}>
                <Search size={15} color="rgba(167,139,250,0.55)" />
                <TextInput
                  style={styles.contactSearchInput}
                  placeholder={`Search ${contactMenuItems.find((m) => m.id === contactsPage)?.label}`}
                  placeholderTextColor="rgba(167,139,250,0.4)"
                  value={contactSearch}
                  onChangeText={setContactSearch}
                />
                {contactSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setContactSearch("")}>
                    <X size={14} color="rgba(167,139,250,0.5)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Contact list */}
            <View style={styles.contactList}>
              {(contactsData[contactsPage] || [])
                .filter((u) => u.name.toLowerCase().includes(contactSearch.toLowerCase()))
                .map((user, idx, arr) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[styles.contactItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                    activeOpacity={0.75}
                    onPress={() =>
                      router.push({
                        pathname: "/chat-box",
                        params: { name: user.name, avatar: user.avatar, matchPercent: 90, interests: "Music", location: "India", likeCount: 0 },
                      })
                    }
                  >
                    {/* Avatar */}
                    <View style={styles.contactAvatarWrap}>
                      <LinearGradient
                        colors={["#7c4dff", "#4a6cf7"]}
                        style={styles.contactAvatarRing}
                      >
                        <Image source={{ uri: user.avatar }} style={styles.contactAvatar} />
                      </LinearGradient>
                      {user.online && <View style={styles.onlineDot} />}
                    </View>

                    {/* Info */}
                    <View style={styles.contactInfo}>
                      <View style={styles.contactNameRow}>
                        <Text style={styles.contactName} numberOfLines={1}>{user.name}</Text>
                        {user.verified && (
                          <View style={styles.verifiedBadge}>
                            <Check size={9} color="white" strokeWidth={3} />
                          </View>
                        )}
                      </View>
                      <Text style={styles.contactHandle} numberOfLines={1}>{user.handle}</Text>
                    </View>

                    {/* Action button */}
                    {contactsPage === "followers" && !user.followBack ? (
                      <TouchableOpacity
                        style={styles.followBackBtn}
                        activeOpacity={0.8}
                        onPress={() => setFollowedBack((prev) => ({ ...prev, [user.id]: !prev[user.id] }))}
                      >
                        <LinearGradient
                          colors={followedBack[user.id] ? ["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"] : ["#7c4dff", "#4a6cf7"]}
                          style={styles.followBackGrad}
                        >
                          <Text style={[styles.followBackText, followedBack[user.id] && { color: "#a78bfa" }]}>
                            {followedBack[user.id] ? "Following" : "Follow Back"}
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.msgBtn}
                        activeOpacity={0.8}
                        onPress={() =>
                          router.push({
                            pathname: "/chat-box",
                            params: { name: user.name, avatar: user.avatar, matchPercent: 90, interests: "Music", location: "India", likeCount: 0 },
                          })
                        }
                      >
                        <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.msgBtnGrad}>
                          <Text style={styles.msgBtnText}>Message</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}

              {(contactsData[contactsPage] || []).filter((u) =>
                u.name.toLowerCase().includes(contactSearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.emptyContacts}>
                  <Text style={styles.emptyContactsEmoji}>🔍</Text>
                  <Text style={styles.emptyContactsText}>No results found</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ══════════ CHATS TAB ══════════ */}
        {activeTopTab === "Chats" && (
          <>
        {/* ── NOTIFICATION BANNER ── */}
        {showBanner && (
          <View style={styles.bannerWrap}>
            <LinearGradient
              colors={["rgba(124,77,255,0.18)", "rgba(74,108,247,0.18)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.banner}
            >
              <View style={styles.bannerIconWrap}>
                <Text style={styles.bannerIconEmoji}>📬</Text>
              </View>
              <Text style={styles.bannerText}>
                Tap "Allow" and never miss the amazing people and moments on TukTuk!
              </Text>
              <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.8}>
                <Text style={styles.bannerBtnText}>Notify me</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.bannerClose} activeOpacity={0.8} onPress={() => setShowBanner(false)}>
                <X size={14} color="rgba(167,139,250,0.6)" />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* ── FEATURE CARDS ROW ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.featureScroll}
          contentContainerStyle={styles.featureContent}
        >
          {featureCards.map((card) => (
            <TouchableOpacity key={card.id} style={styles.featureCard} activeOpacity={0.8}>
              {/* Gradient border ring */}
              <LinearGradient
                colors={card.borderColors}
                style={styles.featureRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.featureInner}>
                  {card.avatar ? (
                    <Image source={{ uri: card.avatar }} style={styles.featureAvatar} blurRadius={2} />
                  ) : (
                    <LinearGradient colors={card.colors} style={styles.featureEmojiWrap}>
                      <Text style={styles.featureEmoji}>{card.emoji}</Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
              {/* Badge */}
              {card.badge !== null && (
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>{card.badge}</Text>
                </View>
              )}
              <Text style={styles.featureLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── RECOMMENDED USERS ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommend user in the room</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recommendScroll}
          contentContainerStyle={styles.recommendContent}
        >
          {recommendedUsers.map((user) => (
            <TouchableOpacity key={user.id} style={styles.recommendCard} activeOpacity={0.8}>
              <LinearGradient
                colors={user.ringColors}
                style={styles.recommendRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image source={{ uri: user.avatar }} style={styles.recommendAvatar} />
              </LinearGradient>
              <View style={styles.recommendNameRow}>
                <Text style={styles.recommendName} numberOfLines={1}>{user.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── CHATLIST HEADER ── */}
        <View style={styles.chatlistHeader}>
          <Text style={styles.chatlistTitle}>Chatlist</Text>
          <View style={styles.chatlistActions}>
            <TouchableOpacity
              style={styles.filterBtn}
              activeOpacity={0.8}
              onPress={() => setChatFilter(chatFilter === "All" ? "Unread" : "All")}
            >
              <LinearGradient
                colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]}
                style={styles.filterBtnGrad}
              >
                <Text style={styles.filterBtnText}>{chatFilter}</Text>
                <ChevronDown size={13} color="#a78bfa" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
              <AlignJustify size={18} color="rgba(167,139,250,0.6)" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── CHAT LIST ── */}
        <View style={styles.chatList}>
          {(chatFilter === "Unread"
            ? filteredChats.filter((c) => c.unread > 0)
            : filteredChats
          ).map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.chatItem, idx === 0 && styles.chatItemFirst]}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/chat-box",
                  params: {
                    name: item.name,
                    avatar: item.avatar,
                    matchPercent: 95,
                    interests: "TV shows,Music",
                    location: "Indore",
                    likeCount: 0,
                  },
                })
              }
            >
              {/* Avatar */}
              <View style={styles.chatAvatarWrap}>
                <LinearGradient
                  colors={["#7c4dff", "#4a6cf7"]}
                  style={styles.chatAvatarRing}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
                </LinearGradient>
                {item.live && (
                  <View style={styles.liveBadge}>
                    <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.liveBadgeGrad}>
                      <Text style={styles.liveBadgeText}>Live</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>

              {/* Content */}
              <View style={styles.chatContent}>
                <View style={styles.chatTopRow}>
                  <View style={styles.chatNameRow}>
                    <Text style={styles.chatName} numberOfLines={1}>{item.name}</Text>
                    {item.verified && (
                      <View style={styles.verifiedBadge}>
                        <Check size={9} color="white" strokeWidth={3} />
                      </View>
                    )}
                    {item.liked && <Text style={styles.heartIcon}>🤍</Text>}
                  </View>
                  <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatBottomRow}>
                  <Text style={styles.chatLastMsg} numberOfLines={1}>{item.lastMsg}</Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 30 }} />
          </>
        )}

      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f0720",
  },

  // Header
  header: {
    paddingTop: 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  headerTabs: {
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  headerTabBtn: {
    alignItems: "center",
    paddingBottom: 2,
  },
  headerTabText: {
    fontSize: 20,
    fontWeight: "700",
    color: "rgba(255,255,255,0.35)",
  },
  headerTabTextActive: {
    color: "white",
  },
  headerTabUnderline: {
    marginTop: 4,
    height: 3,
    width: "80%",
    borderRadius: 2,
    backgroundColor: "#7c4dff",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 14,
    padding: 0,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Body
  body: { flex: 1 },

  // Banner
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    borderRadius: 16,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconEmoji: { fontSize: 24 },
  bannerText: {
    flex: 1,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    lineHeight: 18,
  },
  bannerBtn: {
    backgroundColor: "#7c4dff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bannerBtnText: { color: "white", fontSize: 12, fontWeight: "700" },
  bannerClose: {
    position: "absolute",
    top: 8,
    right: 8,
    padding: 4,
  },

  // Feature cards
  featureScroll: { marginTop: 18 },
  featureContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  featureCard: {
    alignItems: "center",
    gap: 8,
    position: "relative",
  },
  featureRing: {
    width: 76,
    height: 76,
    borderRadius: 20,
    padding: 2.5,
  },
  featureInner: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#0f0720",
  },
  featureAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  featureEmojiWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  featureEmoji: { fontSize: 32 },
  featureBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ff4757",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    borderWidth: 1.5,
    borderColor: "#0f0720",
  },
  featureBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  featureLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 76,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },

  // Recommended users
  recommendScroll: {},
  recommendContent: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 4,
  },
  recommendCard: {
    alignItems: "center",
    gap: 8,
    width: 72,
  },
  recommendRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
  },
  recommendAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 34,
    borderWidth: 2,
    borderColor: "#0f0720",
  },
  recommendNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recommendName: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    width: 72,
  },

  // Chatlist header
  chatlistHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  chatlistTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },
  chatlistActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  filterBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  filterBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  filterBtnText: { color: "#a78bfa", fontSize: 13, fontWeight: "700" },
  menuBtn: {
    padding: 4,
  },

  // Chat items
  chatList: {
    paddingHorizontal: 16,
    gap: 2,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.08)",
  },
  chatItemFirst: {},
  chatAvatarWrap: {
    position: "relative",
  },
  chatAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
  },
  chatAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "#0f0720",
  },
  liveBadge: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    transform: [{ translateX: -16 }],
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#0f0720",
  },
  liveBadgeGrad: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  liveBadgeText: { color: "white", fontSize: 9, fontWeight: "800" },
  chatContent: {
    flex: 1,
    gap: 5,
  },
  chatTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  chatName: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    flexShrink: 1,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4a6cf7",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: { fontSize: 13 },
  chatTime: {
    color: "rgba(167,139,250,0.55)",
    fontSize: 12,
    fontWeight: "500",
  },
  chatBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatLastMsg: {
    flex: 1,
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff4757",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  unreadText: { color: "white", fontSize: 11, fontWeight: "800" },

  // Sub-page header
  subPageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: "white", fontSize: 28, lineHeight: 34, fontWeight: "300" },
  subPageTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  // Contacts menu
  contactsMenu: {
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  contactMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.1)",
  },
  contactMenuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactMenuEmoji: { fontSize: 22 },
  contactMenuLabel: { flex: 1, color: "white", fontSize: 16, fontWeight: "600" },
  contactMenuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactMenuCount: { color: "rgba(167,139,250,0.6)", fontSize: 15, fontWeight: "600" },
  contactMenuChevron: { color: "rgba(167,139,250,0.5)", fontSize: 22, fontWeight: "300" },

  // Contact search
  contactSearchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  contactSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124,77,255,0.1)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contactSearchInput: { flex: 1, color: "white", fontSize: 14, padding: 0 },

  // Contact list
  contactList: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.08)",
  },
  contactAvatarWrap: { position: "relative" },
  contactAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
  },
  contactAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "#0f0720",
  },
  onlineDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#00c853",
    borderWidth: 2,
    borderColor: "#0f0720",
  },
  contactInfo: { flex: 1, gap: 3 },
  contactNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  contactName: { color: "white", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  contactHandle: { color: "rgba(167,139,250,0.55)", fontSize: 12 },

  // Action buttons
  followBackBtn: { borderRadius: 20, overflow: "hidden" },
  followBackGrad: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  followBackText: { color: "white", fontSize: 12, fontWeight: "700" },
  msgBtn: { borderRadius: 20, overflow: "hidden" },
  msgBtnGrad: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  msgBtnText: { color: "#a78bfa", fontSize: 12, fontWeight: "700" },

  // Empty state
  emptyContacts: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyContactsEmoji: { fontSize: 36 },
  emptyContactsText: { color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "500" },
});
