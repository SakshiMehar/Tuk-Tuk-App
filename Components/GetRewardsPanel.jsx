import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Share,
  Animated,
  Easing,
  Modal,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Polygon } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  loadInviteFriendsSummary,
  loadInviteFriendsConfig,
  loadInviteFriendsActivity,
  loadInviteFriendsRecord,
  shareInviteFriendsActivity,
  withdrawInviteFriendsEarnings,
} from "../src/services/inviteFriendsService";
import { refreshWalletBalance } from "../src/store/walletStore";

const INVITE_FRIENDS_HERO_BG = require("../assets/Treasure/getrewardbackground.png");
const INVITE_RULES = [
  {
    icon: "people",
    text: "Invite more than 5 friends and get a diamond reward of up to 1000!",
    detailLines: [
      "1000 diamonds immediately when they register.",
      "1500 diamonds when they come back the next day and remain active.",
      "3000 diamonds will be awarded when they come on the mic and log in for 10 minutes daily, continuously for 7 days!",
    ],
    detailFooter: "Stack invites — stack diamonds!",
  },
  {
    icon: "flash",
    text: "If your friend tops up with $1, you instantly get 1000 diamonds!",
    detailLines: ["And when your friends top up $1, you will also earn 1000 Diamonds!"],
  },
  {
    icon: "gift",
    text: "Whenever your friends send gifts, you get a rebate for it!",
    detailLines: [
      "For the first 90 days after your friend registers, whenever they buy and send a Diamond gift (not from a backpack), you get 5% cashback on their spent Diamonds!",
    ],
  },
];
// Preview/placeholder data shown while the invite-friends config/activity
// endpoints aren't live yet (404). The /me summary (invite code, stats,
// limited-time task) always comes from the real backend now — no fallback.
// These tier/milestone numbers mirror the real reward ladder from
// GET /api/app/invite-friends/config, so the fallback matches production.
const INVITE_FRIENDS_PREVIEW_CONFIG = {
  tiers: [
    {
      id: "tier-up-to-2",
      title: "Invite up to 2 friends",
      totalReward: 5500,
      milestones: [
        { id: "tier-up-to-2-register", amount: 1000, description: "Register and link your account" },
        { id: "tier-up-to-2-next-day", amount: 1500, description: "Log in to the app the next day and stay on mic for 10 minutes" },
        { id: "tier-up-to-2-week", amount: 3000, description: "Log in daily and stay on mic for 10 minutes, for 7 days" },
      ],
    },
    {
      id: "tier-3-5",
      title: "Invite 3-5 friends",
      totalReward: 7000,
      milestones: [
        { id: "tier-3-5-register", amount: 1200, description: "Register and link your account" },
        { id: "tier-3-5-next-day", amount: 1800, description: "Log in to the app the next day and stay on mic for 10 minutes" },
        { id: "tier-3-5-week", amount: 4000, description: "Log in daily and stay on mic for 10 minutes, for 7 days" },
      ],
    },
    {
      id: "tier-6-plus",
      title: "Invite 6+ friends",
      totalReward: 8700,
      milestones: [
        { id: "tier-6-plus-register", amount: 1500, description: "Register and link your account" },
        { id: "tier-6-plus-next-day", amount: 2200, description: "Log in to the app the next day and stay on mic for 10 minutes" },
        { id: "tier-6-plus-week", amount: 5000, description: "Log in daily and stay on mic for 10 minutes, for 7 days" },
      ],
    },
  ],
};
const INVITE_FRIENDS_PREVIEW_ACTIVITY = [{ maskedName: "Riy***", diamonds: 500 }];
const inviteFriendsHeroAsset = Image.resolveAssetSource(INVITE_FRIENDS_HERO_BG);
// Slightly wider than the asset's true ratio so "cover" always scales to fill
// the full width with margin to spare — avoids a hairline gap on the left/right
// edge from sub-pixel rounding when the box's aspect ratio matches the image exactly.
const INVITE_FRIENDS_HERO_ASPECT_RATIO =
  (inviteFriendsHeroAsset?.width && inviteFriendsHeroAsset?.height
    ? inviteFriendsHeroAsset.width / inviteFriendsHeroAsset.height
    : 16 / 9) * 1.02;

const RECORD_TABS = [
  { key: "friends", label: "Friends" },
  { key: "rewards", label: "Rewards Received" },
  { key: "unclaimed", label: "Unclaimed earnings" },
];

// Text with a bright highlight band continuously sweeping across it — used to
// make the "Go and invite your friends" announcement read as more eye-catching.
// A dim base copy of the text keeps it legible; the masked shimmer band on top
// is what actually moves.
function ShimmerText({ children, style, numberOfLines }) {
  const [textWidth, setTextWidth] = useState(0);
  const shimmerX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerX, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerX]);

  const bandWidth = Math.max(textWidth * 0.5, 30);
  const translateX = shimmerX.interpolate({
    inputRange: [0, 1],
    outputRange: [-bandWidth, textWidth + bandWidth],
  });

  return (
    <MaskedView
      style={{ flex: 1 }}
      maskElement={
        <Text
          style={style}
          numberOfLines={numberOfLines}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        >
          {children}
        </Text>
      }
    >
      <Text style={[style, { opacity: 0.55 }]} numberOfLines={numberOfLines}>
        {children}
      </Text>
      {textWidth > 0 ? (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: bandWidth,
            transform: [{ translateX }],
          }}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "#ffffff", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </MaskedView>
  );
}

// Hexagonal ribbon banner used for section headers below the invite code —
// same shape language as MonthlyCardPanel's Ribbon, in the app's purple/pink theme.
function SectionRibbon({ title, style }) {
  return (
    <View style={[styles.ribbonOuter, style]}>
      <View style={styles.ribbonWrap}>
        <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={StyleSheet.absoluteFill}>
          <Polygon points="6,0 94,0 100,50 94,100 6,100 0,50" fill="rgba(59,26,120,0.9)" stroke="#e879f9" strokeWidth={1.4} />
        </Svg>
        <Text style={styles.ribbonText} numberOfLines={1}>{title}</Text>
      </View>
      <View style={styles.ribbonAccent}>
        <Ionicons name="diamond" size={9} color="#e879f9" />
      </View>
    </View>
  );
}

// Horizontal glow bar behind the big reward/count numbers — dark at the edges,
// brighter in the middle, mirroring the "spotlight" look in the reference design.
function GlowBar({ children, style }) {
  return (
    <LinearGradient
      colors={["rgba(59,26,120,0)", "rgba(232,121,249,0.35)", "rgba(59,26,120,0)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.glowBar, style]}
    >
      {children}
    </LinearGradient>
  );
}

export default function GetRewardsPanel({ active }) {
  const [inviteSummary, setInviteSummary] = useState(null);
  const [inviteConfig, setInviteConfig] = useState(null);
  const [inviteActivity, setInviteActivity] = useState([]);
  const [inviteActivityIndex, setInviteActivityIndex] = useState(0);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteRecordTab, setInviteRecordTab] = useState("friends");
  const [inviteRecordItems, setInviteRecordItems] = useState([]);
  const [inviteRecordLoading, setInviteRecordLoading] = useState(false);
  const [inviteSharing, setInviteSharing] = useState(false);
  const [inviteWithdrawing, setInviteWithdrawing] = useState(false);
  const [ruleDetailIndex, setRuleDetailIndex] = useState(null);

  const shareInviteBtnPulse = useRef(new Animated.Value(0)).current;
  const inviteGoBtnNudge = useRef(new Animated.Value(0)).current;
  const inviteTickerNudge = useRef(new Animated.Value(0)).current;

  // "Share and get diamonds" — gentle breathing glow loop to draw the eye to the CTA
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shareInviteBtnPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shareInviteBtnPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shareInviteBtnPulse]);

  // "Go" (invite friends) — continuous right-to-left slide so it never sits still.
  // Uses only non-zero-duration timings (same reliable pattern as the share-button
  // pulse above) — a duration:0 native-driver step can silently get stuck mid-loop.
  useEffect(() => {
    const nudge = Animated.loop(
      Animated.sequence([
        Animated.timing(inviteGoBtnNudge, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(inviteGoBtnNudge, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(150),
      ])
    );
    nudge.start();
    return () => nudge.stop();
  }, [inviteGoBtnNudge]);

  // "Go and invite your friends" ticker banner — same reliable right-to-left slide
  useEffect(() => {
    const tickerNudge = Animated.loop(
      Animated.sequence([
        Animated.timing(inviteTickerNudge, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(250),
        Animated.timing(inviteTickerNudge, { toValue: 0, duration: 150, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(150),
      ])
    );
    tickerNudge.start();
    return () => tickerNudge.stop();
  }, [inviteTickerNudge]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    setInviteLoading(true);

    // /me is the real, live backend endpoint — invite code, stats, and the
    // limited-time task always come from here now. No placeholder fallback.
    const summaryPromise = loadInviteFriendsSummary()
      .then((summary) => {
        if (!cancelled) setInviteSummary(summary);
      })
      .catch(() => {
        if (!cancelled) setInviteSummary(null);
      });

    // Config/activity endpoints aren't confirmed live yet — fall back to
    // preview data on 404 so the rest of the screen still renders.
    const configActivityPromise = Promise.all([
      loadInviteFriendsConfig(),
      loadInviteFriendsActivity(),
    ])
      .then(([config, activity]) => {
        if (cancelled) return;
        setInviteConfig(config);
        setInviteActivity(activity);
        setInviteActivityIndex(0);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err?.status === 404) {
          setInviteConfig(INVITE_FRIENDS_PREVIEW_CONFIG);
          setInviteActivity(INVITE_FRIENDS_PREVIEW_ACTIVITY);
          setInviteActivityIndex(0);
          return;
        }
        setInviteConfig(null);
        setInviteActivity([]);
      });

    Promise.all([summaryPromise, configActivityPromise]).finally(() => {
      if (!cancelled) setInviteLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    if (inviteActivity.length < 2) return;
    const timer = setInterval(() => {
      setInviteActivityIndex((prev) => (prev + 1) % inviteActivity.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [inviteActivity]);

  const loadInviteRecordTab = useCallback((tab) => {
    setInviteRecordLoading(true);
    loadInviteFriendsRecord(tab)
      .then(({ items }) => setInviteRecordItems(items))
      .catch(() => setInviteRecordItems([]))
      .finally(() => setInviteRecordLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    loadInviteRecordTab(inviteRecordTab);
  }, [active, inviteRecordTab, loadInviteRecordTab]);

  const handleCopyInviteCode = async () => {
    if (!inviteSummary?.inviteCode) return;
    await Clipboard.setStringAsync(inviteSummary.inviteCode);
    Alert.alert("Copied!", "Invite code copied to clipboard.");
  };

  const handleShareInviteFriends = async () => {
    if (inviteSharing) return;
    setInviteSharing(true);
    try {
      const message = inviteSummary?.inviteLink
        ? `Join me on Tuk Tuk! Use my invite code ${inviteSummary.inviteCode}: ${inviteSummary.inviteLink}`
        : `Join me on Tuk Tuk! Use my invite code ${inviteSummary?.inviteCode ?? ""}`;
      const result = await Share.share({ message });
      if (result.action === Share.sharedAction) {
        const summary = await shareInviteFriendsActivity();
        setInviteSummary(summary);
      }
    } catch (err) {
      Alert.alert("Could not share", err?.message || "Please try again.");
    } finally {
      setInviteSharing(false);
    }
  };

  const handleWithdrawInviteDiamonds = async () => {
    if (inviteWithdrawing || !inviteSummary?.unclaimedEarnings) return;
    setInviteWithdrawing(true);
    try {
      const summary = await withdrawInviteFriendsEarnings();
      setInviteSummary(summary);
      await refreshWalletBalance();
      Alert.alert("Withdrawn!", `${summary.unclaimedEarnings === 0 ? "All diamonds" : "Diamonds"} added to your wallet.`);
    } catch (err) {
      Alert.alert("Could not withdraw", err?.message || "Please try again.");
    } finally {
      setInviteWithdrawing(false);
    }
  };

  const activityItem = inviteActivity[inviteActivityIndex] ?? null;
  const canWithdraw = Number(inviteSummary?.unclaimedEarnings ?? 0) > 0;
  const activeRuleDetail = ruleDetailIndex !== null ? INVITE_RULES[ruleDetailIndex] : null;

  if (inviteLoading && !inviteSummary) {
    return (
      <View style={styles.invLoadingBox}>
        <ActivityIndicator color="#e879f9" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[styles.invHeroContainer, { aspectRatio: INVITE_FRIENDS_HERO_ASPECT_RATIO }]}>
        <Image
          source={INVITE_FRIENDS_HERO_BG}
          style={styles.invHeroImage}
          resizeMode="cover"
        />
        <TouchableOpacity
          style={styles.invHeroFaqPill}
          activeOpacity={0.8}
          onPress={() => Alert.alert("FAQ", "Tap any rule below to see full details.")}
        >
          <Text style={styles.invFaqPillText}>? FAQ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mmScroll}>

      {activityItem ? (
        <View style={styles.invTicker}>
          <Ionicons name="volume-high" size={14} color="#e879f9" />
          <Animated.View
            style={{
              flex: 1,
              transform: [
                {
                  translateX: inviteTickerNudge.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, -8],
                  }),
                },
              ],
            }}
          >
            <ShimmerText style={styles.invTickerText} numberOfLines={1}>
              Go and invite your friends
            </ShimmerText>
          </Animated.View>
        </View>
      ) : null}

      <LinearGradient
        colors={["rgba(124,77,255,0.22)", "rgba(59,26,120,0.4)"]}
        style={styles.invRulesCard}
      >
        <SectionRibbon title="Invite Rules" style={styles.sectionRibbon} />

        {INVITE_RULES.map((rule, index) => (
          <TouchableOpacity
            key={rule.text}
            style={[styles.invRuleRow, index === INVITE_RULES.length - 1 && { marginBottom: 0 }]}
            activeOpacity={0.8}
            onPress={() => setRuleDetailIndex(index)}
          >
            <LinearGradient colors={["#7c4dff", "#e879f9"]} style={styles.invRuleIconBadge}>
              <Ionicons name={rule.icon} size={15} color="white" />
            </LinearGradient>
            <Text style={styles.invRuleText}>{rule.text}</Text>
            <Ionicons name="chevron-forward" size={16} color="#e879f9" />
          </TouchableOpacity>
        ))}
      </LinearGradient>

      <Animated.View
        style={[
          styles.mmPrimaryBtnGlowWrap,
          { alignSelf: "center", width: "75%" },
          {
            transform: [
              {
                scale: shareInviteBtnPulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.06],
                }),
              },
            ],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shareInviteBtnAura,
            {
              opacity: shareInviteBtnPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.15, 0.9],
              }),
            },
          ]}
        />
        <TouchableOpacity style={styles.mmPrimaryBtnInner} activeOpacity={0.8} onPress={handleShareInviteFriends} disabled={inviteSharing}>
          <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.mmPrimaryBtnGrad, styles.shareInviteBtnGradCompact]}>
            <Text style={[styles.mmPrimaryBtnText, styles.shareInviteBtnTextCompact]}>
              {inviteSharing ? "Sharing..." : "Share and get diamonds"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {inviteSummary?.inviteCode ? (
        <TouchableOpacity style={styles.invCodeRow} activeOpacity={0.8} onPress={handleCopyInviteCode}>
          <Text style={styles.invCodeText}>My invite code: {inviteSummary.inviteCode}</Text>
          <Ionicons name="copy-outline" size={16} color="#a78bfa" />
        </TouchableOpacity>
      ) : null}

      {(inviteConfig?.tiers ?? []).map((tier) => (
        <LinearGradient
          key={tier.id}
          colors={["rgba(124,77,255,0.22)", "rgba(59,26,120,0.4)"]}
          style={styles.invTierCard}
        >
          <SectionRibbon title={tier.title} style={styles.sectionRibbon} />
          <GlowBar style={{ marginTop: 14 }}>
            <Text style={styles.invTierTotal}>💎 {tier.totalReward}</Text>
          </GlowBar>
          <View style={styles.invMilestoneRow}>
            {tier.milestones.map((m) => (
              <LinearGradient
                key={m.id}
                colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]}
                style={styles.invMilestoneCell}
              >
                <Text style={styles.invMilestoneAmount}>💎 {m.amount}</Text>
                <Text style={styles.invMilestoneDesc}>{m.description}</Text>
              </LinearGradient>
            ))}
          </View>
        </LinearGradient>
      ))}

      {inviteSummary?.limitedTask ? (
        <LinearGradient
          colors={["rgba(124,77,255,0.22)", "rgba(59,26,120,0.4)"]}
          style={styles.invLimitedTaskCard}
        >
          <SectionRibbon title="Limit Time Task" style={styles.sectionRibbon} />
          <View style={styles.invLimitedTaskRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.invLimitedTaskLabel}>
                {inviteSummary.limitedTask.label} ({inviteSummary.limitedTask.progressCount}/{inviteSummary.limitedTask.targetCount})
              </Text>
              {inviteSummary.limitedTask.durationLabel ? (
                <Text style={styles.invLimitedTaskDuration}>{inviteSummary.limitedTask.durationLabel}</Text>
              ) : null}
            </View>
            <Animated.View
              style={
                inviteSummary.limitedTask.completed
                  ? undefined
                  : {
                      transform: [
                        {
                          translateX: inviteGoBtnNudge.interpolate({
                            inputRange: [0, 1],
                            outputRange: [7, -7],
                          }),
                        },
                      ],
                    }
              }
            >
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={inviteSummary.limitedTask.completed || inviteSharing}
                onPress={handleShareInviteFriends}
              >
                <LinearGradient colors={["#7c4dff", "#e879f9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.invGoBtn}>
                  <Text style={styles.invGoBtnText}>{inviteSummary.limitedTask.completed ? "Done" : "Go"}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </LinearGradient>
      ) : null}

      <LinearGradient
        colors={["rgba(124,77,255,0.22)", "rgba(59,26,120,0.4)"]}
        style={styles.invRecordCard}
      >
        <SectionRibbon title="Invitation Record" style={styles.sectionRibbon} />

        <GlowBar style={{ marginTop: 14 }}>
          <Text style={styles.invRecordCount}>{inviteSummary?.successfulInvitations ?? 0}</Text>
        </GlowBar>
        <Text style={styles.invRecordCountLabel}>Successful invitation</Text>

        <View style={styles.invStatRow}>
          <LinearGradient colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]} style={styles.invStatBox}>
            <Text style={styles.invStatValue}>💎 {inviteSummary?.rewardsReceived ?? 0}</Text>
            <Text style={styles.invStatLabel}>Rewards Received</Text>
          </LinearGradient>
          <LinearGradient colors={["rgba(124,77,255,0.28)", "rgba(59,26,120,0.5)"]} style={styles.invStatBox}>
            <Text style={styles.invStatValue}>💎 {inviteSummary?.unclaimedEarnings ?? 0}</Text>
            <Text style={styles.invStatLabel}>Unclaimed earnings</Text>
          </LinearGradient>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!canWithdraw || inviteWithdrawing}
          onPress={handleWithdrawInviteDiamonds}
        >
          <LinearGradient
            colors={canWithdraw ? ["#7c4dff", "#e879f9"] : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.08)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.invWithdrawBtn}
          >
            <Text style={[styles.invWithdrawBtnText, !canWithdraw && styles.invWithdrawBtnTextDisabled]}>
              {inviteWithdrawing ? "Withdrawing..." : "Withdraw Diamonds"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.invTabRow}>
          {RECORD_TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.invTabItem}
              activeOpacity={0.8}
              onPress={() => setInviteRecordTab(t.key)}
            >
              <Text style={[styles.invTabText, inviteRecordTab === t.key && styles.invTabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => loadInviteRecordTab(inviteRecordTab)}>
            <Ionicons name="refresh" size={18} color="#a78bfa" />
          </TouchableOpacity>
        </View>

        {inviteRecordLoading ? (
          <ActivityIndicator color="#a78bfa" style={{ marginVertical: 16 }} />
        ) : inviteRecordItems.length === 0 ? (
          <Text style={styles.mmInfoText}>Nothing here yet.</Text>
        ) : (
          inviteRecordItems.map((entry) => (
            <View key={entry.id} style={styles.invRecordRow}>
              <Text style={styles.invRecordName}>{entry.name}</Text>
              <Text style={styles.invRecordAmount}>💎 {entry.diamonds}</Text>
            </View>
          ))
        )}
      </LinearGradient>
      </View>
    </ScrollView>

    <TouchableOpacity
      style={styles.floatingFaqPill}
      activeOpacity={0.8}
      onPress={() => Alert.alert("FAQ", "Track invited friends, rewards received, and diamonds you can still withdraw.")}
    >
      <Text style={styles.invFaqPillText}>? FAQ</Text>
    </TouchableOpacity>

    <Modal
      visible={activeRuleDetail !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setRuleDetailIndex(null)}
    >
      <View style={styles.ruleModalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={() => setRuleDetailIndex(null)}
        />
        <LinearGradient colors={["#1a0a2e", "#2d1b4e", "#1a0a2e"]} style={styles.ruleModalCard}>
          <LinearGradient colors={["#7c4dff", "#e879f9"]} style={styles.ruleModalIconBadge}>
            <Ionicons name={activeRuleDetail?.icon ?? "help-circle"} size={22} color="white" />
          </LinearGradient>
          <Text style={styles.ruleModalTitle}>{activeRuleDetail?.text}</Text>
          <View style={styles.ruleModalDivider} />
          {(activeRuleDetail?.detailLines ?? []).map((line, i) => (
            <View key={line} style={styles.ruleModalLineRow}>
              {activeRuleDetail.detailLines.length > 1 ? (
                <Text style={styles.ruleModalLineNumber}>{i + 1}.</Text>
              ) : null}
              <Text style={styles.ruleModalLineText}>{line}</Text>
            </View>
          ))}
          {activeRuleDetail?.detailFooter ? (
            <Text style={styles.ruleModalFooter}>{activeRuleDetail.detailFooter}</Text>
          ) : null}
          <TouchableOpacity
            style={styles.ruleModalCloseBtn}
            activeOpacity={0.85}
            onPress={() => setRuleDetailIndex(null)}
          >
            <Text style={styles.ruleModalCloseBtnText}>Got it</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mmScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  mmInfoText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
  ruleModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  ruleModalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    padding: 22,
    alignItems: "center",
  },
  ruleModalIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  ruleModalTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 21,
  },
  ruleModalDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(232,121,249,0.25)",
    marginVertical: 16,
  },
  ruleModalLineRow: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 8,
    marginBottom: 10,
  },
  ruleModalLineNumber: {
    color: "#e879f9",
    fontSize: 13,
    fontWeight: "800",
  },
  ruleModalLineText: {
    flex: 1,
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 19,
  },
  ruleModalFooter: {
    color: "#f0d9ff",
    fontSize: 13,
    fontWeight: "800",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  ruleModalCloseBtn: {
    alignSelf: "stretch",
    backgroundColor: "#7c4dff",
    borderRadius: 999,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 16,
  },
  ruleModalCloseBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  mmPrimaryBtnGlowWrap: {
    borderRadius: 24,
    marginTop: 16,
    alignSelf: "stretch",
    shadowColor: "#e879f9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  mmPrimaryBtnInner: {
    borderRadius: 24,
    overflow: "hidden",
  },
  mmPrimaryBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  mmPrimaryBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  shareInviteBtnGradCompact: {
    paddingVertical: 11,
    paddingHorizontal: 6,
  },
  shareInviteBtnTextCompact: {
    fontSize: 14,
  },
  shareInviteBtnAura: {
    position: "absolute",
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    borderRadius: 28,
    backgroundColor: "#e879f9",
  },
  invLoadingBox: {
    paddingVertical: 48,
    alignItems: "center",
  },
  invHeroContainer: {
    width: "100%",
    overflow: "hidden",
    marginBottom: 10,
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  invHeroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  invHeroFaqPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(20,8,40,0.75)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.5)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 14,
  },
  invTicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(232,121,249,0.08)",
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.25)",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 16,
  },
  invTickerText: {
    flex: 1,
    color: "#f0d9ff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  ribbonOuter: {
    alignItems: "center",
  },
  ribbonWrap: {
    width: "78%",
    height: 34,
  },
  ribbonText: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: "center",
    textAlignVertical: "center",
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  ribbonAccent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(59,26,120,0.9)",
    borderWidth: 1,
    borderColor: "#e879f9",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -9,
  },
  sectionRibbon: {
    marginBottom: 20,
  },
  glowBar: {
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: "center",
  },
  floatingFaqPill: {
    position: "absolute",
    top: 90,
    right: 0,
    backgroundColor: "rgba(59,26,120,0.92)",
    borderWidth: 1,
    borderColor: "#e879f9",
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    elevation: 4,
  },
  invFaqPillText: {
    color: "#a78bfa",
    fontSize: 11,
    fontWeight: "700",
  },
  invRulesCard: {
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    borderRadius: 18,
    padding: 14,
    paddingTop: 18,
  },
  invRuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.25)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
  },
  invRuleIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  invRuleText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  invCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    marginBottom: 4,
  },
  invCodeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
  },
  invTierCard: {
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    borderRadius: 18,
    padding: 14,
    paddingTop: 18,
    marginTop: 16,
  },
  invTierTotal: {
    color: "#f0d9ff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },
  invMilestoneRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  invMilestoneCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    gap: 4,
  },
  invMilestoneAmount: {
    color: "#f0d9ff",
    fontSize: 13,
    fontWeight: "800",
  },
  invMilestoneDesc: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    textAlign: "center",
  },
  invLimitedTaskCard: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    borderRadius: 18,
    padding: 14,
    paddingTop: 18,
  },
  invLimitedTaskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  invLimitedTaskLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  invLimitedTaskDuration: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
  },
  invGoBtn: {
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  invGoBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
  },
  invRecordCard: {
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.4)",
    borderRadius: 18,
    padding: 14,
    paddingTop: 18,
    marginTop: 20,
  },
  invRecordCount: {
    color: "white",
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
  },
  invRecordCountLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  invStatRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  invStatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(232,121,249,0.3)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 4,
  },
  invStatValue: {
    color: "#f0d9ff",
    fontSize: 15,
    fontWeight: "800",
  },
  invStatLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11,
  },
  invWithdrawBtn: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 18,
  },
  invWithdrawBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "800",
  },
  invWithdrawBtnTextDisabled: {
    color: "rgba(255,255,255,0.35)",
  },
  invTabRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59,26,120,0.5)",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 12,
  },
  invTabItem: {
    flex: 1,
  },
  invTabText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  invTabTextActive: {
    color: "#e879f9",
  },
  invRecordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  invRecordName: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  invRecordAmount: {
    color: "#f0d9ff",
    fontSize: 13,
    fontWeight: "700",
  },
});
