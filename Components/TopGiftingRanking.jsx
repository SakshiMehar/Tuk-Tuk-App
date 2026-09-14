import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Path,
  Polygon,
  Stop,
  LinearGradient as SvgGradient,
  Text as SvgText,
} from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ── TEMPORARY MOCK DATA (COMMENTED) ───────────────────────────────
// Replace with backend gifting/ranking API data later.
// export const MOCK_GIFTING_USERS = [
//   {
//     userId: "user-001",
//     name: "ABHISHEK",
//     profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
//     totalGiftAmount: 200000,
//   },
//   {
//     userId: "user-002",
//     name: "KRRISH",
//     profileImage: "https://randomuser.me/api/portraits/men/44.jpg",
//     totalGiftAmount: 150000,
//   },
//   {
//     userId: "user-003",
//     name: "RAJ",
//     profileImage: "https://randomuser.me/api/portraits/men/68.jpg",
//     totalGiftAmount: 90000,
//   },
//   {
//     userId: "user-004",
//     name: "RAKESH",
//     profileImage: "https://randomuser.me/api/portraits/men/75.jpg",
//     totalGiftAmount: 40000,
//   },
// ];

// Helper: Format gift amounts (e.g. 200000 -> 200K, 1500000 -> 1.5M)
export const formatGiftAmount = (amount) => {
  if (typeof amount !== "number" || isNaN(amount)) return "";
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return String(amount);
};

const WIDGET_WIDTH = 148;
// Header overflows above card, so effective card height is smaller
const WIDGET_HEIGHT = 168;
const MIN_X = 8;
const MAX_X = SCREEN_WIDTH - WIDGET_WIDTH - 8;
const MIN_Y = 70;
const MAX_Y = SCREEN_HEIGHT - WIDGET_HEIGHT - 90;

const INITIAL_X = SCREEN_WIDTH - WIDGET_WIDTH - 12;
const INITIAL_Y = 220;

export default function TopGiftingRanking({
  users,
  title = "Calculator ranking",
  onUserPress,
  visible = true,
}) {
  const topGifters = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    return [...list]
      .sort((a, b) => {
        const diff = (b.totalGiftAmount || 0) - (a.totalGiftAmount || 0);
        if (diff !== 0) return diff;
        return String(a.userId || a.name || "").localeCompare(
          String(b.userId || b.name || ""),
        );
      })
      .slice(0, 3);
  }, [users]);

  const pan = useRef(
    new Animated.ValueXY({ x: INITIAL_X, y: INITIAL_Y }),
  ).current;
  const currentPos = useRef({ x: INITIAL_X, y: INITIAL_Y });
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: false,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, fadeAnim]);

  useEffect(() => {
    const listenerId = pan.addListener((val) => {
      currentPos.current = val;
    });
    return () => pan.removeListener(listenerId);
  }, [pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
        onPanResponderGrant: () => {
          pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset();
          const clampedX = Math.min(Math.max(currentPos.current.x, MIN_X), MAX_X);
          const clampedY = Math.min(Math.max(currentPos.current.y, MIN_Y), MAX_Y);
          Animated.spring(pan, {
            toValue: { x: clampedX, y: clampedY },
            useNativeDriver: false,
            friction: 7,
            tension: 40,
          }).start();
        },
        onPanResponderTerminate: () => pan.flattenOffset(),
      }),
    [pan],
  );

  if (!visible) return null;

  return (
    // Outer wrapper gives space for the header that overflows above
    <Animated.View
      style={[
        styles.outerWrapper,
        {
          transform: pan.getTranslateTransform(),
          opacity: fadeAnim,
        },
      ]}
      {...panResponder.panHandlers}
    >
      {/* ── HEADER — Octagonal SVG badge overflows above card ── */}
      <View style={styles.headerOverflow}>
        <OctagonHeader title={title} width={WIDGET_WIDTH - 16} height={30} />
      </View>

      {/* ── CARD BODY ── */}
      {/* Outer border layer */}
      <View style={styles.outerBorder}>
        {/* Gradient fill */}
        <LinearGradient
          colors={["rgba(110, 86, 180, 0.98)", "rgba(62, 47, 120, 0.97)", "rgba(50, 36, 105, 0.99)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Inner white border with gap */}
          <View style={styles.innerWhiteBorder}>
            {/* Subtle inner highlight line below header */}
            <View style={styles.innerTopLine} />

            {/* Rows */}
            <View style={styles.body}>
              {topGifters.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No rankings yet</Text>
                </View>
              ) : (
                topGifters.map((user, idx) => {
                  const rank = idx + 1;
                  const avatarUri = user.profileImage || user.profileImageUrl;
                  const userName =
                    user.name || user.username || `User ${user.userId || rank}`;
                  return (
                    <RankingRow
                      key={user.userId || `gifter-${idx}`}
                      user={user}
                      rank={rank}
                      avatarUri={avatarUri}
                      userName={userName}
                      onPress={onUserPress}
                    />
                  );
                })
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Animated.View>
  );
}

// ── Octagonal Header Badge (SVG) ────────────────────────────────
// Matches the reference image: rectangular body with diagonal corner cuts,
// two concentric border lines (outer glow + inner bright), deep purple gradient fill.
function OctagonHeader({ title, width = 132, height = 30 }) {
  const W = width;
  const H = height;
  const cut = 7; // corner diagonal cut size

  // Outer polygon path (full octagon shape)
  const outerPts = `
    ${cut},0
    ${W - cut},0
    ${W},${cut}
    ${W},${H - cut}
    ${W - cut},${H}
    ${cut},${H}
    0,${H - cut}
    0,${cut}
  `.trim();

  // Inner bright border polygon (inset by 3.5px)
  const i2 = 3.5;
  const innerPts = `
    ${cut + i2},${i2}
    ${W - cut - i2},${i2}
    ${W - i2},${cut + i2}
    ${W - i2},${H - cut - i2}
    ${W - cut - i2},${H - i2}
    ${cut + i2},${H - i2}
    ${i2},${H - cut - i2}
    ${i2},${cut + i2}
  `.trim();

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <SvgGradient id="hdrFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#3b1280" />
          <Stop offset="30%" stopColor="#6d28d9" />
          <Stop offset="50%" stopColor="#7c3aed" />
          <Stop offset="70%" stopColor="#6d28d9" />
          <Stop offset="100%" stopColor="#3b1280" />
        </SvgGradient>
      </Defs>

      {/* Fill */}
      <Polygon points={outerPts} fill="url(#hdrFill)" />

      {/* Outer glow border — soft lavender */}
      <Polygon
        points={outerPts}
        fill="none"
        stroke="rgba(196, 181, 253, 0.55)"
        strokeWidth="1.5"
      />

      {/* Inner bright border — crisp lavender white */}
      <Polygon
        points={innerPts}
        fill="none"
        stroke="rgba(220, 210, 255, 0.85)"
        strokeWidth="0.8"
      />

      {/* Title text centered */}
      <SvgText
        x={W / 2}
        y={H / 2 + 4.5}
        fontSize="11"
        fontWeight="bold"
        fill="#ffffff"
        textAnchor="middle"
        letterSpacing="0.3"
      >
        {title}
      </SvgText>
    </Svg>
  );
}

// ── Medal Badge with Wings (Uniform Crown & Laurel Wings SVG) ───────
function WingedRankMedal({ rank, size = 24 }) {
  const MEDAL_THEMES = {
    1: {
      wingGrad: ["#fff3b0", "#f59e0b", "#d97706", "#92400e"],
      wingLight: ["#fef08a", "#ffffff", "#fef08a"],
      sideGem: "#fef08a",
      centerGem: "#ffffff",
      coreGrad: ["#fb923c", "#f97316", "#c2410c"],
      digitColor: "#fffbeb",
    },
    2: {
      wingGrad: ["#ffffff", "#e2e8f0", "#94a3b8", "#64748b"],
      wingLight: ["#ffffff", "#e0e7ff", "#a5b4fc"],
      sideGem: "#e2e8f0",
      centerGem: "#ffffff",
      coreGrad: ["#38bdf8", "#0284c7", "#0369a1"],
      digitColor: "#ffffff",
    },
    3: {
      wingGrad: ["#ffffff", "#fce7f3", "#cbd5e1", "#94a3b8"],
      wingLight: ["#ffffff", "#fdf2f8", "#e2e8f0"],
      sideGem: "#fce7f3",
      centerGem: "#ffffff",
      coreGrad: ["#34d399", "#059669", "#047857"],
      digitColor: "#ffffff",
    },
  };

  const theme = MEDAL_THEMES[rank] || MEDAL_THEMES[3];
  const wingGradId = `wingGrad_${rank}`;
  const wingLightId = `wingLight_${rank}`;
  const coreGradId = `coreGrad_${rank}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        {/* Metallic gradient for wings, crown & rim */}
        <SvgGradient id={wingGradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={theme.wingGrad[0]} />
          <Stop offset="30%" stopColor={theme.wingGrad[1]} />
          <Stop offset="70%" stopColor={theme.wingGrad[2]} />
          <Stop offset="100%" stopColor={theme.wingGrad[3]} />
        </SvgGradient>

        {/* Highlight gradient for wing feathers */}
        <SvgGradient id={wingLightId} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={theme.wingLight[0]} />
          <Stop offset="50%" stopColor={theme.wingLight[1]} />
          <Stop offset="100%" stopColor={theme.wingLight[2]} />
        </SvgGradient>

        {/* Core color gradient */}
        <SvgGradient id={coreGradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={theme.coreGrad[0]} />
          <Stop offset="40%" stopColor={theme.coreGrad[1]} />
          <Stop offset="100%" stopColor={theme.coreGrad[2]} />
        </SvgGradient>
      </Defs>

      {/* Top 3-Point Crown */}
      <Path
        d="M11 7.5 L12.5 3.5 L16 5.5 L19.5 3.5 L21 7.5 Z"
        fill={`url(#${wingGradId})`}
      />
      <Circle cx="12.5" cy="3.5" r="0.9" fill={theme.sideGem} />
      <Circle cx="16" cy="5.2" r="1.1" fill={theme.centerGem} />
      <Circle cx="19.5" cy="3.5" r="0.9" fill={theme.sideGem} />

      {/* Left Laurel Wing */}
      <Path
        d="M7 8.5 C4.5 10 3 13 3 16 C3 18.5 4.2 21 6.5 22.5 C5.5 19.5 6 16.5 8 14 C7 12 7.2 10 8.5 8.5 Z"
        fill={`url(#${wingGradId})`}
      />
      <Path
        d="M5 11 C3.8 12.5 3.5 14.5 4 16.5 C5 15 6.5 14 8 13.5 Z"
        fill={`url(#${wingLightId})`}
        opacity="0.8"
      />

      {/* Right Laurel Wing */}
      <Path
        d="M25 8.5 C27.5 10 29 13 29 16 C29 18.5 27.8 21 25.5 22.5 C26.5 19.5 26 16.5 24 14 C25 12 24.8 10 23.5 8.5 Z"
        fill={`url(#${wingGradId})`}
      />
      <Path
        d="M27 11 C28.2 12.5 28.5 14.5 28 16.5 C27 15 25.5 14 24 13.5 Z"
        fill={`url(#${wingLightId})`}
        opacity="0.8"
      />

      {/* Bottom Pointed Shield Base */}
      <Path
        d="M10 24.5 Q16 29 16 29.5 Q16 29 22 24.5 C20 27.5 17 29.5 16 30 C15 29.5 12 27.5 10 24.5 Z"
        fill={`url(#${wingGradId})`}
      />

      {/* Outer Metallic Ring Frame */}
      <Circle
        cx="16"
        cy="16.5"
        r="9.5"
        fill="none"
        stroke={`url(#${wingGradId})`}
        strokeWidth="2.2"
      />

      {/* Inner Core */}
      <Circle cx="16" cy="16.5" r="8.2" fill={`url(#${coreGradId})`} />

      {/* Inner highlight arc */}
      <Path
        d="M9.5 14.5 A7.2 7.2 0 0 1 22.5 14.5 A7.2 6 0 0 0 9.5 14.5 Z"
        fill="#ffffff"
        opacity="0.25"
      />

      {/* Rank Digit */}
      <SvgText
        x="16"
        y="20.8"
        fontSize="11.5"
        fontWeight="900"
        fill={theme.digitColor}
        textAnchor="middle"
      >
        {rank}
      </SvgText>
    </Svg>
  );
}

// ── Ranking Row ───────────────────────────────────────────────
function RankingRow({ user, rank, avatarUri, userName, onPress }) {
  const [imgError, setImgError] = useState(false);

  return (
    <View style={styles.row}>
      {/* Winged Medal */}
      <View style={styles.medalWrap}>
        <WingedRankMedal rank={rank} />
      </View>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {avatarUri && !imgError ? (
          <Image
            source={{ uri: avatarUri }}
            style={styles.avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Name */}
      <View style={styles.nameCol}>
        <Text style={styles.userName} numberOfLines={1}>
          {userName}
        </Text>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Wrapper leaves 14px padding at top for header overflow
  outerWrapper: {
    position: "absolute",
    width: WIDGET_WIDTH,
    zIndex: 90,
    paddingTop: 14,
  },

  // Header overflows above card
  headerOverflow: {
    position: "absolute",
    top: 0,
    left: 8,
    right: 8,
    zIndex: 2,
    alignItems: "center",
    shadowColor: "#a78bfa",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 8,
  },

  // Card outer border (the violet/purple glow border)
  outerBorder: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(167, 139, 250, 0.85)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },

  // Gradient card fill
  cardGradient: {
    borderRadius: 13,
    padding: 2.5, // gap between outer border and inner white border
  },

  // Inner white border with clean gap from outer border
  innerWhiteBorder: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.75)",
    overflow: "hidden",
  },

  // Subtle inner highlight line at top (inside card, just below header area)
  innerTopLine: {
    height: 1,
    marginTop: 11,
    marginHorizontal: 8,
    backgroundColor: "rgba(196, 181, 253, 0.3)",
    borderRadius: 1,
  },

  body: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    paddingBottom: 6,
    gap: 2,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 2,
    gap: 5,
  },
  medalWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  avatarWrap: {
    flexShrink: 0,
  },

  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#5b21b6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  nameCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  userName: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  emptyContainer: {
    paddingVertical: 12,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 10,
  },
});