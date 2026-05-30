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

        {/* Intro */}
        <Text style={styles.body}>
          Welcome to Tuk Tuk (the "Platform" or "App"). These Terms of Service (the "Terms") constitute a legally binding agreement between you ("You" or "User") and Tuk Tuk, the owner and operator of the Platform and App. By accessing or using the Platform or any of its services, features, or content, you acknowledge that you have read, understood, and agree to be bound by these Terms.
        </Text>
        <Text style={[styles.body, { marginTop: 12 }]}>
          This agreement outlines your rights and obligations as a user of the Platform, as well as the terms under which we provide access to and services through the App. Whether you are a registered user, a guest, or simply browsing the Platform, these Terms govern your use of Tuk Tuk, and by continuing to use or access the App, you agree to comply with all its provisions.
        </Text>
        <Text style={[styles.body, { marginTop: 12 }]}>
          If you do not agree with any part of these Terms, you must stop using the Platform and exit the App immediately. We also recommend that you review our Privacy Policy, which outlines how we collect, use, and protect your personal data.
        </Text>

        {/* 1. Special Notices */}
        <Text style={styles.sectionTitle}>1. Special Notices</Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>1.1 </Text>This Tuk Tuk User Agreement (this "Agreement") governs your usage of our services (hereinafter, "Services"). For the purposes of this Agreement, you and Tuk Tuk will be jointly referred to as the "Parties" and respectively as a "Party".
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>1.2 </Text>By using our Services or by clicking on "Sign Up" during the registration process, you agree to all terms of this Agreement. We, at our sole discretion, may revise this Agreement from time to time, and the current version will be found at: About us &gt; User Agreement. By continuing to avail our Services, you agree to be bound by the revised Agreement.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>1.3 </Text>You may only use our Service if you are 16 years or older and if you are not subject to a statutory age limit to enter into this Agreement according to the applicable laws and regulations in your country. If you are below the aforementioned minimum age, you may only use Tuk Tuk if your guardian has provided us with valid consent. You may not falsely claim that you have reached the minimum age.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>1.4 </Text>You shall be solely responsible for the safekeeping of your Tuk Tuk account and password. All behaviors and activities conducted through your Tuk Tuk account will be deemed as your behaviors and activities for which you shall be solely responsible.
        </Text>

        {/* 2. Services Content */}
        <Text style={styles.sectionTitle}>2. Services Content</Text>
        <Text style={styles.body}>
          Tuk Tuk reserves the right to change the content of its Services at its discretion, with or without notice. Some of the Services may require payment, and if you choose not to pay, Tuk Tuk is not obligated to provide those Services to you. Tuk Tuk may need to perform repairs or maintenance, and if this causes an interruption in paid Services, Tuk Tuk is not liable but will provide notice. Tuk Tuk can suspend, terminate, or restrict Services if you are underage, violate the Terms of Use (including harassment, posting sexual, religious or political content, or using abusive language), or fail to make a payment.
        </Text>

        {/* 3. Privacy */}
        <Text style={styles.sectionTitle}>3. Privacy</Text>
        <Text style={styles.body}>
          You acknowledge that you have read, understood, and agree to our Privacy Policy, which outlines how we collect, use, store, and protect your personal data. The Privacy Policy provides detailed information about the types of data we collect, how we use it to improve our services, and the measures we take to ensure your information is kept secure. It also explains your rights regarding your personal data, such as access, correction, and deletion requests, as well as how we share your information with third parties, if applicable.
        </Text>
        <Text style={[styles.body, { marginTop: 10 }]}>
          If you have any questions, concerns, or require further clarification regarding how your data is handled, please contact us at{" "}
          <Text style={styles.link}>support@tuktuk.in</Text>
        </Text>

        {/* 4. Paid Services */}
        <Text style={styles.sectionTitle}>4. Paid Services</Text>
        <Text style={styles.body}>
          The App offers certain paid services, features, and content that are available for purchase, including premium features, virtual items, and other offerings designed to enhance your user experience. By purchasing any Paid Services, you agree to comply with the terms outlined in this Agreement. Payments will be processed through our designated third-party payment processor, and you authorize us to charge your selected payment method for the applicable fees.
        </Text>
        <Text style={[styles.body, { marginTop: 10 }]}>
          Please note that all payments for Paid Services are non-refundable, except as required by applicable law. Once a payment is processed, it cannot be refunded, even if you stop using the service or choose to delete your account. Additionally, we reserve the right to modify, suspend, or discontinue any Paid Services, including altering pricing, features, or availability.
        </Text>

        {/* 5. Terminating Services */}
        <Text style={styles.sectionTitle}>5. Terminating Services</Text>
        <Text style={styles.body}>
          You have the right to terminate your use of Tuk Tuk Services and this Agreement at any time by revoking or deleting your Tuk Tuk account. Upon termination, you will no longer have access to the features and services provided by the App, and any data associated with your account may be deleted or restricted, subject to our data retention policies as outlined in our Privacy Policy.
        </Text>

        {/* 6. Disclaimers */}
        <Text style={styles.sectionTitle}>6. Disclaimers</Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>6.1 </Text>You are solely responsible for any risks associated with using Tuk Tuk Services. Any use or reliance on Tuk Tuk Services is done at your own risk.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>6.2 </Text>Tuk Tuk does not guarantee that the Services will meet your requirements or that they will be uninterrupted. The timeliness, security, and accuracy of the Services are not guaranteed. The Services are provided on an "as is" basis. Tuk Tuk makes no representations or warranties, whether express or implied, regarding the operation and provision of the Services.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>6.3 </Text>Tuk Tuk does not guarantee the accuracy and integrity of any external links that may be accessed through the Services. Tuk Tuk shall not be responsible for the content of any linked site or any link contained therein, and shall not be held liable, directly or indirectly, for any loss or damage incurred through your use of the Services.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>6.4 </Text>Tuk Tuk shall not be liable for any interruptions or deficiencies in the Services caused by force majeure or circumstances beyond the control of Tuk Tuk. However, to the extent possible, Tuk Tuk will make reasonable efforts to minimize any resulting losses or impact on you.
        </Text>

        {/* 7. Content */}
        <Text style={styles.sectionTitle}>7. Content</Text>
        <Text style={styles.subSectionTitle}>7.1 Tuk Tuk Content</Text>
        <Text style={styles.body}>
          The content, software, images, text, graphics, and other materials on Tuk Tuk are either owned or licensed by Tuk Tuk. Unauthorized use of the Tuk Tuk content or materials is strictly prohibited without prior written consent from Tuk Tuk or its licensors. All rights not expressly granted are reserved.
        </Text>
        <Text style={[styles.body, { marginTop: 10 }]}>
          Subject to these Terms, you are granted a non-exclusive, limited, non-transferable, non-sublicensable, revocable, worldwide license to access and use the Services solely for your personal, non-commercial use. Tuk Tuk reserves all rights not expressly granted herein. You acknowledge that we have no obligation to pre-screen, monitor, review, or edit any content posted by you and other users on the Services.
        </Text>
        <Text style={styles.subSectionTitle}>7.2 User-Generated Content</Text>
        <Text style={styles.body}>
          Users may be permitted to upload, post, or transmit content through the Services including text, photographs, videos, sound recordings, and other media ("User Content"). You or the owner of your User Content retain copyright, but by submitting User Content via the Services, you hereby grant Tuk Tuk an unconditional, irrevocable, non-exclusive, royalty-free, fully transferable, perpetual worldwide license to use, modify, adapt, reproduce, publish, and distribute your User Content on any platform.
        </Text>
        <Text style={[styles.body, { marginTop: 10 }]}>
          Any User Content will be considered non-confidential and non-proprietary. You must not post any User Content that you consider confidential or proprietary. When you submit User Content, you represent that you own it or have received all necessary permissions from the owner.
        </Text>

        {/* 8. Prohibited User Content and Behavior */}
        <Text style={styles.sectionTitle}>8. Prohibited Content & Behavior</Text>
        <Text style={styles.body}>While we encourage creativity and self-expression, the following are strictly prohibited:</Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Illegal Content:</Text> Content that is illegal or promotes illegal activities.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Harmful or Offensive Content:</Text> Abusive, harassing, defamatory, threatening content, hate speech, or material promoting violence or discrimination.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Intellectual Property Infringement:</Text> Content that infringes copyrights, trademarks, or other protected materials without permission.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Spamming or Fraud:</Text> Phishing, deceptive activities, unauthorized promotion of products, or financial fraud.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Malicious Software:</Text> Content containing viruses, malware, or harmful code.</Text>
          <Text style={styles.bulletItem}>• <Text style={styles.bulletLabel}>Impersonation:</Text> Impersonating other users, streamers, or Tuk Tuk employees, or providing false information.</Text>
        </View>
        <Text style={[styles.body, { marginTop: 10 }]}>
          To report inappropriate or harmful content, contact us through the Tuk Tuk App Feedback section in Settings or at{" "}
          <Text style={styles.link}>support@tuktuk.in</Text>. We reserve the right to remove violating content and suspend or terminate accounts of repeat offenders.
        </Text>

        {/* 9. Prohibition of CSAE */}
        <Text style={styles.sectionTitle}>9. Prohibition of CSAE</Text>
        <Text style={styles.body}>
          We firmly oppose and strictly prohibit any form of Child Sexual Abuse Material (CSAE) on our platform. Users are not allowed to upload, distribute, solicit, or otherwise engage with any content that involves the sexual abuse or exploitation of children. This includes, but is not limited to, images, videos, text descriptions, or any other media that depicts or implies such illegal and immoral activities.
        </Text>
        <Text style={[styles.body, { marginTop: 10 }]}>
          If we become aware of any such content, we will immediately remove it and take appropriate actions against the responsible users, including account suspension, termination, and cooperation with law enforcement agencies. Please note that the possession and distribution of CSAE is a serious criminal offense in many jurisdictions, and we will not tolerate any behavior that violates the rights and safety of children on our platform.
        </Text>

        {/* 10. Other Terms */}
        <Text style={styles.sectionTitle}>10. Other Terms</Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>10.1 </Text>This Agreement constitutes the entire agreement between both parties. Other than as stipulated by this Agreement, no other rights are vested in either Party.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>10.2 </Text>If any provision of this Agreement is rendered void or unenforceable by competent authorities, in whole or in part, for any reason, the remaining provisions of this Agreement shall remain valid and binding.
        </Text>
        <Text style={styles.subPoint}>
          <Text style={styles.subNum}>10.3 </Text>The headings within this Agreement have been set for the sake of convenience, and shall be disregarded in the interpretation of this Agreement.
        </Text>

        {/* 11. Contact Us */}
        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.body}>
          If you have any questions, concerns, or feedback regarding this Agreement, our Services, or any other aspect of the App, we are here to assist you.
        </Text>
        <View style={styles.contactBox}>
          <Text style={styles.contactRow}>📧  <Text style={styles.link}>support@tuktuk.in</Text></Text>
          <Text style={styles.contactRow}>🌐  <Text style={styles.link}>https://www.tuktuk.in</Text></Text>
        </View>
        <Text style={[styles.body, { marginTop: 12, marginBottom: 8 }]}>
          We strive to respond to all inquiries as quickly as possible. Please provide clear details about your request so that we can assist you effectively.
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
    paddingBottom: 56,
  },
  sectionTitle: {
    color: "#ff69b4",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  subSectionTitle: {
    color: "#c084fc",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 14,
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 22,
  },
  subPoint: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 22,
    marginTop: 8,
  },
  subNum: {
    color: "#a78bfa",
    fontWeight: "700",
  },
  bulletList: {
    marginTop: 10,
    gap: 8,
  },
  bulletItem: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 22,
  },
  bulletLabel: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "600",
  },
  link: {
    color: "#a78bfa",
    textDecorationLine: "underline",
  },
  contactBox: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 10,
    padding: 14,
    marginTop: 12,
    gap: 8,
  },
  contactRow: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 13,
    lineHeight: 22,
  },
});
