import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft } from "lucide-react-native";

export default function TermsOfUse() {
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
        <Text style={styles.headerTitle}>Terms of Use</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using Tuk Tuk, you agree to be bound by these Terms of Use. If you do not agree, please do not use the app.
        </Text>
        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years old to use Tuk Tuk. By using the app, you confirm that you meet this requirement.
        </Text>
        <Text style={styles.sectionTitle}>3. User Conduct</Text>
        <Text style={styles.body}>
          You agree not to use the platform for any unlawful purpose, to harass other users, or to post inappropriate content. Violations may result in account suspension.
        </Text>
        <Text style={styles.sectionTitle}>4. Content</Text>
        <Text style={styles.body}>
          You retain ownership of content you post, but grant Tuk Tuk a license to display and distribute it within the platform.
        </Text>
        <Text style={styles.sectionTitle}>5. Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your account at any time for violations of these terms.
        </Text>
        <Text style={styles.sectionTitle}>6. Changes to Terms</Text>
        <Text style={styles.body}>
          We may update these terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms.
        </Text>
        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.body}>
          For questions about these terms, contact us at support@tuktuk.app
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
