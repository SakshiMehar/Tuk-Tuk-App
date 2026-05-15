import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#070616", "#110d2f", "#150f3d"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.body}>
          We collect information you provide directly, such as your name, phone number, and profile photo. We also collect usage data to improve the app experience.
        </Text>
        <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
        <Text style={styles.body}>
          Your information is used to provide and improve our services, personalize your experience, and communicate with you about updates and offers.
        </Text>
        <Text style={styles.sectionTitle}>3. Sharing of Information</Text>
        <Text style={styles.body}>
          We do not sell your personal data. We may share data with trusted service providers who assist in operating the platform, subject to confidentiality agreements.
        </Text>
        <Text style={styles.sectionTitle}>4. Data Security</Text>
        <Text style={styles.body}>
          We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
        </Text>
        <Text style={styles.sectionTitle}>5. Your Rights</Text>
        <Text style={styles.body}>
          You have the right to access, correct, or delete your personal data at any time through your account settings or by contacting us.
        </Text>
        <Text style={styles.sectionTitle}>6. Cookies & Tracking</Text>
        <Text style={styles.body}>
          We use analytics tools to understand how users interact with the app. You can opt out of analytics tracking in your device settings.
        </Text>
        <Text style={styles.sectionTitle}>7. Contact Us</Text>
        <Text style={styles.body}>
          For privacy-related questions, reach us at privacy@tuktuk.app
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070616" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  content: {
    padding: 20,
    paddingBottom: 48,
  },
  sectionTitle: {
    color: "#ff69b4",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 22,
  },
});
