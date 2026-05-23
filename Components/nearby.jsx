import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Dimensions, FlatList, Animated, Modal,
  ScrollView, TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowLeft, MapPin, Heart, X, Star,
  MessageCircle, MoreVertical, ChevronRight, Search,
} from "lucide-react-native";

const { width: W, height: H } = Dimensions.get("window");
const CARD_W = (W - 14 * 2 - 10) / 2;

// ── Locations ────────────────────────────────────────────────
const LOCATIONS = [
  { country: "India", flag: "🇮🇳", cities: ["Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Kolkata","Pune","Ahmedabad","Jaipur","Surat","Lucknow","Kanpur","Nagpur","Indore","Bhopal","Patna","Vadodara","Ludhiana","Agra","Nashik","Faridabad","Meerut","Rajkot","Varanasi","Srinagar","Aurangabad","Amritsar","Allahabad","Ranchi","Coimbatore","Visakhapatnam","Guwahati","Chandigarh","Mysore","Jodhpur","Madurai","Raipur","Kochi","Gwalior"] },
  { country: "United States", flag: "🇺🇸", cities: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Nashville","Oklahoma City","El Paso","Washington DC","Las Vegas","Louisville","Memphis","Portland","Baltimore","Milwaukee","Albuquerque"] },
  { country: "United Kingdom", flag: "🇬🇧", cities: ["London","Birmingham","Manchester","Leeds","Glasgow","Liverpool","Bristol","Sheffield","Edinburgh","Leicester","Coventry","Bradford","Cardiff","Belfast","Nottingham","Newcastle","Southampton","Derby","Portsmouth","Brighton","Plymouth","Norwich"] },
  { country: "Pakistan", flag: "🇵🇰", cities: ["Karachi","Lahore","Faisalabad","Rawalpindi","Gujranwala","Peshawar","Multan","Hyderabad","Islamabad","Quetta","Bahawalpur","Sargodha","Sialkot","Sukkur","Larkana","Sheikhupura","Jhang","Gujrat"] },
  { country: "Bangladesh", flag: "🇧🇩", cities: ["Dhaka","Chittagong","Sylhet","Rajshahi","Khulna","Barisal","Comilla","Narayanganj","Gazipur","Mymensingh","Rangpur","Jessore","Bogra","Dinajpur","Tangail","Jamalpur","Pabna","Narsingdi"] },
  { country: "UAE", flag: "🇦🇪", cities: ["Dubai","Abu Dhabi","Sharjah","Al Ain","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"] },
  { country: "Saudi Arabia", flag: "🇸🇦", cities: ["Riyadh","Jeddah","Mecca","Medina","Dammam","Khobar","Tabuk","Buraidah","Khamis Mushait","Abha","Hail","Najran","Jizan","Yanbu","Al Jubail"] },
  { country: "Canada", flag: "🇨🇦", cities: ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Winnipeg","Quebec City","Hamilton","Kitchener","London","Victoria","Halifax","Oshawa","Windsor","Saskatoon","Regina","Sherbrooke","Barrie","Kelowna"] },
  { country: "Australia", flag: "🇦🇺", cities: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Newcastle","Canberra","Wollongong","Hobart","Geelong","Townsville","Cairns","Darwin","Toowoomba","Ballarat","Bendigo","Launceston","Mackay"] },
  { country: "Germany", flag: "🇩🇪", cities: ["Berlin","Hamburg","Munich","Cologne","Frankfurt","Stuttgart","Leipzig","Dortmund","Essen","Bremen","Dresden","Hanover","Nuremberg","Duisburg","Bochum","Wuppertal","Bielefeld","Bonn","Münster"] },
  { country: "France", flag: "🇫🇷", cities: ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Reims","Le Havre","Toulon","Grenoble","Dijon","Angers","Nîmes"] },
  { country: "China", flag: "🇨🇳", cities: ["Shanghai","Beijing","Guangzhou","Shenzhen","Chengdu","Tianjin","Wuhan","Hangzhou","Nanjing","Chongqing","Suzhou","Dongguan","Foshan","Shenyang","Harbin","Qingdao","Jinan","Zhengzhou","Changsha"] },
  { country: "Japan", flag: "🇯🇵", cities: ["Tokyo","Osaka","Nagoya","Sapporo","Fukuoka","Kobe","Kyoto","Kawasaki","Saitama","Hiroshima","Sendai","Chiba","Niigata","Hamamatsu","Kumamoto","Okayama","Shizuoka"] },
  { country: "Brazil", flag: "🇧🇷", cities: ["São Paulo","Rio de Janeiro","Brasília","Salvador","Fortaleza","Belo Horizonte","Manaus","Curitiba","Recife","Porto Alegre","Belém","Goiânia","Guarulhos","Campinas","São Luís","Maceió","Natal","Teresina"] },
  { country: "Nigeria", flag: "🇳🇬", cities: ["Lagos","Kano","Ibadan","Abuja","Port Harcourt","Benin City","Maiduguri","Zaria","Aba","Jos","Ilorin","Oyo","Enugu","Abeokuta","Onitsha","Warri","Sokoto","Kaduna"] },
  { country: "Indonesia", flag: "🇮🇩", cities: ["Jakarta","Surabaya","Bandung","Medan","Bekasi","Tangerang","Depok","Semarang","Palembang","Makassar","Batam","Bogor","Pekanbaru","Malang","Padang","Denpasar","Samarinda"] },
  { country: "Russia", flag: "🇷🇺", cities: ["Moscow","Saint Petersburg","Novosibirsk","Yekaterinburg","Kazan","Nizhny Novgorod","Chelyabinsk","Samara","Omsk","Rostov-on-Don","Ufa","Krasnoyarsk","Voronezh","Perm","Volgograd","Krasnodar","Saratov","Tyumen"] },
  { country: "Turkey", flag: "🇹🇷", cities: ["Istanbul","Ankara","Izmir","Bursa","Adana","Gaziantep","Konya","Antalya","Kayseri","Mersin","Samsun","Denizli","Malatya","Erzurum","Van"] },
  { country: "South Korea", flag: "🇰🇷", cities: ["Seoul","Busan","Incheon","Daegu","Daejeon","Gwangju","Suwon","Ulsan","Changwon","Seongnam","Goyang","Yongin","Bucheon","Cheongju","Ansan","Jeonju"] },
  { country: "Philippines", flag: "🇵🇭", cities: ["Manila","Quezon City","Davao","Caloocan","Zamboanga","Cebu City","Antipolo","Pasig","Taguig","Valenzuela","Cagayan de Oro","Makati","Bacoor","General Santos","Muntinlupa","Marikina","Bacolod"] },
];

// ── Users ────────────────────────────────────────────────────
const NEARBY_USERS = [
  { id: "1", name: "Priya",  age: 22, distance: "0.3 km", emoji: "🧝‍♀️", bgColors: ["#3b1f6e","#7c4dff"], bio: "Music lover 🎵 | Coffee addict ☕ | Traveller ✈️", tags: ["Music","Travel","Coffee"], online: true,  verified: true  },
  { id: "2", name: "Aisha",  age: 24, distance: "0.7 km", emoji: "🧜‍♀️", bgColors: ["#1a3a5c","#0077b6"], bio: "Artist 🎨 | Foodie 🍕 | Dog mom 🐶",              tags: ["Art","Food","Pets"],    online: true,  verified: false },
  { id: "3", name: "Neha",   age: 21, distance: "1.2 km", emoji: "🧚‍♀️", bgColors: ["#4a1942","#c2185b"], bio: "Dancer 💃 | Bookworm 📚 | Dreamer 🌙",           tags: ["Dance","Books","Movies"],online: false, verified: true  },
  { id: "4", name: "Zara",   age: 23, distance: "1.8 km", emoji: "�‍♀️", bgColors: ["#1b3a2d","#2e7d32"], bio: "Fitness freak 💪 | Chef 👩‍🍳 | Gamer 🎮",        tags: ["Fitness","Cooking","Gaming"], online: true, verified: true },
  { id: "5", name: "Riya",   age: 25, distance: "2.1 km", emoji: "🧙‍♀️", bgColors: ["#1a2a4a","#1565c0"], bio: "Photographer 📷 | Nature lover 🌿 | Yoga 🧘",    tags: ["Photography","Nature","Yoga"], online: false, verified: false },
  { id: "6", name: "Meera",  age: 20, distance: "2.5 km", emoji: "🧞‍♀️", bgColors: ["#3e1f00","#e65100"], bio: "Singer 🎤 | Poet ✍️ | Tea person 🍵",            tags: ["Singing","Poetry","Tea"], online: true, verified: true },
];

// ── Glitter ──────────────────────────────────────────────────
function Glitter({ count = 20 }) {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H * 0.75,
      size: 5 + Math.random() * 7,
      anim: new Animated.Value(0),
      delay: Math.random() * 700,
      color: ["#ffd700","#ff69b4","#a78bfa","#00ffff","#ffffff"][Math.floor(Math.random() * 5)],
    }))
  ).current;

  useEffect(() => {
    const anims = particles.map((p) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(p.anim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(p.anim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      )
    );
    Animated.parallel(anims).start();
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: p.x, top: p.y,
          width: p.size, height: p.size, borderRadius: p.size / 2,
          backgroundColor: p.color, opacity: p.anim,
          transform: [
            { scale: p.anim.interpolate({ inputRange: [0,1], outputRange: [0.2,1.5] }) },
            { rotate: p.anim.interpolate({ inputRange: [0,1], outputRange: ["0deg","180deg"] }) },
          ],
          shadowColor: p.color, shadowOffset: { width:0, height:0 },
          shadowOpacity: 1, shadowRadius: 6, elevation: 8,
        }} />
      ))}
    </View>
  );
}

// ── Match overlay ────────────────────────────────────────────
function MatchOverlay({ user, onClose, onMessage }) {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.matchOverlayWrap, { opacity }]}>
      <Glitter count={26} />
      <LinearGradient colors={["rgba(26,10,46,0.97)","rgba(13,6,24,0.97)"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.matchCard, { transform: [{ scale }] }]}>
        <LinearGradient colors={["#7c4dff","#ff4ea3","#ffd700"]} start={{ x:0,y:0 }} end={{ x:1,y:1 }} style={styles.matchGlowRing} />
        <View style={[styles.matchAvatarBox, { backgroundColor: user.bgColors[0] }]}>
          <Text style={styles.matchAvatarEmoji}>{user.emoji}</Text>
        </View>
        <View style={styles.matchHeartBadge}>
          <Heart size={16} color="white" fill="white" />
        </View>
        <Text style={styles.matchTitle}>It's a Match! 🎉</Text>
        <Text style={styles.matchName}>{user.name}</Text>
        <Text style={styles.matchSub}>You and {user.name} liked each other</Text>
        <View style={styles.matchBtnRow}>
          <TouchableOpacity style={styles.matchMsgBtn} onPress={onMessage} activeOpacity={0.85}>
            <LinearGradient colors={["#7c4dff","#a855f7"]} start={{ x:0,y:0 }} end={{ x:1,y:0 }} style={styles.matchMsgGradient}>
              <MessageCircle size={18} color="white" />
              <Text style={styles.matchMsgText}>Send Message</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.matchKeepBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.matchKeepText}>Keep Swiping</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ── Profile modal ────────────────────────────────────────────
function ProfileModal({ user, onClose, onLike, onPass }) {
  if (!user) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.profileModalWrap}>
        <TouchableOpacity style={styles.profileModalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.profileModalSheet}>
          <LinearGradient colors={user.bgColors} style={styles.profileModalHero}>
            <Text style={styles.profileModalEmoji}>{user.emoji}</Text>
            <View style={styles.profileModalSparkleRing} />
          </LinearGradient>
          <LinearGradient colors={["transparent","rgba(13,6,24,0.98)"]} style={styles.profileModalFade} />
          <TouchableOpacity style={styles.profileModalClose} onPress={onClose}>
            <X size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.profileModalInfo}>
            <View style={styles.profileModalNameRow}>
              <Text style={styles.profileModalName}>{user.name}, {user.age}</Text>
              {user.verified && <Text style={{ fontSize: 14 }}>✅</Text>}
              {user.online && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.distanceRow}>
              <MapPin size={13} color="#a78bfa" />
              <Text style={styles.distanceText}>{user.distance} away</Text>
            </View>
            <Text style={styles.profileModalBio}>{user.bio}</Text>
            <View style={styles.tagsRow}>
              {user.tags.map((t) => (
                <View key={t} style={styles.tag}>
                  <Text style={styles.tagText}>{t}</Text>
                </View>
              ))}
            </View>
            <View style={styles.profileActionRow}>
              <TouchableOpacity style={[styles.profileActionBtn, styles.passBtn]} onPress={onPass} activeOpacity={0.8}>
                <X size={26} color="#ff6b6b" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.profileActionBtn, styles.superBtn]} activeOpacity={0.8}>
                <Star size={20} color="#ffd700" fill="#ffd700" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.profileActionBtn, styles.likeBtn]} onPress={onLike} activeOpacity={0.8}>
                <Heart size={26} color="white" fill="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Filter modal ─────────────────────────────────────────────
function FilterModal({ visible, onClose, onDone, gender, setGender, location, setLocation }) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showCityPicker,    setShowCityPicker]    = useState(false);
  const [countrySearch,     setCountrySearch]     = useState("");
  const [citySearch,        setCitySearch]        = useState("");

  const selectedData = LOCATIONS.find((l) => l.country === location.country);

  const filteredCountries = countrySearch.trim()
    ? LOCATIONS.filter((l) => l.country.toLowerCase().includes(countrySearch.toLowerCase()))
    : LOCATIONS;

  const filteredCities = citySearch.trim() && selectedData
    ? selectedData.cities.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase()))
    : (selectedData?.cities ?? []);

  const GENDERS = [
    { key: "All",    label: "All",    icon: "♾️", activeColor: "#7c4dff" },
    { key: "Female", label: "Female", icon: "♀️", activeColor: "#ff4ea3" },
    { key: "Male",   label: "Male",   icon: "♂️", activeColor: "#0077b6" },
  ];

  const locationLabel = location.country && location.city
    ? `${LOCATIONS.find((l) => l.country === location.country)?.flag ?? ""} ${location.country} — ${location.city}`
    : location.country
      ? `${LOCATIONS.find((l) => l.country === location.country)?.flag ?? ""} ${location.country}`
      : "Select country & city";

  return (
    <>
      {/* ── Main filter sheet ── */}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={fStyles.wrap}>
          <TouchableOpacity style={fStyles.backdrop} activeOpacity={1} onPress={onClose} />
          <View style={fStyles.sheet}>
            <View style={fStyles.handle} />
            <View style={fStyles.header}>
              <TouchableOpacity onPress={onClose} style={fStyles.closeBtn}>
                <X size={18} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
              <Text style={fStyles.title}>Filter</Text>
              <TouchableOpacity onPress={onDone}>
                <Text style={fStyles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 4 }}>
              {/* Gender */}
              <Text style={fStyles.sectionTitle}>Select your favorite</Text>
              <View style={fStyles.genderRow}>
                {GENDERS.map((g) => {
                  const active = gender === g.key;
                  return (
                    <TouchableOpacity
                      key={g.key}
                      style={[fStyles.genderBtn, active && { backgroundColor: g.activeColor, borderColor: g.activeColor }]}
                      onPress={() => setGender(g.key)}
                      activeOpacity={0.85}
                    >
                      <Text style={fStyles.genderIcon}>{g.icon}</Text>
                      <Text style={[fStyles.genderLabel, active && fStyles.genderLabelActive]}>{g.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Location */}
              <Text style={fStyles.sectionTitle}>Select your city</Text>
              <TouchableOpacity
                style={fStyles.locationBtn}
                onPress={() => setShowCountryPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={fStyles.locationBtnText}>{locationLabel}</Text>
                <ChevronRight size={16} color="#a78bfa" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── Country picker ── */}
      <Modal visible={showCountryPicker} transparent animationType="slide" onRequestClose={() => { setShowCountryPicker(false); setCountrySearch(""); }}>
        <View style={fStyles.pickerWrap}>
          <TouchableOpacity style={fStyles.backdrop} activeOpacity={1} onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }} />
          <View style={fStyles.pickerSheet}>
            <View style={fStyles.handle} />
            <View style={fStyles.header}>
              <TouchableOpacity onPress={() => { setShowCountryPicker(false); setCountrySearch(""); }} style={fStyles.closeBtn}>
                <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={fStyles.title}>Select Country</Text>
              <View style={{ width: 30 }} />
            </View>

            {/* Search inside list */}
            <View style={fStyles.searchRow}>
              <Search size={14} color="rgba(167,139,250,0.7)" />
              <TextInput
                style={fStyles.searchInput}
                placeholder="Search country..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
              />
              {countrySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCountrySearch("")}>
                  <X size={14} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.country}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = location.country === item.country;
                return (
                  <TouchableOpacity
                    style={[fStyles.countryRow, isSelected && fStyles.countryRowActive]}
                    onPress={() => {
                      setLocation({ country: item.country, city: "" });
                      setCountrySearch("");
                      setShowCountryPicker(false);
                      setShowCityPicker(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={fStyles.countryFlag}>{item.flag}</Text>
                    <Text style={[fStyles.countryName, isSelected && fStyles.countryNameActive]}>{item.country}</Text>
                    <Text style={fStyles.countryCount}>{item.cities.length} cities</Text>
                    <ChevronRight size={14} color={isSelected ? "#a78bfa" : "rgba(255,255,255,0.25)"} />
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── City picker ── */}
      <Modal visible={showCityPicker} transparent animationType="slide" onRequestClose={() => { setShowCityPicker(false); setCitySearch(""); }}>
        <View style={fStyles.pickerWrap}>
          <TouchableOpacity style={fStyles.backdrop} activeOpacity={1} onPress={() => { setShowCityPicker(false); setCitySearch(""); }} />
          <View style={fStyles.pickerSheet}>
            <View style={fStyles.handle} />
            <View style={fStyles.header}>
              <TouchableOpacity
                onPress={() => { setShowCityPicker(false); setCitySearch(""); setShowCountryPicker(true); }}
                style={fStyles.closeBtn}
              >
                <ArrowLeft size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
              <Text style={fStyles.title}>
                {LOCATIONS.find((l) => l.country === location.country)?.flag ?? ""} {location.country}
              </Text>
              <View style={{ width: 30 }} />
            </View>

            {/* Search inside list */}
            <View style={fStyles.searchRow}>
              <Search size={14} color="rgba(167,139,250,0.7)" />
              <TextInput
                style={fStyles.searchInput}
                placeholder="Search city..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
              />
              {citySearch.length > 0 && (
                <TouchableOpacity onPress={() => setCitySearch("")}>
                  <X size={14} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>

            <View style={fStyles.cityGrid}>
              {filteredCities.map((city) => {
                const isActive = location.city === city;
                return (
                  <TouchableOpacity
                    key={city}
                    style={[fStyles.cityChip, isActive && fStyles.cityChipActive]}
                    onPress={() => {
                      setLocation({ country: location.country, city });
                      setCitySearch("");
                      setShowCityPicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[fStyles.cityChipText, isActive && fStyles.cityChipTextActive]}>{city}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Main Screen ──────────────────────────────────────────────
export default function Nearby() {
  const router = useRouter();
  const [liked,       setLiked]       = useState(new Set());
  const [passed,      setPassed]      = useState(new Set());
  const [matchUser,   setMatchUser]   = useState(null);
  const [detailUser,  setDetailUser]  = useState(null);
  const [filter,      setFilter]      = useState("All");
  const [showFilter,  setShowFilter]  = useState(false);
  const [gender,      setGender]      = useState("All");
  const [location,    setLocation]    = useState({ country: "India", city: "Pune" });

  const FILTERS = ["All", "Online", "Nearby", "New"];

  const visible = NEARBY_USERS.filter((u) => {
    if (passed.has(u.id)) return false;
    if (filter === "Online") return u.online;
    if (filter === "Nearby") return parseFloat(u.distance) < 1.5;
    if (filter === "New")    return !liked.has(u.id);
    return true;
  });

  const handleLike = (user) => {
    setLiked((p) => new Set([...p, user.id]));
    setDetailUser(null);
    if (Math.random() > 0.4) setTimeout(() => setMatchUser(user), 300);
  };

  const handlePass = (user) => {
    setPassed((p) => new Set([...p, user.id]));
    setDetailUser(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={["#1a0a2e","#16082a","#0d0618","#1a0a2e"]}
        locations={[0, 0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />

      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onDone={() => setShowFilter(false)}
        gender={gender}
        setGender={setGender}
        location={location}
        setLocation={setLocation}
      />

      {matchUser && (
        <MatchOverlay
          user={matchUser}
          onClose={() => setMatchUser(null)}
          onMessage={() => { setMatchUser(null); router.push("/(tabs)/chat"); }}
        />
      )}

      <ProfileModal
        user={detailUser}
        onClose={() => setDetailUser(null)}
        onLike={() => handleLike(detailUser)}
        onPass={() => handlePass(detailUser)}
      />

      {/* Header */}
      <LinearGradient
        colors={["#1a0a2e","rgba(26,10,46,0.8)","transparent"]}
        style={styles.headerGradient}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerPin}>📍</Text>
            <Text style={styles.headerTitle}>Nearby</Text>
          </View>
          <TouchableOpacity style={styles.dotsBtn} onPress={() => setShowFilter(true)} activeOpacity={0.8}>
            <MoreVertical size={20} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* Grid */}
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>🌍</Text>
            <Text style={styles.emptyTitle}>No one nearby</Text>
            <Text style={styles.emptySub}>Try a different filter</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isLiked = liked.has(item.id);
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={() => setDetailUser(item)}>
              <LinearGradient colors={item.bgColors} style={styles.cardBg}>
                <Text style={styles.cardEmoji}>{item.emoji}</Text>
              </LinearGradient>
              <LinearGradient colors={["transparent","rgba(13,6,24,0.96)"]} style={styles.cardOverlay} />
              {item.online && <View style={styles.cardOnlineDot} />}
              {item.verified && (
                <View style={styles.cardVerified}>
                  <Text style={{ fontSize: 10 }}>✅</Text>
                </View>
              )}
              {isLiked && (
                <View style={styles.likedBadge}>
                  <Heart size={14} color="white" fill="white" />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.name}, {item.age}</Text>
                <Text style={styles.cardDist}>📍 {item.distance}</Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.cardPassBtn} onPress={() => handlePass(item)} activeOpacity={0.8}>
                  <X size={14} color="#ff6b6b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardLikeBtn, isLiked && styles.cardLikeBtnActive]}
                  onPress={() => handleLike(item)}
                  activeOpacity={0.8}
                >
                  <Heart size={14} color={isLiked ? "white" : "#ff4ea3"} fill={isLiked ? "white" : "none"} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0618" },
  orbPink:   { position: "absolute", width: 260, height: 260, top: -50, left: -50, borderRadius: 130, backgroundColor: "rgba(255,0,128,0.14)" },
  orbPurple: { position: "absolute", width: 280, height: 280, bottom: -70, right: -70, borderRadius: 140, backgroundColor: "rgba(138,43,226,0.16)" },

  headerGradient: { paddingTop: 48, paddingBottom: 4, zIndex: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", alignItems: "center", justifyContent: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerPin: { fontSize: 16 },
  headerTitle: { color: "white", fontSize: 18, fontWeight: "800", textShadowColor: "rgba(124,77,255,0.8)", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  dotsBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", alignItems: "center", justifyContent: "center" },

  filterRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(167,139,250,0.2)" },
  filterBtnActive: { backgroundColor: "rgba(124,77,255,0.4)", borderColor: "#a78bfa" },
  filterText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "white", fontWeight: "800" },

  grid: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 100, gap: 10 },

  card: {
    width: CARD_W,
    borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    marginRight: 10,
    backgroundColor: "#1a0a2e",
    shadowColor: "#7c4dff", shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  cardBg: {
    width: "100%", height: CARD_W * 0.85,
    alignItems: "center", justifyContent: "center",
  },
  cardEmoji: { fontSize: CARD_W * 0.38 },
  cardOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, height: 60 },
  cardOnlineDot: { position: "absolute", top: 8, left: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: "#00e676", borderWidth: 2, borderColor: "#0d0618" },
  cardVerified: { position: "absolute", top: 6, right: 6, backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 6, padding: 2 },
  likedBadge: { position: "absolute", top: 6, left: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: "#ff4ea3", alignItems: "center", justifyContent: "center" },
  cardInfo: {
    paddingHorizontal: 10, paddingTop: 6, paddingBottom: 2,
    backgroundColor: "rgba(13,6,24,0.95)",
  },
  cardName: { color: "white", fontSize: 12, fontWeight: "800" },
  cardDist: { color: "rgba(167,139,250,0.9)", fontSize: 10, fontWeight: "600", marginTop: 1 },
  cardActions: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: "rgba(13,6,24,0.95)",
  },
  cardPassBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,107,107,0.18)", borderWidth: 1, borderColor: "rgba(255,107,107,0.4)", alignItems: "center", justifyContent: "center" },
  cardLikeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(255,78,163,0.18)", borderWidth: 1, borderColor: "rgba(255,78,163,0.4)", alignItems: "center", justifyContent: "center" },
  cardLikeBtnActive: { backgroundColor: "#ff4ea3", borderColor: "#ff4ea3" },

  emptyWrap: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: "white", fontSize: 17, fontWeight: "800" },
  emptySub: { color: "rgba(255,255,255,0.4)", fontSize: 13 },

  matchOverlayWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, alignItems: "center", justifyContent: "center" },
  matchCard: { width: W * 0.82, backgroundColor: "rgba(26,10,46,0.96)", borderRadius: 28, alignItems: "center", padding: 28, borderWidth: 1, borderColor: "rgba(167,139,250,0.35)", shadowColor: "#7c4dff", shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 30, elevation: 20 },
  matchGlowRing: { width: 108, height: 108, borderRadius: 54, padding: 3, alignItems: "center", justifyContent: "center" },
  matchAvatarBox: { width: 102, height: 102, borderRadius: 51, position: "absolute", top: 3, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#1a0a2e" },
  matchAvatarEmoji: { fontSize: 52 },
  matchHeartBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#ff4ea3", alignItems: "center", justifyContent: "center", marginTop: 94, marginBottom: 12, shadowColor: "#ff4ea3", shadowOffset: { width:0, height:0 }, shadowOpacity: 0.8, shadowRadius: 12, elevation: 10 },
  matchTitle: { color: "white", fontSize: 24, fontWeight: "900", marginBottom: 4 },
  matchName: { color: "#a78bfa", fontSize: 17, fontWeight: "700", marginBottom: 6 },
  matchSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", marginBottom: 22 },
  matchBtnRow: { width: "100%", gap: 10 },
  matchMsgBtn: { borderRadius: 14, overflow: "hidden" },
  matchMsgGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13 },
  matchMsgText: { color: "white", fontSize: 15, fontWeight: "700" },
  matchKeepBtn: { paddingVertical: 11, alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(167,139,250,0.2)" },
  matchKeepText: { color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: "600" },

  profileModalWrap: { flex: 1 },
  profileModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  profileModalSheet: { height: H * 0.76, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: "hidden", borderWidth: 1, borderColor: "rgba(167,139,250,0.25)", backgroundColor: "#0d0618" },
  profileModalHero: { width: "100%", height: "55%", alignItems: "center", justifyContent: "center" },
  profileModalEmoji: { fontSize: 110 },
  profileModalSparkleRing: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: "rgba(167,139,250,0.25)", borderStyle: "dashed" },
  profileModalFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: "55%" },
  profileModalClose: { position: "absolute", top: 14, right: 14, width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  profileModalInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 18, gap: 8 },
  profileModalNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  profileModalName: { color: "white", fontSize: 21, fontWeight: "900" },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00e676", borderWidth: 2, borderColor: "#0d0618" },
  distanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  distanceText: { color: "#a78bfa", fontSize: 13, fontWeight: "600" },
  profileModalBio: { color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 20 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "rgba(124,77,255,0.35)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(167,139,250,0.4)" },
  tagText: { color: "#c4b5fd", fontSize: 12, fontWeight: "600" },
  profileActionRow: { flexDirection: "row", justifyContent: "center", gap: 18, marginTop: 6 },
  profileActionBtn: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", borderWidth: 1, shadowOffset: { width:0, height:4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  passBtn:  { backgroundColor: "rgba(255,107,107,0.15)", borderColor: "rgba(255,107,107,0.4)", shadowColor: "#ff6b6b" },
  superBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,215,0,0.15)", borderColor: "rgba(255,215,0,0.4)", shadowColor: "#ffd700" },
  likeBtn:  { backgroundColor: "#ff4ea3", borderColor: "rgba(255,78,163,0.5)", shadowColor: "#ff4ea3" },
});

// ── Filter styles ────────────────────────────────────────────
const fStyles = StyleSheet.create({
  wrap:     { flex: 1 },
  pickerWrap: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },

  // Main filter sheet (bottom sheet)
  sheet: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    maxHeight: H * 0.6,
    shadowColor: "#7c4dff", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 20,
  },

  // Country / city picker (taller sheet)
  pickerSheet: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.25)",
    maxHeight: H * 0.88,
    shadowColor: "#7c4dff", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 20,
  },

  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.4)",
    alignSelf: "center", marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(167,139,250,0.12)",
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  title:    { color: "white", fontSize: 17, fontWeight: "800" },
  doneText: { color: "#7c4dff", fontSize: 15, fontWeight: "800" },

  sectionTitle: {
    color: "white", fontSize: 16, fontWeight: "800",
    paddingHorizontal: 20, marginTop: 16, marginBottom: 12,
  },
  genderRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 4 },
  genderBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
    alignItems: "center", gap: 4,
  },
  genderIcon:        { fontSize: 22 },
  genderLabel:       { color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600" },
  genderLabelActive: { color: "white", fontWeight: "800" },

  // Location button in main sheet
  locationBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginHorizontal: 20, marginBottom: 28,
    backgroundColor: "rgba(124,77,255,0.18)",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.35)",
  },
  locationBtnText: { color: "white", fontSize: 15, fontWeight: "700", flex: 1 },

  // Search bar (inside picker)
  searchRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14, paddingHorizontal: 14, height: 46,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
  },
  searchInput: { flex: 1, color: "white", fontSize: 14 },

  // Country list rows
  countryRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)",
  },
  countryRowActive: { backgroundColor: "rgba(124,77,255,0.15)" },
  countryFlag:      { fontSize: 22, width: 30 },
  countryName:      { flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 15, fontWeight: "500" },
  countryNameActive:{ color: "white", fontWeight: "700" },
  countryCount:     { color: "rgba(167,139,250,0.6)", fontSize: 12, marginRight: 4 },

  // City chips grid (inside picker)
  cityGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 10,
  },
  cityChip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)",
  },
  cityChipActive:     { backgroundColor: "rgba(124,77,255,0.5)", borderColor: "#a78bfa" },
  cityChipText:       { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500" },
  cityChipTextActive: { color: "white", fontWeight: "800" },
});
