import { useFocusEffect, useScrollToTop } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Home,
  MessageCircle,
  Mic,
  Plus
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getRoomUserCount } from "../src/api/partyApi";
import { APP_BG, APP_TEXT, APP_TEXT_DIM, APP_TEXT_MUTED } from "../src/constants/theme";
import {
  VIP_PROFILE_FRAME_LAYOUT,
  VIP_TIER_THRESHOLDS,
  resolveVipTierFromAssetUrl,
} from "../src/constants/vip";
import exploreData from "../src/data/partyExploreData.json";
import { fetchUserDecorations } from "../src/services/decorationsService";
import { getRecommendedUsers } from "../src/services/homeService";
import {
  loadFamilies,
  loadFollowingRooms,
  loadManagedRooms,
  loadPartyRanking,
  loadRecentlyRooms,
  loadRoomRecommendations,
  normalizeRoom
} from "../src/services/partyService";
import { useMyCountryFlag } from "../src/services/userCountryService";
import { syncUserLevelForSession } from "../src/services/userLevelService";
import { openUserChat } from "../src/utils/chatNavigation";
import { resolveLocalLevelBadge } from "../src/utils/levelBadge";
import AppBackground from "./AppBackground";
import ComingSoonModal from "./ComingSoonModal";
import CreateRoomModal from "./CreateRoomModal";
import LevelGateModal from "./LevelGateModal";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";

const MIN_CREATE_ROOM_LEVEL = 5;

// Same per-tier VIP "logo" crest used as the VIP badge elsewhere (ChatBox,
// UserProfileView, find-friends) — built the same way here for the
// "Recommend user in the room" row.
const VIP_LOGO_BY_TIER = Object.fromEntries(
  VIP_TIER_THRESHOLDS.map(({ tier, assets }) => [tier, assets?.logo ?? null]),
);
const BADGE_ASPECT = { level: 142 / 149, verified: 438 / 179 };
const VERIFIED_BADGE = require("../assets/Batches/verified-batch.png");

const { width: W } = Dimensions.get("window");

// Feature cards (Ranking / Game / Family): a rounded platform with the icon
// standing on its top edge. The icon artwork is 16:9 with a lot of transparent
// padding around the glyph, so each card declares where its glyph sits in the
// image (glyphTop/glyphBottom as fractions of the image height) and the image
// box is derived from that — this keeps every glyph the same visual height and
// stops the empty padding from pushing the row down.
const FEATURE_CARD_GAP = 10;
const FEATURE_CARD_W = (W - 32 - FEATURE_CARD_GAP * 2) / 3;
const FEATURE_CARD_H = 78;
const FEATURE_ICON_H = 58; // visible glyph height
const FEATURE_ICON_INSET = 22; // how deep the glyph sits inside the platform
const FEATURE_ICON_ASPECT = 16 / 9;

const getFeatureIconLayout = (card) => {
  const glyphTop = card.glyphTop ?? 0;
  const glyphRatio = (card.glyphBottom ?? 1) - glyphTop;
  const glyphHeight = FEATURE_ICON_H * (card.iconScale ?? 1);
  const imageWidth = (glyphHeight * FEATURE_ICON_ASPECT) / glyphRatio;
  const imageHeight = imageWidth / FEATURE_ICON_ASPECT;
  return {
    // 2px of bleed so the clip never shaves the artwork's soft edges
    glyphHeight: glyphHeight + 2,
    imageWidth,
    imageHeight,
    offsetTop: 1 - glyphTop * imageHeight,
    offsetLeft: (FEATURE_CARD_W - imageWidth) / 2,
  };
};

const RANKING_PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const PODIUM_STYLE = {
  1: { ring: ["#ffd700", "#ffaa00"], medal: "🥇", size: 84 },
  2: { ring: ["#c0c0c0", "#9aa0a6"], medal: "🥈", size: 72 },
  3: { ring: ["#cd7f32", "#a0522d"], medal: "🥉", size: 72 },
};

const THEME = {
  bg: APP_BG,
  header: ["transparent", "transparent"],
  card: "rgba(124,77,255,0.08)",
  cardBorder: "rgba(167,139,250,0.15)",
  purple: "#7c4dff",
  purpleLight: "#a78bfa",
  text: APP_TEXT,
  textMuted: APP_TEXT_MUTED,
  textDim: APP_TEXT_DIM,
  recommendRing: ["#333333", "#888888"],
};

const TOP_TABS = exploreData.topTabs;
const RELATED_SUB_TABS = exploreData.relatedSubTabs;
const FILTER_CHIPS = exploreData.filterChips;
const FEATURE_CARDS = exploreData.featureCards;
const RELATED_TAB_LOADERS = {
  Recently: loadRecentlyRooms,
  Following: loadFollowingRooms,
  Managed: loadManagedRooms,
};

const FILTER_CATEGORY_MAP = {
  Recommend: null,
  New: "new",
  Game: "game",
  "Blind date": "blind_date",
};

const matchesFilter = (room, filter) => {
  const categoryKey = FILTER_CATEGORY_MAP[filter];
  if (!categoryKey) return true;
  return room.category === categoryKey;
};

function EmptyState({ message }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIllustration}>
        <LinearGradient
          colors={["rgba(124,77,255,0.25)", "rgba(74,108,247,0.1)"]}
          style={styles.emptyHill}
        >
          <View style={styles.emptyHouse}>
            <Home size={28} color={THEME.purpleLight} />
          </View>
        </LinearGradient>
        <Text style={styles.emptyLeaf}>🍃</Text>
        <Text style={[styles.emptyLeaf, styles.emptyLeaf2]}>🍃</Text>
      </View>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

function useRoomUserCount(roomId) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    const fetchCount = () => {
      getRoomUserCount(roomId)
        .then((count) => {
          if (cancelled) return;
          if (typeof count === "number") setCount(count);
        })
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomId]);

  return count;
}

// Identity badges (level/VIP/decoration) are intentionally NOT added to these
// room cards: normalizeRoom() (src/services/partyService.js) only exposes
// `hostId`, not the host's name/avatar/level/vipProfileFrameUrl, and this is
// a long, frequently re-rendered list — adding per-card host profile/
// decoration requests here would be an N+1 network call. Revisit once the
// room list API embeds host identity fields directly.
function ExploreRoomItem({ room, onPress }) {
  const userCount = useRoomUserCount(room.id);
  const countryFlag = useMyCountryFlag();

  return (
    <TouchableOpacity style={styles.exploreRoomCard} activeOpacity={0.8} onPress={onPress}>
      {room.thumbnail ? (
        <Image source={{ uri: room.thumbnail }} style={styles.roomThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.roomThumb, styles.roomThumbPlaceholder]}>
          <Mic size={22} color={THEME.purpleLight} />
        </View>
      )}
      <View style={styles.roomInfo}>
        <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
        {!!room.roomTypeLabel && (
          <View style={styles.roomTypeChip}>
            <Text style={styles.roomTypeText}>{room.roomTypeLabel}</Text>
          </View>
        )}
      </View>
      <View style={styles.roomMeta}>
        {countryFlag ? (
          <Text style={styles.roomFlagEmoji}>{countryFlag}</Text>
        ) : (
          <MessageCircle size={16} color={THEME.textMuted} />
        )}
        <View style={styles.roomCount}>
          <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png" }} style={styles.roomCountIcon} resizeMode="contain" />
          <Text style={styles.roomCountText}>{userCount ?? ""}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RelatedRoomItem({ room, onPress, showFollow }) {
  const [followed, setFollowed] = useState(false);
  const userCount = useRoomUserCount(room.id);

  return (
    <TouchableOpacity style={styles.relatedRoomCard} activeOpacity={0.8} onPress={onPress}>
      {room.thumbnail ? (
        <Image source={{ uri: room.thumbnail }} style={styles.roomThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.roomThumb, styles.roomThumbPlaceholder]}>
          <Mic size={22} color={THEME.purpleLight} />
        </View>
      )}
      <View style={styles.roomInfo}>
        <Text style={styles.roomName} numberOfLines={1}>{room.name ?? room.title}</Text>
        {room.badges?.length > 0 && (
          <View style={styles.badgeRow}>
            {room.badges.map((b, i) => (
              <Text key={i} style={styles.badgeEmoji}>{b}</Text>
            ))}
          </View>
        )}
        {room.hasChat && (
          <View style={styles.chatTag}>
            <MessageCircle size={11} color={THEME.purpleLight} />
            <Text style={styles.chatTagText}>Chat</Text>
          </View>
        )}
      </View>
      <View style={styles.roomMeta}>
        {room.statusIcons?.map((icon, i) => (
          <Text key={i} style={styles.statusIcon}>{icon}</Text>
        ))}
        {showFollow ? (
          <TouchableOpacity
            style={[styles.followBtn, followed && styles.followBtnActive]}
            activeOpacity={0.8}
            onPress={() => setFollowed((v) => !v)}
          >
            <Text style={[styles.followBtnText, followed && styles.followBtnTextActive]}>
              {followed ? "Following" : "Follow"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.roomCount}>
            <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/user.png" }} style={styles.roomCountIcon} resizeMode="contain" />
            <Text style={styles.roomCountText}>{userCount ?? ""}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function PartyExplore() {
  const router = useRouter();
  const scrollRef = useRef(null);
  useScrollToTop(scrollRef);
  const [activeTopTab, setActiveTopTab] = useState("Explore");
  const [activeRelatedTab, setActiveRelatedTab] = useState("Recently");
  const [activeFilter, setActiveFilter] = useState("Recommend");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [relatedRooms, setRelatedRooms] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  // userId -> decoration badgeUrl for the "Recommend user in the room" strip
  // below — a small horizontal list (same size class as ChatTab.jsx's
  // identical recommend row), so one fetchUserDecorations call per visible
  // user id is fine, cached by id so it's never re-requested.
  const [recommendDecorations, setRecommendDecorations] = useState({});
  const recommendDecorationFetchedIds = useRef(new Set());

  // ── Search ──
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const searchDebounceRef = useRef(null);

  // ── Ranking modal ──
  const [rankingVisible, setRankingVisible] = useState(false);
  const [rankingPeriod, setRankingPeriod] = useState("daily");
  const [rankingList, setRankingList] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);

  // ── Family modal ──
  const [familyVisible, setFamilyVisible] = useState(false);
  const [familyList, setFamilyList] = useState([]);
  const [familyLoading, setFamilyLoading] = useState(false);

  // ── Coming soon modal ──
  const [comingSoonFeature, setComingSoonFeature] = useState(null);

  // ── Create room modal ──
  const [createRoomVisible, setCreateRoomVisible] = useState(false);

  // ── Level gate (create room requires MIN_CREATE_ROOM_LEVEL) ──
  const [levelGateVisible, setLevelGateVisible] = useState(false);
  const [myLevel, setMyLevel] = useState(1);

  // Bumped every time this screen regains focus (e.g. after exiting a room)
  // so the room lists below refetch instead of only ever loading once at mount.
  const [focusTick, setFocusTick] = useState(0);
  const isFirstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocusRef.current) {
        isFirstFocusRef.current = false;
        return;
      }
      setFocusTick((v) => v + 1);
    }, [])
  );

  useEffect(() => {
    if (activeTopTab !== "Explore") return;
    let cancelled = false;
    setRoomsLoading(true);
    loadRoomRecommendations()
      .then((apiRooms) => {
        console.log("[PartyExplore] loadRoomRecommendations resolved, count:", apiRooms?.length);
        if (!cancelled) setRooms(apiRooms);
      })
      .catch((err) => {
        console.error("[PartyExplore] loadRoomRecommendations failed:", err?.response?.status, err?.message ?? err);
        if (!cancelled) setRooms([]);
      })
      .finally(() => {
        if (!cancelled) setRoomsLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTopTab, focusTick]);

  useEffect(() => {
    if (activeTopTab !== "Related") return;
    const loader = RELATED_TAB_LOADERS[activeRelatedTab];
    if (!loader) {
      setRelatedRooms([]);
      return;
    }

    let cancelled = false;
    setRelatedLoading(true);
    loader()
      .then((apiRooms) => {
        console.log(`[PartyExplore] ${activeRelatedTab} rooms resolved, count:`, apiRooms?.length);
        if (!cancelled) setRelatedRooms(apiRooms);
      })
      .catch((err) => {
        console.error(`[PartyExplore] ${activeRelatedTab} rooms failed:`, err?.response?.status, err?.message ?? err);
        if (!cancelled) setRelatedRooms([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTopTab, activeRelatedTab, focusTick]);

  useEffect(() => {
    let cancelled = false;
    getRecommendedUsers()
      .then((users) => {
        if (!cancelled) {
          setRecommendedUsers(users);
          (users ?? []).forEach((u) => {
            const uid = u?.id != null ? String(u.id) : u?.userId != null ? String(u.userId) : null;
            if (!uid || recommendDecorationFetchedIds.current.has(uid)) return;
            recommendDecorationFetchedIds.current.add(uid);
            fetchUserDecorations(uid)
              .then(({ badgeUrl }) => {
                if (badgeUrl && !cancelled) {
                  setRecommendDecorations((prev) => ({ ...prev, [uid]: badgeUrl }));
                }
              })
              .catch(() => {});
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Load ranking whenever the modal opens or the period changes.
  useEffect(() => {
    if (!rankingVisible) return;
    let cancelled = false;
    setRankingLoading(true);
    loadPartyRanking(rankingPeriod)
      .then((list) => {
        if (!cancelled) setRankingList(list);
      })
      .catch(() => {
        if (!cancelled) setRankingList([]);
      })
      .finally(() => {
        if (!cancelled) setRankingLoading(false);
      });
    return () => { cancelled = true; };
  }, [rankingVisible, rankingPeriod]);

  // Load families when the family modal opens.
  useEffect(() => {
    if (!familyVisible) return;
    let cancelled = false;
    setFamilyLoading(true);
    loadFamilies()
      .then((list) => {
        if (!cancelled) setFamilyList(list);
      })
      .catch(() => {
        if (!cancelled) setFamilyList([]);
      })
      .finally(() => {
        if (!cancelled) setFamilyLoading(false);
      });
    return () => { cancelled = true; };
  }, [familyVisible]);

  const handleFeatureCardPress = (card) => {
    if (card.id === "ranking") {
      setRankingVisible(true);
    } else if (card.id === "family") {
      setFamilyVisible(true);
    } else if (card.id === "game") {
      setComingSoonFeature("Game");
    } else {
      setComingSoonFeature(card.label);
    }
  };

  const filteredRooms = useMemo(
    () => rooms.filter((room) => matchesFilter(room, activeFilter)),
    [rooms, activeFilter]
  );

  const podium = useMemo(() => rankingList.slice(0, 3), [rankingList]);
  const restRanking = useMemo(() => rankingList.slice(3), [rankingList]);

  const openRoom = (roomId) => {
    if (!roomId) {
      console.warn("[PartyExplore] openRoom called with empty roomId — skipping navigation");
      return;
    }
    router.push({ pathname: "/voice-party", params: { roomId: String(roomId) } });
  };

  const openCreateRoomModal = async () => {
    const { level } = await syncUserLevelForSession();
    const resolvedLevel = level ?? 1;
    if (resolvedLevel < MIN_CREATE_ROOM_LEVEL) {
      setMyLevel(resolvedLevel);
      setLevelGateVisible(true);
      return;
    }
    setCreateRoomVisible(true);
  };

  const handleCreateRoomEntered = (roomId, room) => {
    setCreateRoomVisible(false);

    if (room) {
      // Show the room immediately instead of waiting on the next
      // recommendations/managed-rooms fetch to pick it up.
      const normalized = normalizeRoom({ ...room, id: room.id ?? roomId, roomId: room.id ?? roomId });
      const upsert = (prev) => [
        normalized,
        ...prev.filter((r) => String(r.id) !== String(normalized.id)),
      ];
      setRooms(upsert);
      if (activeRelatedTab === "Managed" || activeRelatedTab === "Recently") {
        setRelatedRooms(upsert);
      }
    }

    router.push({
      pathname: "/voice-party",
      params: { roomId: String(roomId) },
    });
  };

  const renderRelatedContent = () => {
    if (relatedLoading) {
      return <ActivityIndicator color={THEME.purple} style={{ marginVertical: 24 }} />;
    }

    if (relatedRooms.length === 0) {
      const emptyMessages = {
        Recently: "No recently visited rooms.",
        Following: "You have not followed any rooms.",
        Managed: "No managed rooms yet.",
      };
      return <EmptyState message={emptyMessages[activeRelatedTab] ?? "No rooms found."} />;
    }

    return relatedRooms.map((room) => (
      <RelatedRoomItem
        key={String(room.id)}
        room={room}
        onPress={() => openRoom(room.id)}
      />
    ));
  };

  return (
    <View style={styles.root}>
      <AppBackground />
      <StatusBar barStyle="dark-content" backgroundColor={THEME.bg} />
      <SafeAreaView style={styles.safe} edges={["top"]}>
        {/* ── TOP TABS + ACTIONS ── */}
        <LinearGradient colors={THEME.header} style={styles.topBar}>
          <View style={styles.topTabsRow}>
            {TOP_TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={styles.topTabBtn}
                activeOpacity={0.8}
                onPress={() => setActiveTopTab(tab)}
              >
                <Text style={[styles.topTabText, activeTopTab === tab && styles.topTabTextActive]}>
                  {tab}
                </Text>
                {activeTopTab === tab && <View style={styles.topTabUnderline} />}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8}>
              <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.iconBtnGrad}>
                <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/search.png" }} style={styles.searchIcon} resizeMode="contain" />
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={openCreateRoomModal}>
              <View style={styles.homeIconWrap}>
                <Image source={{ uri: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/home.png" }} style={styles.homeIcon} resizeMode="contain" />
                <View style={styles.createRoomPlus}>
                  <Plus size={9} color="white" strokeWidth={3} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView ref={scrollRef} style={styles.body} showsVerticalScrollIndicator={false}>
          {/* ══════════ RELATED TAB ══════════ */}
          {activeTopTab === "Related" && (
            <>
              {/* Create My Room */}
              <TouchableOpacity
                style={styles.createCard}
                activeOpacity={0.85}
                onPress={openCreateRoomModal}
              >
                <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.createIconWrap}>
                  <Home size={22} color="white" />
                  <View style={styles.createIconPlus}>
                    <Plus size={10} color={THEME.purple} strokeWidth={3} />
                  </View>
                </LinearGradient>
                <Text style={styles.createCardText}>Create My Room</Text>
                <Mic
                  size={64}
                  color="rgba(124,77,255,0.12)"
                  style={styles.createWatermark}
                />
              </TouchableOpacity>

              {/* Sub-tabs */}
              <View style={styles.subTabsRow}>
                {RELATED_SUB_TABS.map((tab, idx) => (
                  <View key={tab} style={styles.subTabWrap}>
                    {idx > 0 && <View style={styles.subTabDivider} />}
                    <TouchableOpacity
                      style={styles.subTabBtn}
                      activeOpacity={0.8}
                      onPress={() => setActiveRelatedTab(tab)}
                    >
                      <Text
                        style={[
                          styles.subTabText,
                          activeRelatedTab === tab && styles.subTabTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                      {activeRelatedTab === tab && <View style={styles.subTabUnderline} />}
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Related content */}
              <View style={styles.relatedList}>
                {renderRelatedContent()}
              </View>
            </>
          )}

          {/* ══════════ EXPLORE TAB ══════════ */}
          {activeTopTab === "Explore" && (
            <>
              <View style={styles.featureRow}>
                {FEATURE_CARDS.map((card) => {
                  const icon = getFeatureIconLayout(card);
                  return (
                    <TouchableOpacity
                      key={card.id}
                      style={[styles.featureCardWrap, { shadowColor: card.shadowColor ?? "#aaa" }]}
                      activeOpacity={0.85}
                      onPress={() => handleFeatureCardPress(card)}
                    >
                      {/* Icon stands on the platform — its lower part overlaps the card */}
                      <View style={[styles.featureIconClip, { height: icon.glyphHeight }]}>
                        <Image
                          source={{ uri: card.icon }}
                          style={{
                            width: icon.imageWidth,
                            height: icon.imageHeight,
                            marginLeft: icon.offsetLeft,
                            marginTop: icon.offsetTop,
                          }}
                          resizeMode="contain"
                        />
                      </View>

                      {/* Platform */}
                      <LinearGradient
                        colors={[
                          card.tintStart ?? "rgba(255,220,170,0.7)",
                          card.tintEnd ?? "rgba(240,160,80,0.22)",
                        ]}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                        style={styles.featurePlatform}
                      >
                        {/* Ascending podium steps the icon "stands" on */}
                        <View style={styles.featureSteps} pointerEvents="none">
                          <View
                            style={[
                              styles.featureStepTop,
                              { backgroundColor: card.stepColor ?? "rgba(255,255,255,0.5)" },
                            ]}
                          >
                            <View
                              style={[
                                styles.featureStepShine,
                                { backgroundColor: card.stepHighlight ?? "rgba(255,255,255,0.6)" },
                              ]}
                            />
                          </View>
                          <View
                            style={[
                              styles.featureStepMid,
                              { backgroundColor: card.stepColor ?? "rgba(255,255,255,0.4)" },
                            ]}
                          >
                            <View
                              style={[
                                styles.featureStepShine,
                                { backgroundColor: card.stepHighlight ?? "rgba(255,255,255,0.5)" },
                              ]}
                            />
                          </View>
                          <View
                            style={[
                              styles.featureStepBase,
                              { backgroundColor: card.stepColor ?? "rgba(255,255,255,0.3)" },
                            ]}
                          >
                            <View
                              style={[
                                styles.featureStepShine,
                                { backgroundColor: card.stepHighlight ?? "rgba(255,255,255,0.45)" },
                              ]}
                            />
                          </View>
                        </View>

                        <Text style={[styles.featureLabel, { color: card.labelColor ?? "#7a3f00" }]}>
                          {card.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContent}
                style={styles.chipsScroll}
              >
                {FILTER_CHIPS.map((chip) => {
                  const active = activeFilter === chip;
                  return (
                    <TouchableOpacity key={chip} activeOpacity={0.8} onPress={() => setActiveFilter(chip)}>
                      {active ? (
                        <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.chipActive}>
                          <Text style={styles.chipTextActive}>{chip}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={styles.chip}>
                          <Text style={styles.chipText}>{chip}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {roomsLoading ? (
                <ActivityIndicator color={THEME.purple} style={{ marginVertical: 24 }} />
              ) : filteredRooms.length === 0 ? (
                <View style={styles.emptyRooms}>
                  <Text style={styles.emptyRoomsText}>No rooms in this category</Text>
                </View>
              ) : (
                filteredRooms.map((room) => (
                  <ExploreRoomItem
                    key={room.id}
                    room={room}
                    onPress={() => openRoom(room.id)}
                  />
                ))
              )}

              <View style={styles.recommendSection}>
                <Text style={styles.recommendTitle}>Recommend user in the room</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.recommendContent}
                >
                  {recommendedUsers.map((user) => {
                    const levelBadge =
                      user?.level != null ? resolveLocalLevelBadge(user.level) : null;
                    const vipTier = resolveVipTierFromAssetUrl(user?.vipProfileFrameUrl);
                    const vipLogo = vipTier != null ? VIP_LOGO_BY_TIER[vipTier] : null;
                    const decorationBadge =
                      user?.id != null ? recommendDecorations[String(user.id)] : null;
                    return (
                    <TouchableOpacity
                      key={user.id}
                      style={styles.recommendItem}
                      activeOpacity={0.8}
                      onPress={() => openUserChat(router, user)}
                    >
                      <LinearGradient
                        colors={THEME.recommendRing}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.recommendRing}
                      >
                        {user.avatar ? (
                          <ProfileAvatarWithFrame
                            avatarSource={{ uri: user.avatar }}
                            frameSource={user.vipProfileFrameUrl}
                            size={53}
                            avatarStyle={{ borderRadius: 26, borderWidth: 2, borderColor: THEME.bg }}
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
                            <Text style={styles.recommendInitial}>
                              {user.name?.[0]?.toUpperCase() ?? "?"}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                      <Text style={styles.recommendName} numberOfLines={1}>{user.name}</Text>
                      {(levelBadge || vipLogo || decorationBadge || user?.verified) && (
                        <View style={styles.recommendBadgeRow}>
                          {levelBadge && (
                            <Image
                              source={levelBadge}
                              style={styles.recommendLevelBadge}
                              resizeMode="contain"
                            />
                          )}
                          {vipLogo && (
                            <Image
                              source={{ uri: vipLogo }}
                              style={styles.recommendVipBadge}
                              resizeMode="contain"
                            />
                          )}
                          {decorationBadge && (
                            <Image
                              source={{ uri: decorationBadge }}
                              style={styles.recommendDecorationBadge}
                              resizeMode="contain"
                            />
                          )}
                          {user?.verified && (
                            <Image
                              source={VERIFIED_BADGE}
                              style={styles.recommendVerifiedBadge}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>

      {/* ══════════ RANKING MODAL ══════════ */}
      <Modal
        visible={rankingVisible}
        animationType="slide"
        onRequestClose={() => setRankingVisible(false)}
      >
        <View style={styles.modalRoot}>
          <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🏆 Ranking</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setRankingVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Period tabs */}
            <View style={styles.periodRow}>
              {RANKING_PERIODS.map((p) => {
                const active = rankingPeriod === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.8}
                    onPress={() => setRankingPeriod(p.id)}
                    style={styles.periodBtnWrap}
                  >
                    {active ? (
                      <LinearGradient colors={["#7c4dff", "#4a6cf7"]} style={styles.periodBtnActive}>
                        <Text style={styles.periodTextActive}>{p.label}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.periodBtn}>
                        <Text style={styles.periodText}>{p.label}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {rankingLoading ? (
              <ActivityIndicator color={THEME.purple} style={{ marginTop: 40 }} />
            ) : rankingList.length === 0 ? (
              <EmptyState message="No ranking data yet." />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {/* Podium top 3 */}
                <View style={styles.podiumRow}>
                  {podium.map((entry) => {
                    const cfg = PODIUM_STYLE[entry.rank] ?? PODIUM_STYLE[3];
                    return (
                      <View
                        key={String(entry.id)}
                        style={[styles.podiumItem, entry.rank === 1 && styles.podiumFirst]}
                      >
                        <Text style={styles.podiumMedal}>{cfg.medal}</Text>
                        <LinearGradient colors={cfg.ring} style={[styles.podiumRing, { width: cfg.size, height: cfg.size, borderRadius: cfg.size / 2 }]}>
                          {entry.avatar ? (
                            <ProfileAvatarWithFrame
                              avatarSource={{ uri: entry.avatar }}
                              frameSource={entry.vipProfileFrameUrl}
                              size={cfg.size - 6}
                              avatarStyle={{ borderRadius: 999, borderWidth: 2, borderColor: THEME.bg }}
                              {...(entry.vipProfileFrameUrl
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
                            <View style={[styles.podiumAvatar, styles.avatarPlaceholder]}>
                              <Text style={styles.avatarInitial}>{entry.name?.[0]?.toUpperCase() ?? "?"}</Text>
                            </View>
                          )}
                        </LinearGradient>
                        <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
                        <Text style={styles.podiumScore}>{entry.score} 💎</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Rest of the list */}
                {restRanking.map((entry) => (
                  <View key={String(entry.id)} style={styles.rankRow}>
                    <Text style={styles.rankNumber}>{entry.rank}</Text>
                    {entry.avatar ? (
                      <ProfileAvatarWithFrame
                        avatarSource={{ uri: entry.avatar }}
                        frameSource={entry.vipProfileFrameUrl}
                        size={44}
                        avatarStyle={styles.rankAvatar}
                        {...(entry.vipProfileFrameUrl
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
                      <View style={[styles.rankAvatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarInitial}>{entry.name?.[0]?.toUpperCase() ?? "?"}</Text>
                      </View>
                    )}
                    <View style={styles.rankInfo}>
                      <Text style={styles.rankName} numberOfLines={1}>{entry.name}</Text>
                      {entry.level != null && (
                        <Text style={styles.rankLevel}>Lv {entry.level}</Text>
                      )}
                    </View>
                    <Text style={styles.rankScore}>{entry.score} 💎</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* ══════════ FAMILY MODAL ══════════ */}
      <Modal
        visible={familyVisible}
        animationType="slide"
        onRequestClose={() => setFamilyVisible(false)}
      >
        <View style={styles.modalRoot}>
          <SafeAreaView style={styles.safe} edges={["top"]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>👪 Family</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setFamilyVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {familyLoading ? (
              <ActivityIndicator color={THEME.purple} style={{ marginTop: 40 }} />
            ) : familyList.length === 0 ? (
              <EmptyState message="No families yet. Be the first to create one!" />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
                {familyList.map((family) => (
                  <View key={String(family.id)} style={styles.familyCard}>
                    <Text style={styles.familyRank}>#{family.rank}</Text>
                    {family.avatar ? (
                      <Image source={{ uri: family.avatar }} style={styles.familyAvatar} />
                    ) : (
                      <View style={[styles.familyAvatar, styles.familyEmojiWrap]}>
                        <Text style={styles.familyEmoji}>{family.emoji}</Text>
                      </View>
                    )}
                    <View style={styles.familyInfo}>
                      <Text style={styles.familyName} numberOfLines={1}>{family.name}</Text>
                      <View style={styles.familyMetaRow}>
                        <Text style={styles.familyMeta}>Lv {family.level}</Text>
                        <Text style={styles.familyMetaDot}>·</Text>
                        <Text style={styles.familyMeta}>{family.memberCount} members</Text>
                      </View>
                    </View>
                    <View style={styles.familyScoreWrap}>
                      <Text style={styles.familyScore}>{family.score}</Text>
                      <Text style={styles.familyScoreLabel}>prosperity</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      <ComingSoonModal
        feature={comingSoonFeature}
        onClose={() => setComingSoonFeature(null)}
      />

      <CreateRoomModal
        visible={createRoomVisible}
        onClose={() => setCreateRoomVisible(false)}
        onEntered={handleCreateRoomEntered}
      />

      <LevelGateModal
        visible={levelGateVisible}
        requiredLevel={MIN_CREATE_ROOM_LEVEL}
        currentLevel={myLevel}
        onClose={() => setLevelGateVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    paddingLeft: 4,
    paddingBottom: 8,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  topTabsRow: {
    flex: 1,
    flexDirection: "row",
    paddingLeft: 8,
  },
  topTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  topTabText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#999",
  },
  topTabTextActive: {
    color: "#1a1a2e",
    fontWeight: "700",
    fontSize: 17,
  },
  topTabUnderline: {
    position: "absolute",
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: THEME.purple,
  },
  topActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchIcon: {
    width: 40,
    height: 30,
  },
  homeIcon: {
    width: 32,
    height: 32,
  },
  homeIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnGrad: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  createRoomPlus: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: THEME.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },

  // Create My Room card
  createCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    overflow: "hidden",
    gap: 14,
  },
  createIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  createIconPlus: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  createCardText: {
    color: THEME.purpleLight,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  createWatermark: {
    position: "absolute",
    right: 12,
    opacity: 0.5,
  },

  // Sub-tabs
  subTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  subTabWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  subTabDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(167,139,250,0.25)",
    marginHorizontal: 4,
  },
  subTabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: "center",
  },
  subTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  subTabTextActive: {
    color: THEME.text,
    fontWeight: "700",
  },
  subTabUnderline: {
    position: "absolute",
    bottom: 0,
    width: 20,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: THEME.purple,
  },

  relatedList: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  relatedRoomCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 12,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyIllustration: {
    width: 140,
    height: 100,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  emptyHill: {
    width: 120,
    height: 60,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHouse: {
    marginTop: -20,
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyLeaf: {
    position: "absolute",
    fontSize: 16,
    opacity: 0.5,
    top: 10,
    left: 20,
  },
  emptyLeaf2: {
    left: undefined,
    right: 24,
    top: 20,
  },
  emptyText: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  badgeRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 4,
  },
  badgeEmoji: { fontSize: 14 },
  chatTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  chatTagText: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  statusIcon: { fontSize: 16 },
  followBtn: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#4a6cf7",
  },
  followBtnActive: {
    borderColor: THEME.cardBorder,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  followBtnText: {
    color: "#4a6cf7",
    fontSize: 12,
    fontWeight: "700",
  },
  followBtnTextActive: {
    color: THEME.purpleLight,
  },

  // Explore tab
  bannerWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    minHeight: 72,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  bannerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  bannerUserName: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: "800",
  },
  bannerUserId: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 10,
    fontWeight: "600",
  },
  bannerCenter: { flex: 1 },
  bannerTitle: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: "800",
  },
  bannerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  luckyBag: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  luckyBagEmoji: { fontSize: 18 },
  luckyBagText: {
    color: THEME.text,
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 10,
  },
  featureRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 4,
    gap: FEATURE_CARD_GAP,
    alignItems: "flex-end",
  },
  featureCardWrap: {
    flex: 1,
    alignItems: "center",
    shadowOpacity: 0,
    elevation: 0,
  },
  featureIconClip: {
    width: "100%",
    overflow: "hidden",
    zIndex: 2,
    marginBottom: -FEATURE_ICON_INSET,
  },
  featurePlatform: {
    width: "100%",
    height: FEATURE_CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 5,
  },
  // Ascending 3-tier podium the icon stands on — narrowest step on top,
  // widest at the bottom, stacked directly above the label.
  featureSteps: {
    position: "absolute",
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  featureStepTop: {
    width: "34%",
    height: 10,
    borderRadius: 4,
    overflow: "hidden",
  },
  featureStepMid: {
    width: "56%",
    height: 10,
    borderRadius: 4,
    marginTop: 2,
    overflow: "hidden",
  },
  featureStepBase: {
    width: "80%",
    height: 11,
    borderRadius: 4,
    marginTop: 2,
    overflow: "hidden",
  },
  featureStepShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "45%",
    opacity: 0.8,
  },
  featureWash: {
    position: "absolute",
    width: "75%",
    height: "55%",
    borderRadius: 999,
    bottom: "18%",
    alignSelf: "center",
    opacity: 0.28,
  },
  featureBlob1: {
    position: "absolute",
    width: "100%",
    height: "65%",
    borderRadius: 999,
    top: -20,
    alignSelf: "center",
    opacity: 0.55,
  },
  featureBlob2: {
    position: "absolute",
    width: "80%",
    height: "50%",
    borderRadius: 999,
    bottom: 10,
    right: -15,
    opacity: 0.35,
  },
  featureGlowRing: {
    position: "absolute",
    top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 27,
    opacity: 0.5,
  },
  featureShine: {
    position: "absolute",
    top: 0, left: 0,
    width: "60%",
    height: "45%",
    borderTopLeftRadius: 24,
  },
  featureIconWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  featureEmoji: { fontSize: 28 },
  featureLabel: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  chipsScroll: { marginTop: 14 },
  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
  },
  chipActive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  chipTextActive: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  exploreRoomCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    padding: 10,
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 12,
  },
  roomThumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  roomThumbPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  roomInfo: {
    flex: 1,
    gap: 4,
  },
  roomName: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.text,
    lineHeight: 18,
  },
  roomTypeChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: "rgba(124,77,255,0.2)",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  roomTypeText: {
    fontSize: 10,
    fontWeight: "700",
    color: THEME.purpleLight,
  },
  roomBody: {
    fontSize: 12,
    fontWeight: "500",
    color: THEME.textMuted,
    lineHeight: 16,
  },
  roomTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.text,
    lineHeight: 18,
  },
  roomMeta: {
    alignItems: "flex-end",
    gap: 8,
  },
  roomCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  roomCountIcon: {
    width: 35,
    height: 35,
    marginRight: -10,
    marginTop: 1,
  },
  roomCountText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.purpleLight,
  },
  roomFlagEmoji: {
    fontSize: 20,
  },
  emptyRooms: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyRoomsText: {
    color: THEME.textMuted,
    fontSize: 14,
    fontWeight: "600",
  },
  recommendSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(167,139,250,0.1)",
    paddingBottom: 8,
  },
  recommendTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  recommendContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  recommendItem: {
    alignItems: "center",
    width: 72,
  },
  recommendRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 2.5,
  },
  recommendAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 26,
    borderWidth: 2,
    borderColor: THEME.bg,
  },
  recommendAvatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recommendInitial: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },
  recommendName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    maxWidth: 72,
  },
  recommendBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    marginTop: 2,
  },
  recommendLevelBadge: {
    height: 12,
    width: 12 * BADGE_ASPECT.level,
  },
  recommendVipBadge: {
    width: 12,
    height: 12,
  },
  recommendDecorationBadge: {
    height: 12,
    width: 12 * BADGE_ASPECT.verified,
  },
  recommendVerifiedBadge: {
    height: 12,
    width: 12 * BADGE_ASPECT.verified,
  },

  // ── Ranking / Family modals ──
  modalRoot: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.12)",
  },
  modalTitle: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: "800",
  },
  modalClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  modalCloseText: {
    color: THEME.purpleLight,
    fontSize: 15,
    fontWeight: "700",
  },
  avatarPlaceholder: {
    backgroundColor: "rgba(124,77,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },

  // Ranking period tabs
  periodRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
  },
  periodBtnWrap: {},
  periodBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  periodBtnActive: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodText: {
    color: THEME.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  periodTextActive: {
    color: THEME.text,
    fontSize: 13,
    fontWeight: "700",
  },

  // Podium
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 14,
    paddingTop: 18,
    paddingBottom: 24,
  },
  podiumItem: {
    alignItems: "center",
    width: 96,
  },
  podiumFirst: {
    marginBottom: 16,
  },
  podiumMedal: {
    fontSize: 22,
    marginBottom: 6,
  },
  podiumRing: {
    padding: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  podiumAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: THEME.bg,
  },
  podiumName: {
    color: THEME.text,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 8,
    maxWidth: 90,
  },
  podiumScore: {
    color: THEME.purpleLight,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },

  // Ranking list rows
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    backgroundColor: THEME.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 12,
  },
  rankNumber: {
    width: 24,
    textAlign: "center",
    color: THEME.purpleLight,
    fontSize: 15,
    fontWeight: "800",
  },
  rankAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  rankInfo: {
    flex: 1,
    gap: 2,
  },
  rankName: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rankLevel: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  rankScore: {
    color: THEME.purpleLight,
    fontSize: 14,
    fontWeight: "800",
  },

  // Family cards
  familyCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: THEME.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.cardBorder,
    gap: 12,
  },
  familyRank: {
    width: 32,
    textAlign: "center",
    color: THEME.purpleLight,
    fontSize: 15,
    fontWeight: "800",
  },
  familyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.15)",
  },
  familyEmojiWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  familyEmoji: {
    fontSize: 26,
  },
  familyInfo: {
    flex: 1,
    gap: 4,
  },
  familyName: {
    color: THEME.text,
    fontSize: 15,
    fontWeight: "700",
  },
  familyMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  familyMeta: {
    color: THEME.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  familyMetaDot: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  familyScoreWrap: {
    alignItems: "flex-end",
  },
  familyScore: {
    color: THEME.purpleLight,
    fontSize: 16,
    fontWeight: "800",
  },
  familyScoreLabel: {
    color: THEME.textDim,
    fontSize: 9,
    fontWeight: "600",
  },
});
