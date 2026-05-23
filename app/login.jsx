import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, FontAwesome5, AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { guestLogin, emailLogin, emailRegister } from "../src/api/authApi";
import { saveSession } from "../src/store/authStore";

const logo = require("../assets/images/splash-icon.png");

// ── Reusable styled input ────────────────────────────────────
function AuthInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType }) {
  const [show, setShow] = useState(false);
  return (
    <View style={inputStyles.wrap}>
      <Ionicons name={icon} size={18} color="rgba(167,139,250,0.7)" style={inputStyles.icon} />
      <TextInput
        style={inputStyles.field}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.3)"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !show}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShow((v) => !v)} style={inputStyles.eye}>
          <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="rgba(255,255,255,0.4)" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const inputStyles = {
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 14,
    height: 52,
    marginBottom: 14,
  },
  icon: { marginRight: 10 },
  field: { flex: 1, color: "white", fontSize: 15 },
  eye: { paddingLeft: 8 },
};

// ── Auth Modal (Login / Sign Up) ─────────────────────────────
function AuthModal({ visible, provider, onClose, onSuccess }) {
  // Facebook only supports login (accounts are created on Facebook's platform)
  const allowSignup = provider !== "Facebook";
  const [tab, setTab]           = useState("login");   // "login" | "signup"
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);

  const reset = () => {
    setTab("login"); setName(""); setEmail("");
    setPassword(""); setConfirm(""); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Required", "Please fill in all fields."); return;
    }
    if (tab === "signup") {
      if (!name.trim()) { Alert.alert("Required", "Please enter your name."); return; }
      if (password !== confirm) { Alert.alert("Mismatch", "Passwords do not match."); return; }
      if (password.length < 6) { Alert.alert("Weak password", "Password must be at least 6 characters."); return; }
    }
    setLoading(true);
    try {
      let data;
      if (tab === "login") {
        data = await emailLogin(email.trim(), password);
      } else {
        data = await emailRegister(name.trim(), email.trim(), password);
      }
      if (data?.token) await saveSession(data.token, data.user ?? {});
      reset();
      onSuccess();
    } catch (err) {
      Alert.alert(tab === "login" ? "Login Failed" : "Sign Up Failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const providerColor = provider === "Google" ? "#EA4335" : "#1877F2";
  const providerIcon  = provider === "Google"
    ? <AntDesign name="google" size={18} color={providerColor} />
    : <FontAwesome name="facebook-f" size={18} color={providerColor} />;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Dim backdrop */}
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          activeOpacity={1}
          onPress={handleClose}
        />

        {/* Sheet */}
        <View style={modalStyles.sheet}>
          {/* Handle */}
          <View style={modalStyles.handle} />

          {/* Provider badge */}
          <View style={modalStyles.providerRow}>
            <View style={[modalStyles.providerBadge, { borderColor: providerColor + "55" }]}>
              {providerIcon}
              <Text style={[modalStyles.providerText, { color: providerColor }]}>{provider}</Text>
            </View>
          </View>

          {/* Tab switcher — Sign Up hidden for Facebook */}
          {allowSignup && (
          <View style={modalStyles.tabRow}>
            {["login", "signup"].map((t) => (
              <TouchableOpacity
                key={t}
                style={[modalStyles.tabBtn, tab === t && modalStyles.tabBtnActive]}
                onPress={() => setTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[modalStyles.tabText, tab === t && modalStyles.tabTextActive]}>
                  {t === "login" ? "Log In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          )}

          {/* Fields */}
          {tab === "signup" && (
            <AuthInput
              icon="person-outline"
              placeholder="Full name"
              value={name}
              onChangeText={setName}
            />
          )}
          <AuthInput
            icon="mail-outline"
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <AuthInput
            icon="lock-closed-outline"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {tab === "signup" && (
            <AuthInput
              icon="lock-closed-outline"
              placeholder="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
            />
          )}

          {/* Submit */}
          <TouchableOpacity
            style={modalStyles.submitBtn}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7c4dff", "#a855f7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={modalStyles.submitGradient}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={modalStyles.submitText}>
                    {tab === "login" ? "Log In" : "Create Account"}
                  </Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          {/* Switch hint — only shown when signup is allowed */}
          {allowSignup && (
          <TouchableOpacity onPress={() => setTab(tab === "login" ? "signup" : "login")} style={{ alignItems: "center", marginTop: 4 }}>
            <Text style={modalStyles.switchText}>
              {tab === "login" ? "Don't have an account? " : "Already have an account? "}
              <Text style={modalStyles.switchLink}>
                {tab === "login" ? "Sign Up" : "Log In"}
              </Text>
            </Text>
          </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = {
  sheet: {
    backgroundColor: "#1a0a2e",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    paddingHorizontal: 24,
    paddingBottom: 36,
    paddingTop: 8,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "rgba(167,139,250,0.4)",
    alignSelf: "center", marginBottom: 20,
  },
  providerRow: { alignItems: "center", marginBottom: 20 },
  providerBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  providerText: { fontSize: 14, fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.15)",
  },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center",
  },
  tabBtnActive: {
    backgroundColor: "rgba(124,77,255,0.45)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.4)",
  },
  tabText: { color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "white", fontWeight: "800" },
  submitBtn: { borderRadius: 14, overflow: "hidden", marginTop: 4, marginBottom: 16 },
  submitGradient: {
    height: 52, alignItems: "center", justifyContent: "center",
    shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "800" },
  switchText: { color: "rgba(255,255,255,0.45)", fontSize: 13 },
  switchLink: { color: "#a78bfa", fontWeight: "700" },
};

// ── Main Login Screen ────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [accepted, setAccepted]         = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [authModal, setAuthModal]       = useState(null); // null | "Google" | "Facebook"

  const requireAccepted = () => {
    if (!accepted) {
      Alert.alert("Required", "Please accept Terms and Privacy Policy first.");
      return false;
    }
    return true;
  };

  const handleSocialPress = (provider) => {
    if (!requireAccepted()) return;
    setAuthModal(provider);
  };

  const handlePhoneLogin = () => {
    if (!requireAccepted()) return;
    router.push("/enter-mobile");
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const data = await guestLogin();
      if (data?.token) await saveSession(data.token, data.user ?? {});
    } catch (_) {
      // Guest endpoint not available — continue as unauthenticated guest
    } finally {
      setGuestLoading(false);
      router.replace("/(tabs)/home");
    }
  };

  const handleAuthSuccess = () => {
    setAuthModal(null);
    router.replace("/(tabs)/home");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0618" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />

      {/* Auth modal */}
      <AuthModal
        visible={authModal !== null}
        provider={authModal ?? "Google"}
        onClose={() => setAuthModal(null)}
        onSuccess={handleAuthSuccess}
      />

      {/* Background gradient */}
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      {/* Top-left pink orb */}
      <View style={{
        position: "absolute", width: 300, height: 300, top: -80, left: -80,
        borderRadius: 150, backgroundColor: "rgba(255,0,128,0.18)",
      }} />

      {/* Bottom-right purple orb */}
      <View style={{
        position: "absolute", width: 350, height: 350, bottom: -120, right: -120,
        borderRadius: 175, backgroundColor: "rgba(138,43,226,0.22)",
      }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{
          flex: 1, alignItems: "center", justifyContent: "center",
          paddingHorizontal: 28, paddingVertical: 48,
        }}>

          {/* Logo */}
          <Image source={logo} style={{ width: 300, height: 90, borderRadius: 20 }} resizeMode="contain" />

          {/* Title */}
          <MaskedView
            style={{ marginTop: 28 }}
            maskElement={
              <Text style={{ fontSize: 38, fontWeight: "800", letterSpacing: 1, textAlign: "center" }}>
                Tuk Tuk
              </Text>
            }
          >
            <LinearGradient colors={["#ffffff", "#f0e6ff", "#ff69b4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: 48, fontWeight: "800", opacity: 0 }}>Tuk Tuk</Text>
            </LinearGradient>
          </MaskedView>

          {/* User count */}
          <MaskedView
            style={{ marginTop: 8 }}
            maskElement={
              <Text style={{ fontSize: 46, fontWeight: "800", textAlign: "center" }}>13,365,176</Text>
            }
          >
            <LinearGradient colors={["#00ffff", "#ff00ff", "#ff69b4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ fontSize: 46, fontWeight: "800", opacity: 0 }}>13,365,176</Text>
            </LinearGradient>
          </MaskedView>

          {/* Subtitle */}
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 6, marginBottom: 36, letterSpacing: 0.5 }}>
            Connect - Talk - Earn
          </Text>

          {/* Facebook Button */}
          <TouchableOpacity
            onPress={() => handleSocialPress("Facebook")}
            activeOpacity={0.8}
            style={{
              width: "100%", height: 62, borderRadius: 16,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 18, marginBottom: 14,
              shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
            }}
          >
            <View style={{
              width: 42, height: 42, borderRadius: 12, backgroundColor: "white",
              alignItems: "center", justifyContent: "center", marginRight: 18,
            }}>
              <FontAwesome name="facebook-f" size={20} color="#1877F2" />
            </View>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 }}>
              Sign in with Facebook
            </Text>
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            onPress={() => handleSocialPress("Google")}
            activeOpacity={0.8}
            style={{
              width: "100%", height: 62, borderRadius: 16,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: 18, marginBottom: 32,
              shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
            }}
          >
            <View style={{
              width: 42, height: 42, borderRadius: 12, backgroundColor: "white",
              alignItems: "center", justifyContent: "center", marginRight: 18,
            }}>
              <AntDesign name="google" size={22} color="#EA4335" />
            </View>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 }}>
              Sign in with Google
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: 28 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, marginHorizontal: 16 }}>
              More login options
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          {/* Circle Options */}
          <View style={{ flexDirection: "row", gap: 24, marginBottom: 40 }}>
            {/* Phone */}
            <TouchableOpacity onPress={handlePhoneLogin} activeOpacity={0.8} style={circleBtn}>
              <FontAwesome5 name="phone-alt" size={24} color="white" />
            </TouchableOpacity>
            {/* Apple */}
            <TouchableOpacity onPress={() => Alert.alert("Apple Login", "Apple login requires iOS native SDK.")} activeOpacity={0.8} style={circleBtn}>
              <FontAwesome name="apple" size={26} color="white" />
            </TouchableOpacity>
            {/* WeChat */}
            <TouchableOpacity onPress={() => Alert.alert("WeChat Login", "WeChat login coming soon.")} activeOpacity={0.8} style={circleBtn}>
              <FontAwesome5 name="weixin" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Guest Login */}
          <TouchableOpacity
            onPress={handleGuestLogin}
            disabled={guestLoading}
            activeOpacity={0.7}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.05)",
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 10, marginBottom: 28,
            }}
          >
            <FontAwesome5 name="user-secret" size={18} color="rgba(255,255,255,0.6)" />
            {guestLoading
              ? <ActivityIndicator color="rgba(255,255,255,0.6)" />
              : <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: "600" }}>
                  Continue as Guest
                </Text>
            }
          </TouchableOpacity>

          {/* Terms Checkbox */}
          <View style={{
            flexDirection: "row", alignItems: "center", width: "100%",
            backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
            paddingVertical: 16, paddingHorizontal: 16,
          }}>
            <TouchableOpacity
              onPress={() => setAccepted(!accepted)}
              activeOpacity={0.8}
              style={{
                width: 22, height: 22, borderRadius: 5, borderWidth: 2,
                borderColor: accepted ? "transparent" : "rgba(255,255,255,0.35)",
                backgroundColor: accepted ? "#ff0080" : "rgba(255,255,255,0.08)",
                alignItems: "center", justifyContent: "center", marginRight: 12,
                shadowColor: accepted ? "#ff0080" : "transparent",
                shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
              }}
            >
              {accepted && <FontAwesome name="check" size={11} color="white" />}
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, flex: 1, lineHeight: 20 }}>
              I agree to the{" "}
              <Text style={{ color: "#ff69b4", fontWeight: "700" }} onPress={() => router.push("/terms-of-use")}>
                Terms and Conditions
              </Text>
              {" "}and{" "}
              <Text style={{ color: "#ff69b4", fontWeight: "700" }} onPress={() => router.push("/privacy-policy")}>
                Privacy Policy
              </Text>
            </Text>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const circleBtn = {
  width: 68, height: 68, borderRadius: 34,
  backgroundColor: "rgba(255,255,255,0.08)",
  borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  alignItems: "center", justifyContent: "center",
  shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
};
