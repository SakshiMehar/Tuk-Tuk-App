import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Shuffle, Heart, X, MessageCircle, Zap, Star } from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");
const CARD_W = W * 0.72;
const CARD_H = CARD_W * 1.3;

const PHASE = { IDLE: "idle", SEARCHING: "searching", MATCHED: "matched" };

const TAGS = [
  { label: "🎵 Music", k: "Music" },
  { label: "🎮 Gaming", k: "Gaming" },
  { label: "✈️ Travel", k: "Travel" },
  { label: "🍳 Cooking", k: "Cooking" },
  { label: "🎨 Art", k: "Art" },
  { label: "⚽ Sports", k: "Sports" },
  { label: "🎬 Movies", k: "Movies" },
  { label: "💻 Tech", k: "Tech" },
  { label: "📸 Photos", k: "Photos" },
  { label: "🌿 Nature", k: "Nature" },
];

const PROFILES = [
  { id: 1, name: "Priya M.", age: 23, distance: "2.1 km", avatar: "https://randomuser.me/api/portraits/women/25.jpg", bio: "Coffee addict & wanderlust ☕🌍", tags: ["Music", "Travel"], rating: 4.8 },
  { id: 2, name: "Aisha K.", age: 21, distance: "4.7 km", avatar: "https://randomuser.me/api/portraits/women/44.jpg", bio: "Artist by day, dreamer by night 🎨✨", tags: ["Art", "Movies"], rating: 4.6 },
  { id: 3, name: "Sneha R.", age: 24, distance: "1.3 km", avatar: "https://randomuser.me/api/portraits/women/62.jpg", bio: "Music is my therapy 🎵💜", tags: ["Music", "Gaming"], rating: 4.9 },
  { id: 4, name: "Meera J.", age: 22, distance: "3.5 km", avatar: "https://randomuser.me/api/portraits/women/33.jpg", bio: "Bookworm & travel enthusiast 📚🌏", tags: ["Travel", "Art"], rating: 4.7 },
  { id: 5, name: "Divya S.", age: 25, distance: "6.2 km", avatar: "https://randomuser.me/api/portraits/women/55.jpg", bio: "Tech nerd who loves gaming 💻🎮", tags: ["Tech", "Gaming"], rating: 4.5 },
];

const FLOAT_PARTICLES = [
  { id: 0, x: -90, emoji: "💫", delay: 0 },
  { id: 1, x: 30, emoji: "✨", delay: 320 },
  { id: 2, x: -30, emoji: "⚡", delay: 640 },
  { id: 3, x: 80, emoji: "🔮", delay: 160 },
  { id: 4, x: -65, emoji: "💜", delay: 480 },
  { id: 5, x: 55, emoji: "🌟", delay: 800 },
  { id: 6, x: -10, emoji: "🎯", delay: 250 },
  { id: 7, x: 100, emoji: "💗", delay: 560 },
];

export default function BlindPick() {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [picked, setPicked] = useState([]);
  const [profile, setProfile] = useState(null);
  const [searchSecs, setSearchSecs] = useState(0);

  // Idle rings
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;
  const r3 = useRef(new Animated.Value(0)).current;
  // Q mark float
  const qFloat = useRef(new Animated.Value(0)).current;
  // Button pulse
  const btnPulse = useRef(new Animated.Value(0)).current;
  // Radar
  const radar = useRef(new Animated.Value(0)).current;
  // Particles
  const pAnims = useRef(FLOAT_PARTICLES.map(() => new Animated.Value(0))).current;
  // Card flip
  const flip = useRef(new Animated.Value(0)).current;
  // Match text
  const matchScale = useRef(new Animated.Value(0)).current;
  const matchOp = useRef(new Animated.Value(0)).current;
  const matchY = useRef(new Animated.Value(-20)).current;
  // Card reveal
  const cardScale = useRef(new Animated.Value(0.7)).current;

  // Timer refs for cleanup
  const matchTimerRef = useRef(null);
  const searchIntervalRef = useRef(null);
  const radarLoopRef = useRef(null);
  const pLoopsRef = useRef([]);
  const idleLoopsRef = useRef([]);

  // ── IDLE ANIMATIONS ──
  useEffect(() => {
    const makeRing = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 2600, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const qLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(qFloat, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
        Animated.timing(qFloat, { toValue: 0, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      ])
    );

    const bLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );

    const loops = [makeRing(r1, 0), makeRing(r2, 870), makeRing(r3, 1740), qLoop, bLoop];
    idleLoopsRef.current = loops;
    loops.forEach(l => l.start());

    return () => {
      loops.forEach(l => l.stop());
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (radarLoopRef.current) radarLoopRef.current.stop();
      pLoopsRef.current.forEach(l => l.stop());
    };
  }, []);

  const startSearch = () => {
    setPhase(PHASE.SEARCHING);
    setSearchSecs(0);

    const radarLoop = Animated.loop(
      Animated.timing(radar, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.linear })
    );
    radarLoopRef.current = radarLoop;
    radarLoop.start();

    const pLoops = pAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(FLOAT_PARTICLES[i].delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      )
    );
    pLoopsRef.current = pLoops;
    pLoops.forEach(l => l.start());

    searchIntervalRef.current = setInterval(() => setSearchSecs(s => s + 1), 1000);

    matchTimerRef.current = setTimeout(() => {
      clearInterval(searchIntervalRef.current);
      radarLoop.stop();
      pLoops.forEach(l => l.stop());
      radar.setValue(0);
      pAnims.forEach(a => a.setValue(0));

      const p = PROFILES[Math.floor(Math.random() * PROFILES.length)];
      setProfile(p);
      flip.setValue(0);
      matchScale.setValue(0);
      matchOp.setValue(0);
      matchY.setValue(-20);
      cardScale.setValue(0.7);
      setPhase(PHASE.MATCHED);

      setTimeout(() => {
        Animated.parallel([
          Animated.spring(matchScale, { toValue: 1, tension: 110, friction: 4, useNativeDriver: true }),
          Animated.timing(matchOp, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(matchY, { toValue: 0, duration: 350, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
        ]).start();
      }, 100);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(flip, { toValue: 180, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.spring(cardScale, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
        ]).start();
      }, 550);
    }, 3500);
  };

  const handleCancel = () => {
    if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (radarLoopRef.current) radarLoopRef.current.stop();
    pLoopsRef.current.forEach(l => l.stop());
    radar.setValue(0);
    pAnims.forEach(a => a.setValue(0));
    setPhase(PHASE.IDLE);
  };

  const handleSkip = () => {
    setProfile(null);
    flip.setValue(0);
    setPhase(PHASE.IDLE);
  };

  const toggleTag = (k) =>
    setPicked(p => p.includes(k) ? p.filter(t => t !== k) : [...p, k]);

  // ── Interpolations ──
  const ri = [r1, r2, r3].map(anim => ({
    sc: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2.5] }),
    op: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.9, 0.4, 0] }),
  }));

  const qY = qFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });
  const btnSc = btnPulse.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.035] });
  const radarSpin = radar.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  const frontRot = flip.interpolate({ inputRange: [0, 180], outputRange: ["0deg", "180deg"] });
  const backRot = flip.interpolate({ inputRange: [0, 180], outputRange: ["180deg", "360deg"] });
  const frontOp = flip.interpolate({ inputRange: [89, 91], outputRange: [1, 0] });
  const backOp = flip.interpolate({ inputRange: [89, 91], outputRange: [0, 1] });

  return (
    <View style={s.wrap}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={["#160625", "#0d0618", "#1a0525"]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.orb1} />
      <View style={s.orb2} />

      {/* ══════════ IDLE ══════════ */}
      {phase === PHASE.IDLE && (
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={s.hdr}>
            <View style={s.onlinePill}>
              <View style={s.onlineDot} />
              <Text style={s.onlineTxt}>4,291 strangers online</Text>
            </View>

            <MaskedView maskElement={<Text style={s.title}>BLIND PICK</Text>}>
              <LinearGradient
                colors={["#ff6eb4", "#ff3f72", "#a647ea"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[s.title, { opacity: 0 }]}>BLIND PICK</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={s.sub}>Swipe into the unknown ✨</Text>
          </View>

          {/* Mystery card + rings */}
          <View style={s.cardArea}>
            {ri.map((r, i) => (
              <Animated.View
                key={i}
                style={[s.ring, { transform: [{ scale: r.sc }], opacity: r.op }]}
              />
            ))}
            <View style={s.mysteryCard}>
              <LinearGradient
                colors={["#2d1255", "#1a0a35", "#0d0618"]}
                style={StyleSheet.absoluteFill}
                borderRadius={24}
              />
              <View style={s.mysteryBorder} />
              <Animated.Text style={[s.qMark, { transform: [{ translateY: qY }] }]}>
                ?
              </Animated.Text>
              <Text style={s.qSub}>Mystery Match</Text>
            </View>
          </View>

          {/* Interest tags */}
          <Text style={s.tagsLabel}>What are you into?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.tagsRow}
          >
            {TAGS.map(({ label, k }) =>
              picked.includes(k) ? (
                <TouchableOpacity key={k} onPress={() => toggleTag(k)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={["#ff3f72", "#a647ea"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.tagActive}
                  >
                    <Text style={s.tagActiveTxt}>{label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity key={k} onPress={() => toggleTag(k)} activeOpacity={0.8} style={s.tagInactive}>
                  <Text style={s.tagInactiveTxt}>{label}</Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.stat}>
              <Text style={s.statVal}>12K+</Text>
              <Text style={s.statLbl}>Active</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statVal}>847</Text>
              <Text style={s.statLbl}>Matched today</Text>
            </View>
            <View style={s.statDiv} />
            <View style={s.stat}>
              <Text style={s.statVal}>~8s</Text>
              <Text style={s.statLbl}>Avg wait</Text>
            </View>
          </View>

          {/* Find Match button */}
          <Animated.View style={[s.btnWrap, { transform: [{ scale: btnSc }] }]}>
            <TouchableOpacity onPress={startSearch} activeOpacity={0.88}>
              <LinearGradient
                colors={["#ff3f72", "#c0186e", "#a647ea"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.findBtn}
              >
                <Shuffle size={22} color="white" />
                <Text style={s.findBtnTxt}>Find My Match</Text>
                <Zap size={18} color="rgba(255,255,255,0.75)" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      )}

      {/* ══════════ SEARCHING ══════════ */}
      {phase === PHASE.SEARCHING && (
        <View style={s.searchWrap}>
          {/* Radar */}
          <View style={s.radarContainer}>
            {[260, 190, 120].map((sz, i) => (
              <View
                key={i}
                style={[s.radarRing, { width: sz, height: sz, borderRadius: sz / 2, opacity: 0.3 - i * 0.06 }]}
              />
            ))}

            {/* Rotating arm */}
            <Animated.View style={[s.radarArmContainer, { transform: [{ rotate: radarSpin }] }]}>
              <LinearGradient
                colors={["transparent", "rgba(255,63,114,0.25)", "rgba(255,63,114,0.85)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.radarArm}
              />
              <LinearGradient
                colors={["transparent", "rgba(255,63,114,0.07)", "rgba(255,63,114,0.2)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.radarTrail}
              />
            </Animated.View>

            {/* Center dot */}
            <LinearGradient colors={["#ff3f72", "#a647ea"]} style={s.radarCenter} />
          </View>

          {/* Floating particles */}
          <View style={s.particleArea} pointerEvents="none">
            {FLOAT_PARTICLES.map((p, i) => {
              const pY = pAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0, -150] });
              const pOp = pAnims[i].interpolate({ inputRange: [0, 0.2, 0.8, 1], outputRange: [0, 1, 0.7, 0] });
              return (
                <Animated.Text
                  key={p.id}
                  style={[s.particle, { left: W / 2 + p.x - 12, transform: [{ translateY: pY }], opacity: pOp }]}
                >
                  {p.emoji}
                </Animated.Text>
              );
            })}
          </View>

          <Text style={s.searchingTxt}>
            Scanning{".".repeat((searchSecs % 3) + 1)}
          </Text>
          <Text style={s.searchingSub}>
            Looking for your mystery match nearby
          </Text>
          <Text style={s.searchTimer}>{searchSecs}s elapsed</Text>

          <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Text style={s.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════════ MATCHED ══════════ */}
      {phase === PHASE.MATCHED && profile && (
        <ScrollView contentContainerStyle={s.matchScroll} showsVerticalScrollIndicator={false}>
          {/* Match text */}
          <Animated.View style={{ transform: [{ scale: matchScale }, { translateY: matchY }], opacity: matchOp, alignItems: "center" }}>
            <MaskedView maskElement={<Text style={s.matchTxt}>It&apos;s a Match! 💫</Text>}>
              <LinearGradient
                colors={["#ff6eb4", "#ff3f72", "#a647ea"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[s.matchTxt, { opacity: 0 }]}>It&apos;s a Match! 💫</Text>
              </LinearGradient>
            </MaskedView>
          </Animated.View>
          <Text style={s.matchSub}>Your mystery match has been revealed!</Text>

          {/* Flip card */}
          <Animated.View style={[s.flipWrap, { transform: [{ scale: cardScale }] }]}>
            {/* Front */}
            <Animated.View
              style={[
                s.cardFace,
                { transform: [{ perspective: 1200 }, { rotateY: frontRot }], opacity: frontOp },
              ]}
            >
              <LinearGradient colors={["#2d1255", "#1a0a35"]} style={StyleSheet.absoluteFill} borderRadius={22} />
              <View style={s.mysteryBorder} />
              <Text style={s.qMarkSm}>?</Text>
            </Animated.View>

            {/* Back */}
            <Animated.View
              style={[
                s.cardFace,
                { transform: [{ perspective: 1200 }, { rotateY: backRot }], opacity: backOp },
              ]}
            >
              <Image source={{ uri: profile.avatar }} style={s.profileImg} />
              <LinearGradient
                colors={["transparent", "rgba(13,6,24,0.95)"]}
                style={s.profileGrad}
              />
              <View style={s.profileInfo}>
                <View style={s.nameRow}>
                  <Text style={s.profileName}>
                    {profile.name}, {profile.age}
                  </Text>
                  <View style={s.ratingPill}>
                    <Star size={11} color="#ffd700" fill="#ffd700" />
                    <Text style={s.ratingTxt}>{profile.rating}</Text>
                  </View>
                </View>
                <View style={s.distRow}>
                  <View style={s.distDot} />
                  <Text style={s.distTxt}>{profile.distance} away</Text>
                </View>
                <Text style={s.profileBio}>{profile.bio}</Text>
                <View style={s.profileTagsRow}>
                  {profile.tags.map(t => (
                    <View key={t} style={s.profileTag}>
                      <Text style={s.profileTagTxt}>
                        {TAGS.find(x => x.k === t)?.label ?? t}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Animated.View>
          </Animated.View>

          {/* Actions */}
          <View style={s.actionRow}>
            <TouchableOpacity style={s.roundBtn} onPress={handleSkip} activeOpacity={0.8}>
              <X size={24} color="#ff3f72" />
            </TouchableOpacity>

            <TouchableOpacity style={s.chatBtn} activeOpacity={0.85}>
              <LinearGradient
                colors={["#ff3f72", "#a647ea"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.chatBtnGrad}
              >
                <MessageCircle size={20} color="white" />
                <Text style={s.chatBtnTxt}>Start Chat</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={s.roundBtn} activeOpacity={0.8}>
              <Heart size={24} color="#ff3f72" fill="#ff3f72" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.tryAgainBtn} onPress={handleSkip} activeOpacity={0.8}>
            <Text style={s.tryAgainTxt}>Try another match →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#0d0618" },
  scroll: { paddingBottom: 36, paddingTop: 52 },
  matchScroll: { paddingBottom: 36, paddingTop: 52, alignItems: "center" },

  orb1: {
    position: "absolute", width: 340, height: 340,
    top: -110, right: -90, borderRadius: 170,
    backgroundColor: "rgba(255,63,114,0.13)",
  },
  orb2: {
    position: "absolute", width: 300, height: 300,
    bottom: 80, left: -110, borderRadius: 150,
    backgroundColor: "rgba(166,71,234,0.16)",
  },

  // ── HEADER ──
  hdr: { alignItems: "center", paddingTop: 10, paddingBottom: 6 },
  onlinePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4eff91" },
  onlineTxt: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "600" },
  title: { fontSize: 38, fontWeight: "900", letterSpacing: 4 },
  sub: { color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 6, letterSpacing: 0.3 },

  // ── CARD AREA ──
  cardArea: { alignItems: "center", justifyContent: "center", height: 260, marginVertical: 4 },
  ring: {
    position: "absolute", width: 185, height: 185, borderRadius: 93,
    borderWidth: 1.5, borderColor: "rgba(255,63,114,0.55)",
  },
  mysteryCard: {
    width: 155, height: 205, borderRadius: 24, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: "rgba(255,63,114,0.3)",
  },
  mysteryBorder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 22, borderWidth: 1, borderColor: "rgba(166,71,234,0.35)",
  },
  qMark: {
    fontSize: 68, fontWeight: "900", color: "#ff3f72",
    textShadowColor: "rgba(255,63,114,0.9)",
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 22,
  },
  qSub: { color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 },

  // ── TAGS ──
  tagsLabel: {
    color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
    paddingHorizontal: 18, marginTop: 2, marginBottom: 10,
  },
  tagsRow: { paddingHorizontal: 18, gap: 8, paddingBottom: 2 },
  tagActive: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  tagActiveTxt: { color: "white", fontSize: 13, fontWeight: "700" },
  tagInactive: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
  },
  tagInactiveTxt: { color: "rgba(255,255,255,0.55)", fontSize: 13 },

  // ── STATS ──
  statsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginTop: 18, marginBottom: 18,
  },
  stat: { alignItems: "center", paddingHorizontal: 22 },
  statVal: { color: "#ff3f72", fontSize: 20, fontWeight: "900" },
  statLbl: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },
  statDiv: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.1)" },

  // ── BUTTON ──
  btnWrap: { marginHorizontal: 18 },
  findBtn: {
    borderRadius: 30, height: 60,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    shadowColor: "#ff3f72", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55, shadowRadius: 18, elevation: 14,
  },
  findBtnTxt: { color: "white", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },

  // ── SEARCHING ──
  searchWrap: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingTop: 40, paddingBottom: 40,
  },
  radarContainer: {
    width: 260, height: 260,
    alignItems: "center", justifyContent: "center",
    marginBottom: 36,
  },
  radarRing: {
    position: "absolute",
    borderWidth: 1, borderColor: "rgba(255,63,114,0.5)",
  },
  radarArmContainer: {
    position: "absolute", width: 260, height: 260,
  },
  radarArm: {
    position: "absolute",
    left: 130, top: 127,
    width: 130, height: 6, borderRadius: 3,
  },
  radarTrail: {
    position: "absolute",
    left: 130, top: 115,
    width: 130, height: 30, borderRadius: 6,
  },
  radarCenter: { width: 16, height: 16, borderRadius: 8, position: "absolute" },

  particleArea: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    height: 260, width: "100%",
  },
  particle: { position: "absolute", bottom: 0, fontSize: 22 },

  searchingTxt: {
    color: "white", fontSize: 24, fontWeight: "800",
    letterSpacing: 0.5, marginBottom: 8,
  },
  searchingSub: {
    color: "rgba(255,255,255,0.45)", fontSize: 13,
    textAlign: "center", paddingHorizontal: 44, marginBottom: 10,
  },
  searchTimer: { color: "#ff3f72", fontSize: 15, fontWeight: "700", marginBottom: 32 },
  cancelBtn: {
    borderRadius: 24, borderWidth: 1.5, borderColor: "rgba(255,63,114,0.5)",
    paddingHorizontal: 32, paddingVertical: 13,
  },
  cancelTxt: { color: "#ff3f72", fontSize: 15, fontWeight: "600" },

  // ── MATCHED ──
  matchTxt: { fontSize: 30, fontWeight: "900", letterSpacing: 0.5 },
  matchSub: { color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 6, marginBottom: 22 },

  flipWrap: { width: CARD_W, height: CARD_H, marginBottom: 26 },
  cardFace: {
    position: "absolute", width: CARD_W, height: CARD_H,
    borderRadius: 22, overflow: "hidden",
    backfaceVisibility: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  qMarkSm: {
    fontSize: 64, fontWeight: "900", color: "#ff3f72",
    textShadowColor: "rgba(255,63,114,0.9)",
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18,
  },
  profileImg: { position: "absolute", width: "100%", height: "100%", resizeMode: "cover" },
  profileGrad: { position: "absolute", bottom: 0, left: 0, right: 0, height: "65%" },
  profileInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 18 },

  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  profileName: { color: "white", fontSize: 22, fontWeight: "800", flex: 1 },
  ratingPill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  ratingTxt: { color: "#ffd700", fontSize: 12, fontWeight: "700" },
  distRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 8 },
  distDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4eff91" },
  distTxt: { color: "rgba(255,255,255,0.65)", fontSize: 12 },
  profileBio: { color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 19, marginBottom: 10 },
  profileTagsRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  profileTag: {
    backgroundColor: "rgba(255,63,114,0.22)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,63,114,0.4)",
  },
  profileTagTxt: { color: "#ff8eb4", fontSize: 11, fontWeight: "600" },

  // ── ACTION BUTTONS ──
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  roundBtn: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: "rgba(255,63,114,0.1)",
    borderWidth: 1.5, borderColor: "rgba(255,63,114,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  chatBtn: { flex: 1, height: 54, borderRadius: 27, overflow: "hidden" },
  chatBtnGrad: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  chatBtnTxt: { color: "white", fontSize: 16, fontWeight: "800" },

  tryAgainBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  tryAgainTxt: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "500" },
});
