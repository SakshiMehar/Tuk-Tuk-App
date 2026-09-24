import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { X, Zap } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Defs, Polygon, Stop, LinearGradient as SvgGradient, Text as SvgText } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const CARD_WIDTH = 190;
const MIN_X = 8;
const MAX_X = SCREEN_WIDTH - CARD_WIDTH - 8;
const MIN_Y = 70;
const MAX_Y = SCREEN_HEIGHT - 200;
const INITIAL_X = Math.round((SCREEN_WIDTH - CARD_WIDTH) / 2);
const INITIAL_Y = 130;

const computeRemaining = (endsAt) => {
  if (!endsAt) return null;
  const ms = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
};

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
};

function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(() => computeRemaining(endsAt));
  useEffect(() => {
    setRemaining(computeRemaining(endsAt));
    if (!endsAt) return undefined;
    const id = setInterval(() => setRemaining(computeRemaining(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);
  return remaining;
}

// ── "Gift PK" ribbon header — same cut-corner badge technique as
// TopGiftingRanking's OctagonHeader, recolored gold→blue for the PK theme. ──
function PkRibbon({ title, width = CARD_WIDTH - 46, height = 25 }) {
  const cut = 6;
  const outerPts = `
    ${cut},0 ${width - cut},0 ${width},${cut} ${width},${height - cut}
    ${width - cut},${height} ${cut},${height} 0,${height - cut} 0,${cut}
  `.trim();

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        <SvgGradient id="pkRibbonFill" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor="#fbbf24" />
          <Stop offset="45%" stopColor="#f59e0b" />
          <Stop offset="52%" stopColor="#3b82f6" />
          <Stop offset="100%" stopColor="#00c2ff" />
        </SvgGradient>
      </Defs>
      <Polygon points={outerPts} fill="url(#pkRibbonFill)" />
      <Polygon points={outerPts} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" />
      <SvgText
        x={width / 2}
        y={height / 2 + 4}
        fontSize="10"
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

function Avatar({ uri, name, size = 42 }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return uri ? (
    <Image source={{ uri }} style={[styles.avatarImg, { width: size, height: size, borderRadius: size / 2 }]} contentFit="cover" />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

/** Floating, draggable PK card for the room — challenge prompt, waiting
 *  state, live "Gift PK" scoreboard, or the final result — driven entirely
 *  by `battle` (the normalized object from pkBattleService) and `role`
 *  (this viewer's relationship to it: "hostA" | "hostB" | "teamA" | "teamB"
 *  | "bystander"). Drags exactly like TopGiftingRanking's ranking widget. */
export default function PkLiveBanner({
  battle,
  role,
  onAccept,
  onReject,
  onDismiss,
  actionLoading,
  resolveUser,
  topOffset = INITIAL_Y,
}) {
  const remaining = useCountdown(battle?.endsAt);

  const pan = useRef(new Animated.ValueXY({ x: INITIAL_X, y: topOffset })).current;
  const currentPos = useRef({ x: INITIAL_X, y: topOffset });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const hasPositioned = useRef(false);

  useEffect(() => {
    if (battle && !hasPositioned.current) {
      hasPositioned.current = true;
      pan.setValue({ x: INITIAL_X, y: topOffset });
      currentPos.current = { x: INITIAL_X, y: topOffset };
    }
    if (!battle) hasPositioned.current = false;
  }, [battle, pan, topOffset]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: battle ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [battle, fadeAnim]);

  useEffect(() => {
    const id = pan.addListener((val) => {
      currentPos.current = val;
    });
    return () => pan.removeListener(id);
  }, [pan]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
        onPanResponderGrant: () => {
          pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
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

  if (!battle) return null;

  const isPending = battle.status === "PENDING";
  const isLive = battle.status === "LIVE";
  const metaA = resolveUser?.(battle.hostAId);
  const metaB = resolveUser?.(battle.hostBId);
  const nameA = battle.hostAName || metaA?.name || "Host A";
  const nameB = battle.hostBName || metaB?.name || "Host B";
  const avatarA = battle.hostAAvatar || metaA?.avatar || null;
  const avatarB = battle.hostBAvatar || metaB?.avatar || null;

  const ribbonTitle = isPending ? "PK Challenge" : isLive ? "Gift PK" : "PK Result";
  const topContributor = Array.isArray(battle.contributors) && battle.contributors.length > 0
    ? battle.contributors.find((c) => c.rank === 1) || battle.contributors[0]
    : null;

  return (
    <Animated.View
      style={[styles.outerWrapper, { transform: pan.getTranslateTransform(), opacity: fadeAnim }]}
      {...panResponder.panHandlers}
    >
      <View style={styles.ribbonWrap}>
        <PkRibbon title={ribbonTitle} />
      </View>

      <View style={styles.cardOuter}>
        <LinearGradient colors={["#16233f", "#0c1526"]} style={styles.cardBg}>
          {/* I'm the challenged host — Accept / Reject prompt */}
          {isPending && role === "hostB" && (
            <View style={styles.promptBody}>
              <Text style={styles.subtitle} numberOfLines={2}>
                {nameA} wants to battle you!
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  activeOpacity={0.85}
                  disabled={actionLoading}
                  onPress={onReject}
                >
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.acceptBtn]}
                  activeOpacity={0.85}
                  disabled={actionLoading}
                  onPress={onAccept}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.actionBtnText}>Accept</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Challenge sent — waiting on the other host */}
          {isPending && role !== "hostB" && (
            <View style={styles.waitingRow}>
              <ActivityIndicator color="#a78bfa" size="small" />
              <Text style={styles.waitingText} numberOfLines={2}>
                Waiting for {nameB} to accept…
              </Text>
            </View>
          )}

          {/* Live "Gift PK" scoreboard */}
          {isLive &&
            (() => {
              const total = battle.teamAScore + battle.teamBScore || 1;
              const pctA = Math.min(100, Math.max(0, Math.round((battle.teamAScore / total) * 100)));
              return (
                <View>
                  <View style={styles.vsRow}>
                    <Avatar uri={avatarA} name={nameA} />
                    <View style={styles.vsBadgeWrap}>
                      <Zap size={15} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.vsText}>VS</Text>
                    </View>
                    <Avatar uri={avatarB} name={nameB} />
                  </View>

                  <View style={styles.barTrack}>
                    <View style={[styles.barFillA, { width: `${pctA}%` }]} />
                    <View style={[styles.barFillB, { width: `${100 - pctA}%` }]} />
                    <View style={[styles.barSpark, { left: `${pctA}%` }]} />
                  </View>

                  <View style={styles.scoreRow}>
                    <View style={styles.scorePillLeft}>
                      <View style={styles.pkCoin}>
                        <Text style={styles.pkCoinText}>PK</Text>
                      </View>
                      <Text style={styles.scoreVal}>{formatCount(battle.teamAScore)}</Text>
                    </View>
                    <View style={styles.scorePillRight}>
                      <Text style={styles.scoreVal}>{formatCount(battle.teamBScore)}</Text>
                      <View style={styles.pkCoin}>
                        <Text style={styles.pkCoinText}>PK</Text>
                      </View>
                    </View>
                  </View>

                  {topContributor && (
                    <View style={styles.topSupporterRow}>
                      <Text style={styles.topSupporterText} numberOfLines={1}>
                        🏆 {topContributor.userName || topContributor.name || "Someone"} +
                        {formatCount(topContributor.points ?? topContributor.value ?? 0)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}

          {/* Finished / cancelled / rejected result */}
          {!isPending && !isLive && (
            <View style={styles.resultRow}>
              <Text style={styles.subtitle} numberOfLines={2}>
                {battle.status === "REJECTED"
                  ? `${nameB} declined the PK challenge.`
                  : battle.status === "CANCELLED"
                    ? "The PK battle was cancelled."
                    : battle.winner === "DRAW"
                      ? "It's a draw!"
                      : battle.winner === "A"
                        ? `${nameA} wins! 🏆`
                        : battle.winner === "B"
                          ? `${nameB} wins! 🏆`
                          : "The PK battle has ended."}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onDismiss}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={11} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>

        {isLive && (
          <View style={styles.timerFooter}>
            <Text style={styles.timerText}>
              {remaining == null ? "--:--" : `${remaining}s`}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    position: "absolute",
    width: CARD_WIDTH,
    zIndex: 90,
    paddingTop: 12,
  },
  ribbonWrap: {
    position: "absolute",
    top: 0,
    left: 23,
    zIndex: 2,
    alignItems: "center",
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  cardOuter: {
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: "rgba(167,139,250,0.5)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
  cardBg: {
    paddingTop: 15,
    paddingBottom: 9,
    paddingHorizontal: 10,
  },

  // Accept/reject prompt
  promptBody: {},
  subtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10.5,
    fontWeight: "600",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rejectBtn: {
    backgroundColor: "rgba(255,68,68,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,68,68,0.4)",
  },
  acceptBtn: {
    backgroundColor: "#7c4dff",
  },
  actionBtnText: {
    color: "white",
    fontSize: 11,
    fontWeight: "800",
  },

  // Waiting
  waitingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  waitingText: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 10.5,
    fontWeight: "600",
  },

  // Live VS row
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  avatarImg: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarFallback: {
    backgroundColor: "#5b21b6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarInitial: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  vsBadgeWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    color: "#fbbf24",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  // Progress bar
  barTrack: {
    flexDirection: "row",
    height: 7,
    borderRadius: 3.5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
    position: "relative",
  },
  barFillA: {
    backgroundColor: "#fbbf24",
  },
  barFillB: {
    backgroundColor: "#00c2ff",
  },
  barSpark: {
    position: "absolute",
    top: -2.5,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
    backgroundColor: "white",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },

  // Score row
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  topSupporterRow: {
    marginTop: 6,
    alignItems: "center",
  },
  topSupporterText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 9.5,
    fontWeight: "700",
  },
  scorePillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scorePillRight: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
  },
  pkCoin: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#fbbf24",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fef3c7",
  },
  pkCoinText: {
    color: "#78350f",
    fontSize: 6,
    fontWeight: "900",
  },
  scoreVal: {
    color: "white",
    fontSize: 12,
    fontWeight: "800",
  },

  // Result row
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  closeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },

  // Countdown footer strip
  timerFooter: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingVertical: 4,
    alignItems: "center",
  },
  timerText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 9.5,
    fontWeight: "700",
  },
});
