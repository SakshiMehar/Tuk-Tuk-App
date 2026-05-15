import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";

export default function EnterMobile() {
  const router = useRouter();
  const [phone, setPhone] = useState("");

  const handleContinue = () => {
    if (phone.length < 8) {
      Alert.alert("Invalid", "Please enter a valid phone number.");
      return;
    }
    router.push("/verify-otp");
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
        <Text style={styles.title}>Enter your number</Text>
        <Text style={styles.subtitle}>
          We'll send a verification code to confirm your identity.
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.countryCode}>
            <Text style={styles.countryCodeText}>🌐 +1</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            placeholderTextColor="rgba(255,255,255,0.35)"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={15}
          />
        </View>

        <TouchableOpacity
          style={styles.continueBtn}
          activeOpacity={0.85}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={["#ff4ea3", "#8f56ff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueBtnGradient}
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070616" },
  orbPink: {
    position: "absolute",
    width: 280,
    height: 280,
    top: -60,
    left: -60,
    borderRadius: 140,
    backgroundColor: "rgba(255,77,166,0.18)",
  },
  orbPurple: {
    position: "absolute",
    width: 300,
    height: 300,
    bottom: 80,
    right: -80,
    borderRadius: 150,
    backgroundColor: "rgba(132,66,255,0.16)",
  },
  header: {
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 36,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  countryCode: {
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  countryCodeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    color: "white",
    fontSize: 16,
  },
  continueBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  continueBtnGradient: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  continueBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
