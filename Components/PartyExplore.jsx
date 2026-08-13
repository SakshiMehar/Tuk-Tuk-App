import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useScrollToTop, useFocusEffect } from "@react-navigation/native";
import {
  Search,
  Home,
  Plus,
  MessageCircle,
  Signal,
  Mic,
} from "lucide-react-native";
import { getRecommendedUsers } from "../src/services/homeService";
import {
  loadRoomRecommendations,
  loadRecentlyRooms,
  loadFollowingRooms,
  loadManagedRooms,
  loadPartyRanking,
  loadFamilies,
  normalizeRoom,
} from "../src/services/partyService";
import { openUserChat } from "../src/utils/chatNavigation";
import ComingSoonModal from "./ComingSoonModal";
import CreateRoomModal from "./CreateRoomModal";
import LevelGateModal from "./LevelGateModal";
import exploreData from "../src/data/partyExploreData.json";
import ProfileAvatarWithFrame from "./ProfileAvatarWithFrame";
import { VIP_PROFILE_FRAME_LAYOUT } from "../src/constants/vip";
import { syncUserLevelForSession } from "../src/services/userLevelService";

const MIN_CREATE_ROOM_LEVEL = 5;

const { width: W } = Dimensions.get("window");
const FEATURE_CARD_W = (W - 32 - 16) / 3;

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
  bg: "#0f0720",
  header: ["#160d30", "#0f0720"],
  card: "rgba(124,77,255,0.08)",
  cardBorder: "rgba(167,139,250,0.15)",
  purple: "#7c4dff",
  purpleLight: "#a78bfa",
  text: "#ffffff",
  textMuted: "rgba(167,139,250,0.55)",
  textDim: "rgba(255,255,255,0.45)",
  recommendRing: ["#7c4dff", "#ff4ea3"],
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

function ExploreRoomItem({ room, onPress }) {
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
        {!!room.body && (
          <Text style={styles.roomBody} numberOfLines={2}>{room.body}</Text>
        )}
      </View>
      <View style={styles.roomMeta}>
        <MessageCircle size={16} color={THEME.textMuted} />
        <View style={styles.roomCount}>
          <Signal size={14} color={THEME.purple} />
          <Text style={styles.roomCountText}>{room.participantCount ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RelatedRoomItem({ room, onPress, showFollow }) {
  const [followed, setFollowed] = useState(false);

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
        {!!room.body && <Text style={styles.roomBody} numberOfLines={1}>{room.body}</Text>}
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
            <Signal size={14} color={THEME.purple} />
            <Text style={styles.roomCountText}>{room.participantCount ?? 0}</Text>
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
        if (!cancelled) setRooms(apiRooms);
      })
      .catch(() => {
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
        if (!cancelled) setRelatedRooms(apiRooms);
      })
      .catch(() => {
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
        if (!cancelled) setRecommendedUsers(users);
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
    router.push({ pathname: "/voice-party", params: { roomId } });
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
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />
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
              <Search size={20} color={THEME.purpleLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={openCreateRoomModal}>
              <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.iconBtnGrad}>
                <Home size={16} color={THEME.purpleLight} />
                <View style={styles.createRoomPlus}>
                  <Plus size={9} color="white" strokeWidth={3} />
                </View>
              </LinearGradient>
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
                {FEATURE_CARDS.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={styles.featureCard}
                    activeOpacity={0.85}
                    onPress={() => handleFeatureCardPress(card)}
                  >
                    <LinearGradient colors={card.colors} style={styles.featureGrad}>
                      <Text style={styles.featureEmoji}>{card.emoji}</Text>
                    </LinearGradient>
                    <Text style={styles.featureLabel}>{card.label}</Text>
                  </TouchableOpacity>
                ))}
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
                  {recommendedUsers.map((user) => (
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
                    </TouchableOpacity>
                  ))}
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
    backgroundColor: THEME.bg,
  },
  safe: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 8,
    paddingLeft: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(167,139,250,0.1)",
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
    fontSize: 15,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  topTabTextActive: {
    color: THEME.text,
    fontWeight: "700",
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  featureCard: {
    width: FEATURE_CARD_W,
    alignItems: "center",
    gap: 6,
  },
  featureGrad: {
    width: FEATURE_CARD_W,
    height: FEATURE_CARD_W * 0.72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  featureEmoji: { fontSize: 28 },
  featureLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.75)",
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
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: THEME.cardBorder,
  },
  chipActive: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.textMuted,
  },
  chipTextActive: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.text,
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
    gap: 3,
  },
  roomCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.purpleLight,
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
