import { AntDesign, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import FacebookLoginWebViewModal from "../Components/FacebookLoginWebViewModal";
import { googleLogin } from "../src/api/authApi";
import { getUsersCount } from "../src/api/userApi";
import {
  configureGoogleSignIn,
  getGoogleAuthErrorMessage,
  signInWithGoogle,
} from "../src/hooks/useGoogleSignIn";
import { establishSessionFromApi } from "../src/services/authSessionService";
import {
  configureFacebookSdk,
  getFacebookAuthErrorMessage,
  signInWithFacebook,
} from "../src/services/facebookAuthService";
import { hasAcceptedTerms, setPendingInviteCode, setTermsAccepted } from "../src/store/authStore";
import { ms, s, vs } from "react-native-size-matters";
import { wp } from "../src/utils/responsive";
import { Colors } from "../src/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logo = require("../assets/images/splash-icon.png");

// ── Main Login Screen ────────────────────────────────────────
export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [accepted, setAccepted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookWebView, setFacebookWebView] = useState(null);
  const [userCount, setUserCount] = useState(null);
  const [inviteCode, setInviteCode] = useState("");

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
      .catch(() => { });
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

  // Stashed locally so it survives the trip to phone-login/OTP too — there's no
  // backend endpoint yet to actually redeem it against the inviter's account.
  const persistInviteCode = () => setPendingInviteCode(inviteCode);

  const handleApplyInviteCode = async () => {
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      Alert.alert("Invite code", "Enter a code first.");
      return;
    }
    await persistInviteCode();
    Alert.alert("Saved", `Invite code "${trimmed}" will be applied once you sign in.`);
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
    await persistInviteCode();
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
    await persistInviteCode();
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

  const handlePhoneLogin = async () => {
    if (!requireAccepted()) return;
    await persistInviteCode();
    router.push("/enter-mobile");
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.backgroundLogin }}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundLogin} />

      {/* Background gradient */}
      <LinearGradient
        colors={Colors.loginGradient}
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
        backgroundColor: Colors.orbPinkLogin,
      }} />

      {/* Bottom-right purple orb */}
      <View style={{
        position: "absolute",
        width: s(350), height: s(350),
        bottom: vs(-120), right: s(-120),
        borderRadius: s(175),
        backgroundColor: Colors.orbPurpleLogin,
      }} />

      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          paddingHorizontal: s(22),
          paddingTop: Math.max(insets.top, vs(14)),
          paddingBottom: Math.max(insets.bottom, vs(14)),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}>

          {/* Logo */}
          <Image
            source={logo}
            style={{ width: wp(55), height: vs(76), borderRadius: s(16) }}
            resizeMode="contain"
          />

          {/* Title */}
          <MaskedView
            style={{ marginTop: vs(12) }}
            maskElement={
              <Text style={{ fontSize: ms(32), fontWeight: "800", letterSpacing: 1, textAlign: "center" }}>
                Tuk Tuk
              </Text>
            }
          >
            <LinearGradient colors={Colors.titleGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={{ fontSize: ms(40), fontWeight: "800", opacity: 0 }}>Tuk Tuk</Text>
            </LinearGradient>
          </MaskedView>

          {/* User count */}
          <MaskedView
            style={{ marginTop: vs(4) }}
            maskElement={
              <Text style={{ fontSize: ms(36), fontWeight: "800", textAlign: "center" }}>{userCountLabel}</Text>
            }
          >
            <LinearGradient colors={Colors.counterGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={{ fontSize: ms(36), fontWeight: "800", opacity: 0 }}>{userCountLabel}</Text>
            </LinearGradient>
          </MaskedView>

          {/* Subtitle */}
          <Text
            allowFontScaling={false}
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: ms(13),
              marginTop: vs(4),
              marginBottom: vs(18),
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
              width: "100%", height: vs(54), borderRadius: s(14),
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: s(16), marginBottom: vs(10),
              shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
            }}
          >
            <View style={{
              width: s(36), height: s(36), borderRadius: s(10),
              backgroundColor: "white",
              alignItems: "center", justifyContent: "center",
              marginRight: s(14),
            }}>
              <FontAwesome name="facebook-f" size={ms(18)} color={Colors.facebook} />
            </View>
            <Text style={{ color: "white", fontSize: ms(15), fontWeight: "600", letterSpacing: 0.3 }}>
              Sign in with Facebook
            </Text>
            {facebookLoading && (
              <ActivityIndicator color="white" size="small" style={{ marginLeft: "auto" }} />
            )}
          </TouchableOpacity>

          {/* Google Button */}
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={googleLoading}
            activeOpacity={0.8}
            style={{
              width: "100%", height: vs(54), borderRadius: s(14),
              borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.07)",
              flexDirection: "row", alignItems: "center",
              paddingHorizontal: s(16), marginBottom: vs(18),
              shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
            }}
          >
            <View style={{
              width: s(36), height: s(36), borderRadius: s(10),
              backgroundColor: "white",
              alignItems: "center", justifyContent: "center",
              marginRight: s(14),
            }}>
              <AntDesign name="google" size={ms(18)} color={Colors.google} />
            </View>
            <Text style={{ color: "white", fontSize: ms(15), fontWeight: "600", letterSpacing: 0.3 }}>
              Sign in with Google
            </Text>
            {googleLoading && (
              <ActivityIndicator color="white" size="small" style={{ marginLeft: "auto" }} />
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={{ flexDirection: "row", alignItems: "center", width: "100%", marginBottom: vs(16) }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{ color: "rgba(255,255,255,0.55)", fontSize: ms(13), marginHorizontal: s(8), flexShrink: 1 }}
            >
              More login options
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          {/* Phone login */}
          <View style={{ alignItems: "center", width: "100%", marginBottom: vs(18) }}>
            <TouchableOpacity onPress={handlePhoneLogin} activeOpacity={0.8} style={circleBtn}>
              <FontAwesome5 name="phone-alt" size={ms(20)} color="white" />
            </TouchableOpacity>
          </View>

          {/* Invite code (optional) */}
          <View style={{
            flexDirection: "row", alignItems: "center", width: "100%",
            backgroundColor: "rgba(255,255,255,0.05)", borderRadius: s(12),
            borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
            paddingLeft: s(14), paddingRight: s(6), marginBottom: vs(10),
          }}>
            <FontAwesome5 name="gift" size={ms(15)} color="rgba(255,255,255,0.45)" style={{ marginRight: s(10) }} />
            <TextInput
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              placeholder="Have an invite code? (optional)"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              style={{
                flex: 1, color: "white", fontSize: ms(13),
                paddingVertical: vs(10),
              }}
            />
            <TouchableOpacity
              onPress={handleApplyInviteCode}
              activeOpacity={0.8}
              disabled={!inviteCode.trim()}
              style={{
                backgroundColor: inviteCode.trim() ? "rgba(255,0,128,0.25)" : "rgba(255,255,255,0.06)",
                borderRadius: s(8),
                paddingHorizontal: s(12),
                paddingVertical: vs(7),
              }}
            >
              <Text style={{
                color: inviteCode.trim() ? Colors.hotPink : "rgba(255,255,255,0.3)",
                fontSize: ms(12), fontWeight: "700",
              }}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>

          {/* Terms Checkbox */}
          <View style={{
            flexDirection: "row", alignItems: "center", width: "100%",
            backgroundColor: "rgba(255,255,255,0.04)", borderRadius: s(12),
            borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
            paddingVertical: vs(10), paddingHorizontal: s(14),
          }}>
            <TouchableOpacity
              onPress={toggleAccepted}
              activeOpacity={0.8}
              style={{
                width: s(20), height: s(20), borderRadius: s(5), borderWidth: 2,
                borderColor: accepted ? "transparent" : "rgba(255,255,255,0.35)",
                backgroundColor: accepted ? Colors.accentPinkDeep : "rgba(255,255,255,0.08)",
                alignItems: "center", justifyContent: "center", marginRight: s(10),
                shadowColor: accepted ? Colors.accentPinkDeep : "transparent",
                shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8,
              }}
            >
              {accepted && <FontAwesome name="check" size={ms(10)} color="white" />}
            </TouchableOpacity>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: ms(12), flex: 1, lineHeight: ms(18) }}>
              I agree to the{" "}
              <Text style={{ color: Colors.hotPink, fontWeight: "700" }} onPress={() => router.push("/terms-of-use")}>
                Terms and Conditions
              </Text>
              {" "}and{" "}
              <Text style={{ color: Colors.hotPink, fontWeight: "700" }} onPress={() => router.push("/privacy-policy")}>
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
  width: s(54), height: s(54), borderRadius: s(27),
  backgroundColor: "rgba(255,255,255,0.08)",
  borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  alignItems: "center", justifyContent: "center",
  shadowColor: "#000", shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25, shadowRadius: 12, elevation: 5,
};
