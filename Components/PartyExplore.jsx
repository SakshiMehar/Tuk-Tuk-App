import { useState, useEffect, useMemo } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
} from "../src/services/partyService";
import { openUserChat } from "../src/utils/chatNavigation";
import exploreData from "../src/data/partyExploreData.json";

const { width: W } = Dimensions.get("window");
const FEATURE_CARD_W = (W - 32 - 16) / 3;

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
  const [activeTopTab, setActiveTopTab] = useState("Explore");
  const [activeRelatedTab, setActiveRelatedTab] = useState("Recently");
  const [activeFilter, setActiveFilter] = useState("Recommend");
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [relatedRooms, setRelatedRooms] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [recommendedUsers, setRecommendedUsers] = useState([]);

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
  }, [activeTopTab]);

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
  }, [activeTopTab, activeRelatedTab]);

  useEffect(() => {
    let cancelled = false;
    getRecommendedUsers()
      .then((users) => {
        if (!cancelled) setRecommendedUsers(users);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const filteredRooms = useMemo(
    () => rooms.filter((room) => matchesFilter(room, activeFilter)),
    [rooms, activeFilter]
  );

  const openRoom = (roomId) => {
    router.push({ pathname: "/voice-party", params: { roomId } });
  };

  const createRoom = () => {
    router.push({ pathname: "/voice-party", params: { create: "true" } });
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
            <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={createRoom}>
              <LinearGradient colors={["rgba(124,77,255,0.2)", "rgba(74,108,247,0.2)"]} style={styles.iconBtnGrad}>
                <Home size={16} color={THEME.purpleLight} />
                <View style={styles.createRoomPlus}>
                  <Plus size={9} color="white" strokeWidth={3} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* ══════════ RELATED TAB ══════════ */}
          {activeTopTab === "Related" && (
            <>
              {/* Create My Room */}
              <TouchableOpacity
                style={styles.createCard}
                activeOpacity={0.85}
                onPress={createRoom}
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
                  <TouchableOpacity key={card.id} style={styles.featureCard} activeOpacity={0.85}>
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
                          <Image source={{ uri: user.avatar }} style={styles.recommendAvatar} />
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
});
