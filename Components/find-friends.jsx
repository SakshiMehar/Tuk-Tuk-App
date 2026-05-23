import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ArrowLeft, X, Heart, Star } from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");

// ── Step data ──────────────────────────────────────────────
const TOTAL_STEPS = 8;

const INTERESTS = [
  "Art","BGMI","Bars","Bollywood","Coffee","Comedy","Cooking","Cricket",
  "Dancing","Devotional","Foodie","Football","Freefire","Games","Going out",
  "Gym","History","K-pop","Ludo","Make-up","Making video","Movies","Music",
  "News","Pets","Photography","Poetry","Reading","Romance","Running",
  "Science","Short Videos","Singing","Sweet tooth","Swimming","TV shows",
  "Tea","Tennis","Traveling","Webseries","Writing",
];

const MUSIC = [
  "Disco","Dubstep","House","Drum 'n' Bass","Blues","Alternative","Hip-Hop",
  "Alternative Rock","Country","Deep House","Bossa Nova","Hardcore","Classical",
  "Funk","Electronic","EDM","Indie Rock","Folk","Jazz","K-pop","Latin","Metal",
  "Minimal","Nature","Opera","Pop","Punk","Rap","Rock","Techno","Trance",
];

const BOOKS = [
  "Religion","Sci-fi","Tragedy","Romance","Classics","Adventure","Illusions",
  "Biography","Horror","Poetry","Crime fiction","IT","Fiction","Comics",
  "Fashion magazines","Historical","Fantasy","Manga",
];

const FOOD = [
  "Fried rice","Noodles","Chocolate","Momo","Potato chips","Salad","Fish Fry",
  "Vegetarian","Ice cream","Chicken tikka","Pizza","Burgers","Shawarma","Kebab",
  "Cake","Seafood","Pasta","Fried chicken","Tripple rice","Masala chai",
  "Pani puri","Aloo tikki","Vada pav","Dosa","Rajma chawal","Manchurian",
  "Samosa","Kachori","Chicken 65","Pakoda",
];

const LANGUAGES = [
  "Assamese","Bengali","Bodo","Dogri","English","Gujarati","Hindi","Kannada",
  "Kashmiri","Konkani","Maithili","Malayalam","Manipuri","Marathi","Nepali",
  "Odia","Punjabi","Sanskrit","Santali","Sindhi","Tamil","Telugu","Urdu",
];

const EDUCATION = [
  "High School","College / Diploma","Degree / Graduation","Post Graduation","Ph.d",
];

const OCCUPATION = [
  "Government/Public Sector","Business/Self Employed","Administration","Advertising",
  "Media & Entertainment","Agricultural","Airline & Aviation","Architecture",
  "Automobile","Banking & Finance","Beauty & Wellness","Construction",
  "Defence & Police","Education","Engineering","Fashion & Design",
  "Healthcare","Hospitality","IT & Software","Legal","Manufacturing",
  "Marketing","NGO / Social Work","Real Estate","Retail","Science & Research",
  "Sports","Telecom","Transport & Logistics",
];

// ── Helpers ────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.progressSegment,
            i < step ? styles.progressSegmentActive : styles.progressSegmentInactive,
          ]}
        />
      ))}
    </View>
  );
}

function TagGrid({ items, selected, onToggle }) {
  return (
    <View style={styles.tagGrid}>
      {items.map((item) => {
        const active = selected.includes(item);
        return (
          <TouchableOpacity
            key={item}
            style={[styles.tag, active && styles.tagActive]}
            onPress={() => onToggle(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tagText, active && styles.tagTextActive]}>{item}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ListSelect({ items, selected, onSelect }) {
  return (
    <View style={styles.listCol}>
      {items.map((item) => {
        const active = selected === item;
        return (
          <TouchableOpacity
            key={item}
            style={[styles.listItem, active && styles.listItemActive]}
            onPress={() => onSelect(item)}
            activeOpacity={0.8}
          >
            <Text style={[styles.listItemText, active && styles.listItemTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Main component ─────────────────────────────────────────
export default function FindFriends() {
  const router = useRouter();
  const [step, setStep] = useState(1);          // 1-8 = wizard, 9 = match screen
  const [interests, setInterests]   = useState([]);
  const [music, setMusic]           = useState([]);
  const [books, setBooks]           = useState([]);
  const [food, setFood]             = useState([]);
  const [language, setLanguage]     = useState("");
  const [education, setEducation]   = useState("");
  const [occupation, setOccupation] = useState("");
  const [bio, setBio]               = useState("");

  const toggle = (setter, arr, val) =>
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  const next = () => setStep((s) => s + 1);
  const skip = () => setStep((s) => s + 1);
  const back = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  const save = () => next();

  // ── Shared header ──
  const Header = ({ title, showBack = false }) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeBtn} onPress={back} activeOpacity={0.8}>
        {showBack
          ? <ArrowLeft size={20} color="white" />
          : <X size={20} color="white" />}
      </TouchableOpacity>
      {title ? <Text style={styles.headerTitle}>{title}</Text> : <View />}
      <TouchableOpacity onPress={skip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Save button ──
  const SaveBtn = ({ label = "Save", onPress }) => (
    <View style={styles.saveWrap}>
      <TouchableOpacity style={styles.saveBtn} onPress={onPress ?? save} activeOpacity={0.85}>
        <LinearGradient
          colors={["#7c4dff", "#a855f7"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveBtnGradient}
        >
          <Text style={styles.saveBtnText}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ── STEP SCREENS ──────────────────────────────────────────

  // Step 1 — My Interests
  if (step === 1) return (
    <View style={styles.container}>
      <BG />
      <Header />
      <ProgressBar step={1} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>My Interests</Text>
        <Text style={styles.stepSub}>It's the perfect opportunity to show a little more about yourself.</Text>
        <TagGrid items={INTERESTS} selected={interests} onToggle={(v) => toggle(setInterests, interests, v)} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 2 — Music
  if (step === 2) return (
    <View style={styles.container}>
      <BG />
      <Header />
      <ProgressBar step={2} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>What music do you like?</Text>
        <TagGrid items={MUSIC} selected={music} onToggle={(v) => toggle(setMusic, music, v)} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 3 — Books
  if (step === 3) return (
    <View style={styles.container}>
      <BG />
      <Header />
      <ProgressBar step={3} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>What books do you prefer?</Text>
        <TagGrid items={BOOKS} selected={books} onToggle={(v) => toggle(setBooks, books, v)} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 4 — Food
  if (step === 4) return (
    <View style={styles.container}>
      <BG />
      <Header />
      <ProgressBar step={4} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>What's your favorite food?</Text>
        <TagGrid items={FOOD} selected={food} onToggle={(v) => toggle(setFood, food, v)} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 5 — Spoken Language
  if (step === 5) return (
    <View style={styles.container}>
      <BG />
      <Header title="Spoken Language" showBack />
      <ProgressBar step={5} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <ListSelect items={LANGUAGES} selected={language} onSelect={setLanguage} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 6 — About me / Bio
  if (step === 6) return (
    <View style={styles.container}>
      <BG />
      <Header title="About me" />
      <ProgressBar step={6} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <View style={styles.bioIllustration}>
          <Text style={styles.bioIllustrationEmoji}>🧑‍💻</Text>
        </View>
        <Text style={styles.stepTitle}>Write a bio to{"\n"}introduce yourself</Text>
        <View style={styles.bioBox}>
          <TextInput
            style={styles.bioInput}
            placeholder="Don't be shy!"
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            maxLength={100}
            value={bio}
            onChangeText={setBio}
          />
          <Text style={styles.bioCount}>{bio.length}/100</Text>
        </View>
      </ScrollView>
      <SaveBtn label="Ok" />
    </View>
  );

  // Step 7 — Education
  if (step === 7) return (
    <View style={styles.container}>
      <BG />
      <Header title="Education" showBack />
      <ProgressBar step={7} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <ListSelect items={EDUCATION} selected={education} onSelect={setEducation} />
      </ScrollView>
      <SaveBtn />
    </View>
  );

  // Step 8 — Occupation
  if (step === 8) return (
    <View style={styles.container}>
      <BG />
      <Header title="Occupation" showBack />
      <ProgressBar step={8} total={TOTAL_STEPS} />
      <ScrollView contentContainerStyle={styles.scrollPad} showsVerticalScrollIndicator={false}>
        <ListSelect items={OCCUPATION} selected={occupation} onSelect={setOccupation} />
      </ScrollView>
      <SaveBtn onPress={() => {
        Alert.alert("Profile saved!", "Now let's find you some friends 🎉", [
          { text: "Let's go!", onPress: () => setStep(9) },
        ]);
      }} />
    </View>
  );

  // Step 9 — Match screen
  return (
    <View style={styles.container}>
      <BG />
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <ArrowLeft size={20} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Friends</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={[styles.scrollPad, { alignItems: "center" }]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepTitle, { alignSelf: "flex-start" }]}>People you may like</Text>
        <View style={styles.matchCard}>
          <Image
            source={{ uri: "https://randomuser.me/api/portraits/women/44.jpg" }}
            style={styles.matchImg}
            resizeMode="cover"
          />
          <LinearGradient
            colors={["transparent", "rgba(13,6,24,0.95)"]}
            style={styles.matchOverlay}
          />
          <View style={styles.matchInfo}>
            <Text style={styles.matchName}>Priya, 21</Text>
            <Text style={styles.matchBio}>Love music and long walks 🎵</Text>
            <View style={styles.matchTags}>
              {["Music 🎵", "Travel ✈️", "Movies 🎬"].map((t) => (
                <View key={t} style={styles.matchTag}>
                  <Text style={styles.matchTagText}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.actionSkip]} activeOpacity={0.8}>
            <X size={28} color="#ff6b6b" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionStar]} activeOpacity={0.8}>
            <Star size={22} color="#ffd700" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.actionLike]} activeOpacity={0.8}>
            <Heart size={28} color="white" fill="white" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Background component ───────────────────────────────────
function BG() {
  return (
    <>
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />
    </>
  );
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0618" },

  orbPink: {
    position: "absolute", width: 260, height: 260, top: -60, left: -60,
    borderRadius: 130, backgroundColor: "rgba(255,0,128,0.13)",
  },
  orbPurple: {
    position: "absolute", width: 300, height: 300, bottom: -100, right: -100,
    borderRadius: 150, backgroundColor: "rgba(138,43,226,0.16)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { color: "white", fontSize: 17, fontWeight: "800" },
  skipText: { color: "#a78bfa", fontSize: 14, fontWeight: "600" },

  // Progress bar
  progressRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 5,
    marginBottom: 20,
  },
  progressSegment: {
    flex: 1, height: 4, borderRadius: 2,
  },
  progressSegmentActive: { backgroundColor: "#7c4dff" },
  progressSegmentInactive: { backgroundColor: "rgba(255,255,255,0.12)" },

  // Scroll
  scrollPad: { paddingHorizontal: 16, paddingBottom: 120 },

  // Step text
  stepTitle: {
    color: "white", fontSize: 22, fontWeight: "800",
    marginBottom: 6, lineHeight: 30,
  },
  stepSub: {
    color: "rgba(255,255,255,0.45)", fontSize: 13,
    marginBottom: 20, lineHeight: 18,
  },

  // Tag grid
  tagGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8,
  },
  tag: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
  },
  tagActive: {
    backgroundColor: "rgba(124,77,255,0.45)",
    borderColor: "#a78bfa",
  },
  tagText: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500" },
  tagTextActive: { color: "white", fontWeight: "700" },

  // List select (languages, education, occupation)
  listCol: { gap: 10, marginTop: 4 },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.15)",
    alignItems: "center",
  },
  listItemActive: {
    backgroundColor: "rgba(124,77,255,0.4)",
    borderColor: "#a78bfa",
  },
  listItemText: { color: "rgba(255,255,255,0.55)", fontSize: 15, fontWeight: "500" },
  listItemTextActive: { color: "white", fontWeight: "700" },

  // Bio
  bioIllustration: {
    alignItems: "center", justifyContent: "center",
    height: 160, marginBottom: 16,
  },
  bioIllustrationEmoji: { fontSize: 90 },
  bioBox: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
    padding: 14, marginTop: 16, minHeight: 120,
  },
  bioInput: {
    color: "white", fontSize: 14, lineHeight: 22,
    minHeight: 80, textAlignVertical: "top",
  },
  bioCount: {
    color: "rgba(255,255,255,0.3)", fontSize: 11,
    textAlign: "right", marginTop: 6,
  },

  // Save button
  saveWrap: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingBottom: 28, paddingTop: 12,
    backgroundColor: "rgba(13,6,24,0.85)",
    borderTopWidth: 1, borderTopColor: "rgba(167,139,250,0.1)",
  },
  saveBtn: {
    borderRadius: 28, overflow: "hidden",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  saveBtnGradient: {
    paddingVertical: 16, alignItems: "center",
  },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "800" },

  // Match screen
  matchCard: {
    width: W - 32, height: H * 0.52,
    borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
    marginBottom: 28,
  },
  matchImg: { width: "100%", height: "100%" },
  matchOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: "55%",
  },
  matchInfo: {
    position: "absolute", bottom: 20, left: 20, right: 20, gap: 6,
  },
  matchName: { color: "white", fontSize: 24, fontWeight: "800" },
  matchBio: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  matchTags: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  matchTag: {
    backgroundColor: "rgba(124,77,255,0.5)",
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.4)",
  },
  matchTagText: { color: "white", fontSize: 12, fontWeight: "600" },

  actionRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  actionBtn: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  actionSkip: {
    backgroundColor: "rgba(255,107,107,0.15)",
    borderColor: "rgba(255,107,107,0.4)", shadowColor: "#ff6b6b",
  },
  actionStar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "rgba(255,215,0,0.15)",
    borderColor: "rgba(255,215,0,0.4)", shadowColor: "#ffd700",
  },
  actionLike: {
    backgroundColor: "#7c4dff",
    borderColor: "rgba(167,139,250,0.5)", shadowColor: "#7c3aed",
  },
});
