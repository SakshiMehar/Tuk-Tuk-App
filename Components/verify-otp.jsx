import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";
import { verifyOtp, sendOtp } from "../src/api/authApi";
import { saveSession } from "../src/store/authStore";

export default function VerifyOtp() {
  const router = useRouter();
  const { phone } = useLocalSearchParams();          // passed from enter-mobile
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef([]);

  const handleChange = (val, idx) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Invalid", "Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(phone, code);
      // data = { token, user }
      await saveSession(data.token, data.user);
      router.replace("/(tabs)/home");
    } catch (err) {
      Alert.alert("Verification Failed", err.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    setResending(true);
    try {
      await sendOtp(phone);
      Alert.alert("Sent", "A new OTP has been sent to your number.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } catch (err) {
      Alert.alert("Error", err.message || "Failed to resend OTP.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#070616" />
      <LinearGradient
        colors={["#070616", "#110d2f", "#150f3d"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code we sent to{"\n"}
          <Text style={styles.phoneHighlight}>{phone || "your phone"}</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, idx) => (
            <TextInput
              key={idx}
              ref={(r) => (inputs.current[idx] = r)}
              style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
              value={digit}
              onChangeText={(v) => handleChange(v, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor="#ff4ea3"
              editable={!loading}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, loading && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={handleVerify}
          disabled={loading}
        >
          <LinearGradient
            colors={["#ff4ea3", "#8f56ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.verifyBtnGradient}
          >
            {loading
              ? <ActivityIndicator color="white" />
              : <Text style={styles.verifyBtnText}>Verify & Continue</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
          <Text style={styles.resendText}>
            Didn't receive it?{" "}
            {resending
              ? <Text style={styles.resendLink}>Sending...</Text>
              : <Text style={styles.resendLink}>Resend code</Text>}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070616" },
  orbPink: {
    position: "absolute", width: 280, height: 280, top: -60, left: -60,
    borderRadius: 140, backgroundColor: "rgba(255,77,166,0.18)",
  },
  orbPurple: {
    position: "absolute", width: 300, height: 300, bottom: 80, right: -80,
    borderRadius: 150, backgroundColor: "rgba(132,66,255,0.16)",
  },
  header: { paddingTop: 52, paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { color: "white", fontSize: 28, fontWeight: "800", marginBottom: 10 },
  subtitle: {
    color: "rgba(255,255,255,0.6)", fontSize: 14,
    lineHeight: 22, marginBottom: 36,
  },
  phoneHighlight: { color: "#ff69b4", fontWeight: "700" },
  otpRow: {
    flexDirection: "row", gap: 10, marginBottom: 32, justifyContent: "center",
  },
  otpBox: {
    width: 48, height: 56, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
    color: "white", fontSize: 22, fontWeight: "700",
  },
  otpBoxFilled: {
    borderColor: "#ff4ea3", backgroundColor: "rgba(255,78,163,0.12)",
  },
  verifyBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 20 },
  verifyBtnGradient: {
    height: 54, alignItems: "center", justifyContent: "center", borderRadius: 14,
  },
  verifyBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
  resendBtn: { alignItems: "center" },
  resendText: { color: "rgba(255,255,255,0.55)", fontSize: 13 },
  resendLink: { color: "#ff69b4", fontWeight: "700" },
});
