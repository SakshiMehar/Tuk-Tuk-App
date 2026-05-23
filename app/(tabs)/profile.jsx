import { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const meImg = require("../../assets/images/me.png");
const profileImg = require("../../assets/images/android-icon-background.png");
const frameImg = require("../../assets/images/new-user-frame.png");

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
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.8}>
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
              <Image source={profileImg} style={styles.profilePic} />
              <Image source={frameImg} style={styles.profileFrame} resizeMode="contain" />
            </View>

            {/* Name + ID + badges */}
            <View style={styles.profileInfoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.userName} numberOfLines={1}>Tuk Tuk User</Text>
                <TouchableOpacity style={styles.editBtn} activeOpacity={0.8}>
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
                    <TouchableOpacity key={item.label} style={styles.menuGridItem} activeOpacity={0.7}>
                      <View style={styles.menuIconBox}>
                        <FontAwesome5 name={item.icon} size={22} color="#a78bfa" />
                      </View>
                      <Text style={styles.menuGridLabel}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Row 2 — items 4-7 */}
                <View style={styles.menuRow}>
                  {page.slice(4, 8).map((item) => (
                    <TouchableOpacity key={item.label} style={styles.menuGridItem} activeOpacity={0.7}>
                      <View style={styles.menuIconBox}>
                        <FontAwesome5 name={item.icon} size={22} color="#a78bfa" />
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
});
