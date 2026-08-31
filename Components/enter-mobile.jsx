import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Search, X, ChevronDown } from "lucide-react-native";
import { sendPhoneOtp } from "../src/services/firebasePhoneService";
import { COUNTRY_OPTIONS as COUNTRIES } from "../src/data/countryOptions";
import { s, vs, ms } from "../src/utils/responsive";

export default function EnterMobile() {
  const router = useRouter();
  const [phone, setPhone]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState(
    COUNTRIES.find((c) => c.name === "India") ?? COUNTRIES[0]
  );

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.code.includes(search)
      )
    : COUNTRIES;

  const handleContinue = async () => {
    const trimmed = phone.trim();
    if (trimmed.length < 5) {
      Alert.alert("Invalid", "Please enter a valid phone number.");
      return;
    }
    const e164 = `${selected.code}${trimmed.replace(/^0+/, "")}`;
    setLoading(true);
    try {
      await sendPhoneOtp(e164);
      router.push({ pathname: "/verify-otp", params: { phone: e164 } });
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070616" />
      <LinearGradient colors={["#070616", "#110d2f", "#150f3d"]} style={StyleSheet.absoluteFill} />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />

      {/* ── Country Picker Modal ── */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setPickerOpen(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} style={styles.pickerClose}>
                <X size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchRow}>
              <Search size={16} color="rgba(167,139,250,0.7)" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search country or code..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={search}
                onChangeText={setSearch}
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <X size={14} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item, i) => `${item.name}-${i}`}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isActive = item.name === selected.name;
                return (
                  <TouchableOpacity
                    style={[styles.countryRow, isActive && styles.countryRowActive]}
                    activeOpacity={0.75}
                    onPress={() => { setSelected(item); setSearch(""); setPickerOpen(false); }}
                  >
                    <Text style={styles.countryFlag}>{item.flag}</Text>
                    <Text style={[styles.countryName, isActive && styles.countryNameActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.countryCode, isActive && styles.countryCodeActive]}>{item.code}</Text>
                    {isActive && <View style={styles.activeDot} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Main Screen ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Enter your number</Text>
        <Text style={styles.subtitle}>
          We&apos;ll send a verification code to confirm your identity.
        </Text>

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.countryBtn} onPress={() => setPickerOpen(true)} activeOpacity={0.8}>
            <Text style={styles.countryBtnFlag}>{selected.flag}</Text>
            <Text style={styles.countryBtnCode}>{selected.code}</Text>
            <ChevronDown size={14} color="rgba(167,139,250,0.8)" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={15}
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={loading}
        >
          <LinearGradient
            colors={["#ff4ea3", "#8f56ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.continueBtnText}>Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070616" },
  orbPink: {
    position: "absolute", width: s(280), height: s(280), top: vs(-60), left: s(-60),
    borderRadius: s(140), backgroundColor: "rgba(255,77,166,0.18)",
  },
  orbPurple: {
    position: "absolute", width: s(300), height: s(300), bottom: vs(80), right: s(-80),
    borderRadius: s(150), backgroundColor: "rgba(132,66,255,0.16)",
  },
  header: { paddingTop: vs(52), paddingHorizontal: s(16), paddingBottom: vs(8) },
  backBtn: {
    width: s(36), height: s(36), borderRadius: s(18),
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  body: { flex: 1, paddingHorizontal: s(24), paddingTop: vs(32) },
  title: { color: "white", fontSize: ms(28), fontWeight: "800", marginBottom: vs(10) },
  subtitle: { color: "rgba(255,255,255,0.6)", fontSize: ms(14), lineHeight: ms(22), marginBottom: vs(36) },
  inputRow: { flexDirection: "row", gap: s(10), marginBottom: vs(24) },
  countryBtn: {
    flexDirection: "row", alignItems: "center", gap: s(6),
    height: vs(54), paddingHorizontal: s(12), borderRadius: s(14),
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(167,139,250,0.3)", minWidth: s(90),
  },
  countryBtnFlag: { fontSize: ms(20) },
  countryBtnCode: { color: "white", fontSize: ms(14), fontWeight: "700" },
  input: {
    flex: 1, height: vs(54), borderRadius: s(14),
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: s(16), color: "white", fontSize: ms(16),
  },
  continueBtn: { borderRadius: s(14), overflow: "hidden" },
  continueBtnGradient: { height: vs(54), alignItems: "center", justifyContent: "center", borderRadius: s(14) },
  continueBtnText: { color: "white", fontSize: ms(16), fontWeight: "700" },
  pickerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  pickerSheet: {
    backgroundColor: "#1a0a2e", borderTopLeftRadius: s(28), borderTopRightRadius: s(28),
    borderWidth: 1, borderColor: "rgba(167,139,250,0.25)", maxHeight: "75%",
    paddingBottom: vs(24), shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 20,
  },
  pickerHandle: {
    width: s(40), height: vs(4), borderRadius: s(2),
    backgroundColor: "rgba(167,139,250,0.4)", alignSelf: "center", marginTop: vs(10), marginBottom: vs(4),
  },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: s(20), paddingVertical: vs(14),
    borderBottomWidth: 1, borderBottomColor: "rgba(167,139,250,0.12)",
  },
  pickerTitle: { color: "white", fontSize: ms(17), fontWeight: "800" },
  pickerClose: {
    width: s(32), height: s(32), borderRadius: s(16),
    backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row", alignItems: "center", marginHorizontal: s(16), marginVertical: vs(12),
    backgroundColor: "rgba(255,255,255,0.07)", borderRadius: s(14),
    borderWidth: 1, borderColor: "rgba(167,139,250,0.2)", paddingHorizontal: s(14), height: vs(46),
  },
  searchInput: { flex: 1, color: "white", fontSize: ms(14) },
  countryRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: s(20), paddingVertical: vs(13),
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)", gap: s(12),
  },
  countryRowActive: { backgroundColor: "rgba(124,77,255,0.18)" },
  countryFlag: { fontSize: ms(22), width: s(30) },
  countryName: { flex: 1, color: "rgba(255,255,255,0.75)", fontSize: ms(14), fontWeight: "500" },
  countryNameActive: { color: "white", fontWeight: "700" },
  countryCode: { color: "rgba(167,139,250,0.7)", fontSize: ms(14), fontWeight: "600", minWidth: s(44), textAlign: "right" },
  countryCodeActive: { color: "#a78bfa" },
  activeDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: "#7c4dff", marginLeft: s(6) },
});
