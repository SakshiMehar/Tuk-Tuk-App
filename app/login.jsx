import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as WebBrowser from "expo-web-browser";
import { guestLogin, googleLogin } from "../src/api/authApi";
import { saveSession } from "../src/store/authStore";
import { establishSessionFromApi } from "../src/services/authSessionService";
import { signInWithFacebook } from "../src/services/facebookSdkNative";
import {
  useGoogleSignIn,
  getGoogleIdToken,
  getGoogleAuthErrorMessage,
} from "../src/hooks/useGoogleSignIn";

WebBrowser.maybeCompleteAuthSession();

const logo = require("../assets/images/splash-icon.png");

// ── Main Login Screen ────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [accepted, setAccepted]           = useState(false);
  const [guestLoading, setGuestLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

 const {
  response: googleResponse,
  promptAsync: googlePromptAsync,
} = useGoogleSignIn();

 useEffect(() => {
  console.log("GOOGLE RESPONSE:", googleResponse);

  if (!googleResponse) return;

  const errMsg = getGoogleAuthErrorMessage(googleResponse);

  console.log("GOOGLE ERROR:", errMsg);

  if (errMsg === "cancelled") {
    setGoogleLoading(false);
    return;
  }

  if (errMsg) {
    setGoogleLoading(false);
    Alert.alert("Google Sign-In", errMsg);
    return;
  }

  if (googleResponse.type !== "success") {
    console.log("NOT SUCCESS");
    setGoogleLoading(false);
    return;
  }

  (async () => {
    try {
      console.log("GOOGLE SUCCESS");

      const idToken = getGoogleIdToken(googleResponse);

      console.log("ID TOKEN:", idToken);

      if (!idToken) {
        throw new Error("Google sign-in did not return an ID token.");
      }

      const result = await establishSessionFromApi(
        googleLogin,
        idToken
      );

      console.log("LOGIN RESULT:", result);

      router.replace("/(tabs)/home");
    } catch (err) {
      console.log("GOOGLE LOGIN ERROR:", err);

      const msg = err?.message ?? "Google sign-in failed.";

      Alert.alert("Google Sign-In", msg);
    } finally {
      setGoogleLoading(false);
    }
  })();
}, [googleResponse]);

  const requireAccepted = () => {
    if (!accepted) {
      Alert.alert("Required", "Please accept Terms and Privacy Policy first.");
      return false;
    }
    return true;
  };

const handleGoogleLogin = async () => {
  if (!requireAccepted()) return;

  try {
    setGoogleLoading(true);

 await googlePromptAsync();
  } catch (err) {
    Alert.alert(
      "Google Sign-In",
      err?.message ?? "Google sign-in failed."
    );

    setGoogleLoading(false);
  }
};

  const handleFacebookLogin = async () => {
    if (!requireAccepted()) return;
    setFacebookLoading(true);
    try {
      await signInWithFacebook();
      router.replace("/(tabs)/home");
    } catch (err) {
      const msg = err?.message ?? "Facebook sign-in failed.";
      if (!msg.toLowerCase().includes("cancelled")) {
        Alert.alert("Facebook Sign-In", msg);
      }
    } finally {
      setFacebookLoading(false);
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0d0618" }}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />

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
            onPress={handleFacebookLogin}
            disabled={facebookLoading}
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
            {facebookLoading
              ? <ActivityIndicator color="white" style={{ marginLeft: "auto" }} />
              : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 }}>
                  Sign in with Facebook
                </Text>}
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={googleLoading}
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
            {googleLoading
              ? <ActivityIndicator color="white" style={{ marginLeft: "auto" }} />
              : <Text style={{ color: "white", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 }}>
                  Sign in with Google
                </Text>}
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
