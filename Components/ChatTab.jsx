import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Search, Plus, X, Check, ChevronDown, AlignJustify } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { getRecommendedUsers } from "../src/services/homeService";
import { loadConversations } from "../src/services/chatService";
import { wsService } from "../src/services/websocket";
import { openUserChat } from "../src/utils/chatNavigation";
import { openUserProfile } from "../src/utils/profileNavigation";
import { loadFamilyLists, loadFamilyDetail } from "../src/services/familyService";
import ComingSoonModal from "./ComingSoonModal";
import ProfileConnectionsModal from "./ProfileConnectionsModal";
import FamilyChatModal from "./FamilyChatModal";
import {
  loadFollowing,
  loadFollowers,
  followUser,
  isSameUser,
} from "../src/services/relationshipService";
import { getAppUserId } from "../src/utils/sessionUser";
import { isBundledAvatarId, getAvatarSource } from "../src/data/avatarOptions";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";

const RECOMMEND_RING_COLORS = ["#333333", "#888888"];

// Backend may send a bundled preset id (e.g. "avatar3") instead of a real
// image URL — resolve those to the local asset, otherwise treat as a URI.
const resolveAvatarSource = (avatar) =>
  isBundledAvatarId(avatar) ? getAvatarSource(avatar) : { uri: avatar };

// ── Mock data ──────────────────────────────────────────────────────────────

const featureCards = [
  {
    id: "fc1",
    label: "Voice Party",
    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/mic.png",
    colors: ["#2eebdbff", "#18b6c4ff"],
    badge: null,
    tint: "rgba(27, 169, 145, 0.15)",
    shadowColor: "#0fc9f3ff",
  },
  {
    id: "fc2",
    label: "Game",
    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/launch.png",
    colors: ["#5b21b6", "#7c4dff"],
    badge: null,
    tint: "rgba(124,77,255,0.15)",
    shadowColor: "#7c4dff",
  },
  {
    id: "fc3",
    label: "Followers",
    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/follower.png",
    colors: ["#133c72ff", "#163b60ff"],
    badge: null,
    tint: "rgba(0,200,83,0.15)",
    shadowColor: "#00c853",
  },
  {
    id: "fc4",
    label: "Visitors",
    emoji: "👀",
    colors: ["#9d0b6e", "#f953c6"],
    badge: null,
    tint: "rgba(249,83,198,0.15)",
    shadowColor: "#f953c6",
  },
  {
    id: "fc5",
    label: "Nearby",
    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/nearbyIcon.png",
    colors: ["#e65c00", "#ffd200"],
    badge: null,
    tint: "rgba(247,151,30,0.15)",
    shadowColor: "#f7971e",
  },
  {
    id: "fc6",
    label: "Moments",
    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/moments.png",
    colors: ["#1a3a8f", "#4a6cf7"],
    badge: null,
    tint: "rgba(74,108,247,0.15)",
    shadowColor: "#4a6cf7",
  },
];

// ── Contacts data ─────────────────────────────────────────────────────────

// ↓↓ Change this value to resize all contact menu icons at once ↓↓
const CONTACT_MENU_ICON_SIZE = 28;

const CONTACT_MENU_ITEMS = [
  { id: "friends",   label: "Friends",   icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png",     iconBg: ["#1a2a6c", "#4a6cf7"], iconSize: 70 },
  { id: "followers", label: "Followers", icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/follower.png", iconBg: ["#3a1080", "#7c4dff"], iconSize: 38 },
  { id: "following", label: "Following", icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/people.png",   iconBg: ["#7c2d00", "#ff8c00"], iconSize: 90 },
  { id: "family",    label: "Family",    icon: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/home.png",     iconBg: ["#064e3b", "#00c853"], iconSize: 40 },
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
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ChatTab() {
  const router = useRouter();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const [activeTopTab, setActiveTopTab] = useState("Chats");
  const [searchText, setSearchText] = useState("");
  const [showBanner, setShowBanner] = useState(true);
  const [chatFilter, setChatFilter] = useState("All");
  const [contactsPage, setContactsPage] = useState(null); // null | "friends"|"followers"|"following"|"family"
  const [contactSearch, setContactSearch] = useState("");
  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [myUserId, setMyUserId] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [followBackLoadingId, setFollowBackLoadingId] = useState(null);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [comingSoonFeature, setComingSoonFeature] = useState(null);
  const [connectionsModalType, setConnectionsModalType] = useState(null); // null | "followers" | "visitors"
  const [familyGroups, setFamilyGroups] = useState([]);
  const [familyGroupsLoading, setFamilyGroupsLoading] = useState(false);
  const [chatFamily, setChatFamily] = useState(null);

  const fetchChats = useCallback(() => {
    setChatsLoading(true);

    loadConversations()
      .then((list) => {
        setConversations(list);

      })
      .catch(() => setConversations([]))
      .finally(() => setChatsLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getRecommendedUsers()
      .then((users) => {
        if (!cancelled) {
          setRecommendedUsers(users);

        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
      wsService.connect().catch(() => {});
    }, [fetchChats])
  );

  useEffect(() => {
    const unsub = wsService.onMessage(() => {
      fetchChats();
    });
    return unsub;
  }, [fetchChats]);

  const handleOpenUserChat = (user) => {
    openUserChat(router, user);
  };

  const loadRelationshipLists = useCallback(async () => {
    setContactsLoading(true);
    try {
      const [following, followers, currentId] = await Promise.all([
        loadFollowing(),
        loadFollowers(),
        getAppUserId().catch(() => null),
      ]);
      setMyUserId(currentId);
      setFollowingList(following.filter((u) => !isSameUser(u.userId, currentId)));
      setFollowersList(followers.filter((u) => !isSameUser(u.userId, currentId)));
    } catch {
      setFollowingList([]);
      setFollowersList([]);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (
      activeTopTab === "Contacts" &&
      (contactsPage === "followers" || contactsPage === "following" || !contactsPage)
    ) {
      loadRelationshipLists();
    }
  }, [activeTopTab, contactsPage, loadRelationshipLists]);

  const loadFamilyGroups = useCallback(async () => {
    setFamilyGroupsLoading(true);
    try {
      const { existingFamilies, newFamilies } = await loadFamilyLists();
      const merged = [...existingFamilies, ...newFamilies].filter((f) => f.member);
      const deduped = Array.from(new Map(merged.map((f) => [String(f.id), f])).values());
      setFamilyGroups(deduped);
    } catch {
      setFamilyGroups([]);
    } finally {
      setFamilyGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTopTab === "Contacts" && contactsPage === "family") {
      loadFamilyGroups();
    }
  }, [activeTopTab, contactsPage, loadFamilyGroups]);

  const handleOpenFamilyGroup = useCallback(async (family) => {
    try {
      const detail = await loadFamilyDetail(family.id);
      setChatFamily(detail);
    } catch {
      setChatFamily(family);
    }
  }, []);

  const followingIdSet = useMemo(
    () => new Set(followingList.map((u) => String(u.userId ?? u.id))),
    [followingList]
  );

  const handleFeatureCardPress = (card) => {
    if (card.label === "Followers") setConnectionsModalType("followers");
    else if (card.label === "Visitors") setConnectionsModalType("visitors");
    else if (card.label === "Game") setComingSoonFeature("Game");
    else if (card.label === "Voice Party") router.push("/(tabs)/party");
    else if (card.label === "Nearby") router.push("/nearby");
    else if (card.label === "Moments") router.push("/(tabs)/profile");
  };

  const contactMenuItems = useMemo(
    () =>
      CONTACT_MENU_ITEMS.map((item) => ({
        ...item,
        count:
          item.id === "followers"
            ? followersList.length
            : item.id === "following"
              ? followingList.length
              : null,
      })),
    [followersList.length, followingList.length]
  );

  const getContactsForPage = useCallback(
    (page) => {
      if (page === "followers") return followersList;
      if (page === "following") return followingList;
      return (contactsData[page] || []).filter((u) => !isSameUser(u.id, myUserId));
    },
    [followersList, followingList, myUserId]
  );

  const handleFollowBack = async (user) => {
    const targetId = user?.userId ?? user?.id;
    if (!targetId || isSameUser(targetId, myUserId)) return;
    setFollowBackLoadingId(String(targetId));
    try {
      await followUser(targetId);
      await loadRelationshipLists();
    } catch {
      // keep UI unchanged on failure
    } finally {
      setFollowBackLoadingId(null);
    }
  };

  const filteredChats = conversations.filter((c) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return (
      c.name?.toLowerCase().includes(query) ||
      c.lastMsg?.toLowerCase().includes(query)
    );
  });

  const renderChatList = () => {
    if (chatsLoading) {
      return (
        <View style={styles.chatsLoading}>
          <ActivityIndicator size="small" color="#a78bfa" />
          <Text style={styles.chatsLoadingText}>Loading chats...</Text>
        </View>
      );
    }

    if (filteredChats.length === 0) {
      return (
        <View style={styles.chatsEmpty}>
          <Text style={styles.chatsEmptyText}>
            {chatFilter === "Unread" ? "No unread chats" : "No chats yet"}
          </Text>
        </View>
      );
    }

    const list =
      chatFilter === "Unread"
        ? filteredChats.filter((c) => c.unread > 0)
        : filteredChats;

    return list.map((item, idx) => (
      <TouchableOpacity
        key={String(item.userId ?? item.id ?? idx)}
        style={[styles.chatItem, idx === 0 && styles.chatItemFirst]}
        activeOpacity={0.75}
        onPress={() => handleOpenUserChat(item)}
      >
        <TouchableOpacity
          style={styles.chatAvatarWrap}
          activeOpacity={0.8}
          onPress={() => openUserProfile(router, item)}
        >
          <LinearGradient
            colors={item.vipProfileFrameUrl ? ["white", "white"] : ["#7c4dff", "#4a6cf7"]}
            style={styles.chatAvatarRing}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {item.avatar ? (
              <ProfileAvatarWithFrame
                avatarSource={resolveAvatarSource(item.avatar)}
                frameSource={item.vipProfileFrameUrl}
                size={52}
                avatarStyle={{ borderRadius: 26, borderWidth: 1.5, borderColor: "white" }}
                {...(item.vipProfileFrameUrl
                  ? {
                      frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                      frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                      frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                      frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                      frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                      avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                      avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                    }
                  : {})}
              />
            ) : (
              <View style={[styles.chatAvatar, styles.chatAvatarPlaceholder]}>
                <Text style={styles.chatInitial}>{item.name?.[0]?.toUpperCase() ?? "?"}</Text>
              </View>
            )}
          </LinearGradient>
          {item.live && (
            <View style={styles.liveBadge}>
              <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.liveBadgeGrad}>
                <Text style={styles.liveBadgeText}>Live</Text>
              </LinearGradient>
            </View>
          )}
        </TouchableOpacity>

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
    ));
  };

  return (
    <View style={styles.root}>
      {/* Background decorative orbs */}
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* ── TOP HEADER ── */}
      <LinearGradient colors={["transparent", "transparent"]} style={styles.header}>
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
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={() => {
                setActiveTopTab("Contacts");
                setContactsPage("following");
                setContactSearch("");
              }}
            >
              <View style={{ position: "relative" }}>
                <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png" }} style={{ width: 40, height: 40 }} resizeMode="contain" />
                <View style={styles.addBtnPlus}>
                  <Plus size={8} color="white" strokeWidth={3} />
                </View>
              </View>
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
                <Search size={15} color="rgba(26,26,46,0.4)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(26,26,46,0.35)"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setActiveTopTab("Contacts");
                  setContactsPage("following");
                  setContactSearch("");
                }}
              >
                <View style={{ position: "relative" }}>
                  <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png" }} style={{ width: 36, height: 36 }} resizeMode="contain" />
                  <View style={styles.addBtnPlus}>
                    <Plus size={8} color="white" strokeWidth={3} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </>
        )}
      </LinearGradient>

      <ScrollView ref={scrollRef} style={styles.body} showsVerticalScrollIndicator={false}>

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
                  {item.icon ? (
                    <Image source={{ uri: item.icon }} style={{ width: item.iconSize, height: item.iconSize }} resizeMode="contain" />
                  ) : (
                    <Text style={styles.contactMenuEmoji}>{item.emoji}</Text>
                  )}
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
                <Search size={15} color="rgba(26,26,46,0.4)" />
                <TextInput
                  style={styles.contactSearchInput}
                  placeholder={`Search ${contactMenuItems.find((m) => m.id === contactsPage)?.label}`}
                  placeholderTextColor="rgba(26,26,46,0.35)"
                  value={contactSearch}
                  onChangeText={setContactSearch}
                />
                {contactSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setContactSearch("")}>
                    <X size={14} color="rgba(26,26,46,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Real family groups (group chats the user belongs to) */}
            {contactsPage === "family" && (
              <View style={styles.familyGroupsSection}>
                <Text style={styles.familyGroupsHeader}>Your Family Groups</Text>
                <View style={styles.contactList}>
                  {familyGroupsLoading ? (
                    <View style={styles.chatsLoading}>
                      <ActivityIndicator size="small" color="#a78bfa" />
                      <Text style={styles.chatsLoadingText}>Loading...</Text>
                    </View>
                  ) : familyGroups.filter((f) =>
                      f.name.toLowerCase().includes(contactSearch.toLowerCase())
                    ).length === 0 ? (
                    <View style={styles.emptyContacts}>
                      <Text style={styles.emptyContactsEmoji}>👪</Text>
                      <Text style={styles.emptyContactsText}>You haven&apos;t joined a family group yet</Text>
                    </View>
                  ) : (
                    familyGroups
                      .filter((f) => f.name.toLowerCase().includes(contactSearch.toLowerCase()))
                      .map((family, idx, arr) => (
                        <TouchableOpacity
                          key={family.id}
                          style={[styles.contactItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                          activeOpacity={0.75}
                          onPress={() => handleOpenFamilyGroup(family)}
                        >
                          <View style={styles.contactAvatarWrap}>
                            <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.contactAvatarRing}>
                              {family.icon ? (
                                <Image source={{ uri: family.icon }} style={styles.contactAvatar} />
                              ) : (
                                <View style={[styles.contactAvatar, styles.contactAvatarPlaceholder]}>
                                  <Text style={styles.contactInitial}>{family.name?.[0]?.toUpperCase() ?? "F"}</Text>
                                </View>
                              )}
                            </LinearGradient>
                          </View>
                          <View style={styles.contactInfo}>
                            <Text style={styles.contactName} numberOfLines={1}>{family.name}</Text>
                            <Text style={styles.contactHandle} numberOfLines={1}>{family.members} members</Text>
                          </View>
                          <TouchableOpacity
                            style={styles.msgBtn}
                            activeOpacity={0.8}
                            onPress={() => handleOpenFamilyGroup(family)}
                          >
                            <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.msgBtnGrad}>
                              <Text style={styles.msgBtnText}>Open Chat</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))
                  )}
                </View>
              </View>
            )}

            {/* Contact list */}
            {contactsPage !== "family" && (
            <View style={styles.contactList}>
              {contactsLoading && (contactsPage === "followers" || contactsPage === "following") ? (
                <View style={styles.chatsLoading}>
                  <ActivityIndicator size="small" color="#a78bfa" />
                  <Text style={styles.chatsLoadingText}>Loading...</Text>
                </View>
              ) : getContactsForPage(contactsPage)
                .filter((u) => u.name.toLowerCase().includes(contactSearch.toLowerCase()))
                .map((user, idx, arr) => {
                  const userId = String(user.userId ?? user.id);
                  const showFollowBack =
                    contactsPage === "followers" &&
                    !followingIdSet.has(userId) &&
                    !isSameUser(userId, myUserId);

                  return (
                  <TouchableOpacity
                    key={userId}
                    style={[styles.contactItem, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                    activeOpacity={0.75}
                    onPress={() => handleOpenUserChat(user)}
                  >
                    {/* Avatar */}
                    <View style={styles.contactAvatarWrap}>
                      <LinearGradient
                        colors={["#7c4dff", "#4a6cf7"]}
                        style={styles.contactAvatarRing}
                      >
                        {user.avatar ? (
                          <ProfileAvatarWithFrame
                            avatarSource={resolveAvatarSource(user.avatar)}
                            frameSource={user.vipProfileFrameUrl}
                            size={46}
                            avatarStyle={{ borderRadius: 23, borderWidth: 1.5, borderColor: "white" }}
                            {...(user.vipProfileFrameUrl
                              ? {
                                  frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                                  frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                                  frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                                  frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                                  frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                                  avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                                  avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                                }
                              : {})}
                          />
                        ) : (
                          <View style={[styles.contactAvatar, styles.contactAvatarPlaceholder]}>
                            <Text style={styles.contactInitial}>{user.name?.[0]?.toUpperCase() ?? "?"}</Text>
                          </View>
                        )}
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
                    {showFollowBack ? (
                      <TouchableOpacity
                        style={styles.followBackBtn}
                        activeOpacity={0.8}
                        disabled={followBackLoadingId === userId}
                        onPress={() => handleFollowBack(user)}
                      >
                        <LinearGradient
                          colors={["#7c4dff", "#4a6cf7"]}
                          style={styles.followBackGrad}
                        >
                          {followBackLoadingId === userId ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Text style={styles.followBackText}>Follow Back</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.msgBtn}
                        activeOpacity={0.8}
                        onPress={() => handleOpenUserChat(user)}
                      >
                        <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.msgBtnGrad}>
                          <Text style={styles.msgBtnText}>Message</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  );
                })}

              {!contactsLoading && getContactsForPage(contactsPage).filter((u) =>
                u.name.toLowerCase().includes(contactSearch.toLowerCase())
              ).length === 0 && (
                <View style={styles.emptyContacts}>
                  <Text style={styles.emptyContactsEmoji}>🔍</Text>
                  <Text style={styles.emptyContactsText}>No results found</Text>
                </View>
              )}
            </View>
            )}
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
                    Tap &quot;Allow&quot; and never miss the amazing people and moments on TukTuk!
                  </Text>
                  <TouchableOpacity style={styles.bannerBtn} activeOpacity={0.8}>
                    <Text style={styles.bannerBtnText}>Notify me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.bannerClose} activeOpacity={0.8} onPress={() => setShowBanner(false)}>
                    <X size={14} color="rgba(26,26,46,0.4)" />
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
                <TouchableOpacity
                  key={card.id}
                  style={[styles.featureCard, { shadowColor: card.shadowColor }]}
                  activeOpacity={0.8}
                  onPress={() => handleFeatureCardPress(card)}
                >
                  <View style={[styles.featureContainer, { backgroundColor: card.tint }]}>
                    <LinearGradient
                      colors={card.colors}
                      style={styles.featureInnerBox}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {card.icon ? (
                        <Image source={{ uri: card.icon }} style={styles.featureIconImg} resizeMode="contain" />
                      ) : card.avatar ? (
                        <Image source={resolveAvatarSource(card.avatar)} style={styles.featureAvatar} blurRadius={2} />
                      ) : (
                        <Text style={styles.featureEmoji}>{card.emoji}</Text>
                      )}
                    </LinearGradient>
                  </View>
                  {card.badge !== null && (
                    <View style={[styles.featureBadge, { borderColor: card.shadowColor }]}>
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
                <TouchableOpacity
                  key={user.id}
                  style={styles.recommendCard}
                  activeOpacity={0.8}
                  onPress={() => handleOpenUserChat(user)}
                >
                  <LinearGradient
                    colors={RECOMMEND_RING_COLORS}
                    style={styles.recommendRing}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {user.avatar ? (
                      <ProfileAvatarWithFrame
                        avatarSource={resolveAvatarSource(user.avatar)}
                        frameSource={user.vipProfileFrameUrl}
                        size={66}
                        avatarStyle={{ borderRadius: 34, borderWidth: 2, borderColor: "white" }}
                        {...(user.vipProfileFrameUrl
                          ? {
                              frameScale: VIP_PROFILE_FRAME_LAYOUT.frameScale,
                              frameResizeMode: VIP_PROFILE_FRAME_LAYOUT.frameResizeMode,
                              frameOffsetX: VIP_PROFILE_FRAME_LAYOUT.frameOffsetX,
                              frameOffsetY: VIP_PROFILE_FRAME_LAYOUT.frameOffsetY,
                              frameBleed: VIP_PROFILE_FRAME_LAYOUT.frameBleed,
                              avatarBoost: VIP_PROFILE_FRAME_LAYOUT.avatarBoost,
                              avatarOffsetY: VIP_PROFILE_FRAME_LAYOUT.avatarOffsetY,
                            }
                          : {})}
                      />
                    ) : (
                      <View style={[styles.recommendAvatar, styles.recommendAvatarPlaceholder]}>
                        <Text style={styles.recommendInitial}>{user.name?.[0]?.toUpperCase() ?? "?"}</Text>
                      </View>
                    )}
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
                    <ChevronDown size={13} color="#7c4dff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuBtn} activeOpacity={0.8}>
                  <AlignJustify size={18} color="rgba(26,26,46,0.4)" />
                </TouchableOpacity>
              </View>
            </View>

        {/* ── CHAT LIST ── */}
        <View style={styles.chatList}>{renderChatList()}</View>

        <View style={{ height: 30 }} />
          </>
        )}

      </ScrollView>

      <ComingSoonModal
        feature={comingSoonFeature}
        onClose={() => setComingSoonFeature(null)}
      />

      <ProfileConnectionsModal
        visible={connectionsModalType !== null}
        type={connectionsModalType}
        onClose={() => setConnectionsModalType(null)}
      />

      <FamilyChatModal
        visible={!!chatFamily}
        family={chatFamily}
        onClose={() => setChatFamily(null)}
      />
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "white",
  },

  // Decorative orbs (matching party screen)
  orbPink: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -80,
    left: -80,
    borderRadius: 150,
    backgroundColor: "rgba(255,0,128,0.18)",
  },
  orbPurple: {
    position: "absolute",
    width: 350,
    height: 350,
    bottom: -120,
    right: -120,
    borderRadius: 175,
    backgroundColor: "rgba(138,43,226,0.22)",
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
    color: "rgba(26,26,46,0.35)",
  },
  headerTabTextActive: {
    color: "#1a1a2e",
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
    backgroundColor: "rgba(124,77,255,0.08)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    color: "#1a1a2e",
    fontSize: 14,
    padding: 0,
  },
  addBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnPlus: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7c4dff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "white",
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
    borderColor: "rgba(124,77,255,0.2)",
    borderRadius: 16,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(124,77,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIconEmoji: { fontSize: 24 },
  bannerText: {
    flex: 1,
    color: "rgba(26,26,46,0.75)",
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
    paddingBottom: 6,
  },
  featureCard: {
    alignItems: "center",
    gap: 8,
    position: "relative",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 8,
  },
  featureContainer: {
    width: 82,
    height: 82,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  featureInnerBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  featureAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  featureIconImg: {
    width: 100,
    height: 50,
  },
  featureEmojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: { fontSize: 26 },
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
    borderColor: "white",
  },
  featureBadgeText: { color: "white", fontSize: 10, fontWeight: "800" },
  featureLabel: {
    color: "rgba(26,26,46,0.75)",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    maxWidth: 82,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#1a1a2e",
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
    borderColor: "white",
  },
  recommendAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendInitial: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  recommendNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recommendName: {
    color: "rgba(26,26,46,0.75)",
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
    color: "#1a1a2e",
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
    borderColor: "rgba(124,77,255,0.25)",
  },
  filterBtnText: { color: "#7c4dff", fontSize: 13, fontWeight: "700" },
  menuBtn: {
    padding: 4,
  },

  // Chat items
  chatsLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    gap: 10,
  },
  chatsLoadingText: {
    color: "rgba(26,26,46,0.5)",
    fontSize: 13,
  },
  chatsEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  chatsEmptyText: {
    color: "rgba(26,26,46,0.4)",
    fontSize: 13,
  },
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
    borderBottomColor: "rgba(124,77,255,0.08)",
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
    borderColor: "white",
  },
  chatAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatInitial: {
    color: "white",
    fontSize: 20,
    fontWeight: "800",
  },
  liveBadge: {
    position: "absolute",
    bottom: -2,
    left: "50%",
    transform: [{ translateX: -16 }],
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "white",
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
    color: "#1a1a2e",
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
    color: "rgba(26,26,46,0.45)",
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
    color: "rgba(26,26,46,0.45)",
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
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: { color: "#1a1a2e", fontSize: 28, lineHeight: 34, fontWeight: "300" },
  subPageTitle: {
    flex: 1,
    color: "#1a1a2e",
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
    borderColor: "rgba(124,77,255,0.15)",
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  contactMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,77,255,0.1)",
  },
  contactMenuIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactMenuEmoji: { fontSize: 22 },
  contactMenuIconImg: { width: CONTACT_MENU_ICON_SIZE, height: CONTACT_MENU_ICON_SIZE },
  contactMenuLabel: { flex: 1, color: "#1a1a2e", fontSize: 16, fontWeight: "600" },
  contactMenuRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactMenuCount: { color: "rgba(26,26,46,0.5)", fontSize: 15, fontWeight: "600" },
  contactMenuChevron: { color: "rgba(26,26,46,0.4)", fontSize: 22, fontWeight: "300" },

  // Contact search
  contactSearchWrap: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  contactSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(124,77,255,0.08)",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  contactSearchInput: { flex: 1, color: "#1a1a2e", fontSize: 14, padding: 0 },

  // Family groups section
  familyGroupsSection: { marginTop: 4 },
  familyGroupsHeader: {
    color: "rgba(26,26,46,0.5)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
  },

  // Contact list
  contactList: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.15)",
    backgroundColor: "rgba(124,77,255,0.07)",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(124,77,255,0.08)",
  },
  contactAvatarWrap: { position: "relative" },
  contactAvatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    padding: 2,
  },
  contactAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  contactAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: "white",
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
    borderColor: "white",
  },
  contactInfo: { flex: 1, gap: 3 },
  contactNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  contactName: { color: "#1a1a2e", fontSize: 14, fontWeight: "700", flexShrink: 1 },
  contactHandle: { color: "rgba(26,26,46,0.45)", fontSize: 12 },

  // Action buttons
  followBackBtn: { borderRadius: 20, overflow: "hidden" },
  followBackGrad: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  followBackText: { color: "white", fontSize: 12, fontWeight: "700" },
  msgBtn: { borderRadius: 20, overflow: "hidden" },
  msgBtnGrad: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.25)",
  },
  msgBtnText: { color: "#7c4dff", fontSize: 12, fontWeight: "700" },

  // Empty state
  emptyContacts: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyContactsEmoji: { fontSize: 36 },
  emptyContactsText: { color: "rgba(26,26,46,0.35)", fontSize: 14, fontWeight: "500" },
});
