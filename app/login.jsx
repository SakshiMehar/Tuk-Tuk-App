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
import { guestLogin, googleLogin } from "../src/api/authApi";
import { getUsersCount } from "../src/api/userApi";
import { hasAcceptedTerms, setTermsAccepted, updateUser } from "../src/store/authStore";
import { establishSessionFromApi } from "../src/services/authSessionService";
import {
  configureFacebookSdk,
  signInWithFacebook,
  getFacebookAuthErrorMessage,
} from "../src/services/facebookAuthService";
import FacebookLoginWebViewModal from "../Components/FacebookLoginWebViewModal";
import {
  configureGoogleSignIn,
  signInWithGoogle,
  getGoogleAuthErrorMessage,
} from "../src/hooks/useGoogleSignIn";
import { s, vs, ms, wp } from "../src/utils/responsive";

const logo = require("../assets/images/splash-icon.png");

// ── Main Login Screen ────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const [accepted, setAccepted]           = useState(false);
  const [guestLoading, setGuestLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookWebView, setFacebookWebView] = useState(null);
  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    configureGoogleSignIn();
    configureFacebookSdk();
    hasAcceptedTerms().then(setAccepted).catch(() => setAccepted(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    getUsersCount()
      .then((data) => {
        if (cancelled) return;
        const count = data?.userCount ?? data?.count ?? null;
        if (count != null) setUserCount(Number(count));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const userCountLabel = userCount != null ? userCount.toLocaleString() : "...";

  const requireAccepted = () => {
    if (!accepted) {
      Alert.alert(
        "Terms required",
        "Please agree to the Terms and Conditions and Privacy Policy before continuing."
      );
      return false;
    }
    return true;
  };

  const toggleAccepted = async () => {
    const next = !accepted;
    setAccepted(next);
    await setTermsAccepted(next);
  };

  const finishLogin = async () => {
    await setTermsAccepted(true);
    router.replace("/(tabs)/home");
  };

  const handleGoogleLogin = async () => {
    if (!requireAccepted()) return;
    setGoogleLoading(true);
    try {
      const idToken = await signInWithGoogle();
      if (!idToken) throw new Error("Google sign-in did not return an ID token.");
      await establishSessionFromApi(googleLogin, idToken);
      await finishLogin();
    } catch (err) {
      const msg = getGoogleAuthErrorMessage(err);
      if (msg && msg !== "cancelled") {
        Alert.alert("Google Sign-In", msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (!requireAccepted()) return;
    setFacebookLoading(true);
    try {
      await signInWithFacebook({
        openWebView: (config) => {
          setFacebookWebView({
            ...config,
            onClose: () => setFacebookWebView(null),
          });
        },
      });
      await finishLogin();
    } catch (err) {
      const msg = getFacebookAuthErrorMessage(err);
      if (msg) {
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
    if (!requireAccepted()) return;
    setGuestLoading(true);
    try {
      await establishSessionFromApi(guestLogin);
      await updateUser({ isGuest: true, avatarId: null, avatar: null, profilePicUrl: null, avatarUrl: null });
      await finishLogin();
    } catch (err) {
      Alert.alert(
        "Guest Login",
        err?.message || "Could not continue as guest. Please try again."
      );
    } finally {
      setGuestLoading(false);
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
        position: "absolute",
        width: s(300), height: s(300),
        top: vs(-80), left: s(-80),
        borderRadius: s(150),
        backgroundColor: "rgba(255,0,128,0.18)",
      }} />

      {/* Bottom-right purple orb */}
      <View style={{
        position: "absolute",
        width: s(350), height: s(350),
        bottom: vs(-120), right: s(-120),
        borderRadius: s(175),
        backgroundColor: "rgba(138,43,226,0.22)",
      }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: s(28),
          paddingVertical: vs(48),
        }}>

          {/* Logo */}
          <Image
            source={logo}
            style={{ width: wp(80), height: vs(90), borderRadius: s(20) }}
            resizeMode="contain"
          />

          {/* Title */}
          <MaskedView
            style={{ marginTop: vs(28) }}
            maskElement={
              <Text style={{ fontSize: ms(38), fontWeight: "800", letterSpacing: 1, textAlign: "center" }}>
                Tuk Tuk
              </Text>
            }
          >
            <LinearGradient colors={["#ffffff", "#f0e6ff", "#ff69b4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: ms(48), fontWeight: "800", opacity: 0 }}>Tuk Tuk</Text>
            </LinearGradient>
          </MaskedView>

          {/* User count */}
          <MaskedView
            style={{ marginTop: vs(8) }}
            maskElement={
              <Text style={{ fontSize: ms(46), fontWeight: "800", textAlign: "center" }}>{userCountLabel}</Text>
            }
          >
            <LinearGradient colors={["#00ffff", "#ff00ff", "#ff69b4"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ fontSize: ms(46), fontWeight: "800", opacity: 0 }}>{userCountLabel}</Text>
            </LinearGradient>
          </MaskedView>

          {/* Subtitle */}
          <Text
            allowFontScaling={false}
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: ms(15),
              marginTop: vs(6),
              marginBottom: vs(36),
              letterSpacing: 0.5,
              textAlign: "center",
              alignSelf: "stretch",
            }}
          >
            Connect - Talk - Earn
          </Text>

          {/* Facebook Button */}
          <TouchableOpacity
            onPress={handleFacebookLogin}
            disabled={facebookLoading}
            activeOpacity={0.8}
            style={{
              width: "100%", height: vs(62), borderRadius: s(16),
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: s(18), marginBottom: vs(14),
              shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
            }}
          >
            <View style={{
              width: s(42), height: s(42), borderRadius: s(12),
              backgroundColor: "white",
              alignItems: "center", justifyContent: "center",
              marginRight: s(18),
            }}>
              <FontAwesome name="facebook-f" size={ms(20)} color="#1877F2" />
            </View>
            {facebookLoading
              ? <ActivityIndicator color="white" style={{ marginLeft: "auto" }} />
              : <Text style={{ color: "white", fontSize: ms(16), fontWeight: "600", letterSpacing: 0.3 }}>
                  Sign in with Facebook
                </Text>
            }
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
            style={{
              width: "100%", height: vs(62), borderRadius: s(16),
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: s(18), marginBottom: vs(32),
              shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
            }}
          >
            <View style={{
              width: s(42), height: s(42), borderRadius: s(12),
              backgroundColor: "white",
              alignItems: "center", justifyContent: "center",
              marginRight: s(18),
            }}>
              <AntDesign name="google" size={ms(22)} color="#EA4335" />
            </View>
            {googleLoading
              ? <ActivityIndicator color="white" style={{ marginLeft: "auto" }} />
              : <Text style={{ color: "white", fontSize: ms(16), fontWeight: "600", letterSpacing: 0.3 }}>
                  Sign in with Google
                </Text>
            }
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: vs(28) }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <Text
              allowFontScaling={false}
              style={{ color: "rgba(255,255,255,0.55)", fontSize: ms(14), marginHorizontal: s(16) }}
            >
              More login options
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          {/* Phone login */}
          <View style={{ alignItems: "center", width: "100%", marginBottom: vs(40) }}>
            <TouchableOpacity onPress={handlePhoneLogin} activeOpacity={0.8} style={circleBtn}>
              <FontAwesome5 name="phone-alt" size={ms(24)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Guest Login */}
          <TouchableOpacity
            onPress={handleGuestLogin}
            disabled={guestLoading}
            activeOpacity={0.7}
            style={{
              width: "100%", height: vs(52), borderRadius: s(14),
              borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              backgroundColor: "rgba(255,255,255,0.05)",
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: s(10), marginBottom: vs(28),
            }}
          >
            <FontAwesome5 name="user-secret" size={ms(18)} color="rgba(255,255,255,0.6)" />
            {guestLoading
              ? <ActivityIndicator color="rgba(255,255,255,0.6)" />
              : <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: ms(15), fontWeight: "600" }}>
                  Continue as Guest
                </Text>
            }
          </TouchableOpacity>

          {/* Terms Checkbox */}
          <View style={{
            flexDirection: "row", alignItems: "center", width: "100%",
            backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(14),
            borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
            paddingVertical: vs(16), paddingHorizontal: s(16),
          }}>
            <TouchableOpacity
              onPress={toggleAccepted}
              activeOpacity={0.8}
              style={{
                width: s(22), height: s(22), borderRadius: s(5), borderWidth: 2,
                borderColor: accepted ? "transparent" : "rgba(255,255,255,0.35)",
                backgroundColor: accepted ? "#ff0080" : "rgba(255,255,255,0.08)",
                alignItems: "center", justifyContent: "center", marginRight: s(12),
                shadowColor: accepted ? "#ff0080" : "transparent",
                shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
              }}
            >
              {accepted && <FontAwesome name="check" size={ms(11)} color="white" />}
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: ms(13), flex: 1, lineHeight: ms(20) }}>
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

      {facebookWebView ? (
        <FacebookLoginWebViewModal {...facebookWebView} />
      ) : null}
    </View>
  );
}

const circleBtn = {
  width: s(68), height: s(68), borderRadius: s(34),
  backgroundColor: "rgba(255,255,255,0.08)",
  borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  alignItems: "center", justifyContent: "center",
  shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
};
