import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  Image,
  Switch,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const settingSections = [
  {
    id: "account",
    items: [
      { icon: "person-circle-outline", label: "Account", type: "route", route: "account" },
      { icon: "options-outline", label: "Match switch", type: "action" },
      { icon: "shield-checkmark-outline", label: "Privacy", type: "action" },
      { icon: "notifications-outline", label: "Notifications", type: "action" },
      { icon: "chatbubble-outline", label: "Message Notification", type: "action" },
      { icon: "person-remove-outline", label: "Blocked list", type: "action" },
      { icon: "language-outline", label: "System language", type: "action" },
      { icon: "earth-outline", label: "Content Language", type: "action" },
      { icon: "share-social-outline", label: "Share app", type: "action" },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [
      { icon: "refresh-circle-outline", label: "Check for update", type: "action" },
      { icon: "help-circle-outline", label: "Help & feedback", type: "action" },
      { icon: "document-text-outline", label: "Privacy policy", type: "route", route: "privacy-policy" },
      { icon: "book-outline", label: "Terms of use", type: "route", route: "terms-of-use" },
      { icon: "information-circle-outline", label: "About", type: "action" },
    ],
  },
  {
    id: "cache",
    title: "Storage",
    items: [
      { icon: "trash-outline", label: "Clear cache", type: "action", subtitle: "22.21M" },
      { icon: "chatbubbles-outline", label: "Clear chat cache", type: "action" },
    ],
  },
];

export default function Settings() {
  const router = useRouter();
  const [cacheSize] = useState("22.21M");
  const [matchSwitchVisible, setMatchSwitchVisible] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [notificationOption, setNotificationOption] = useState("All notifications");
  const [systemLanguageVisible, setSystemLanguageVisible] = useState(false);
  const [contentLanguageVisible, setContentLanguageVisible] = useState(false);
  const [shareAppVisible, setShareAppVisible] = useState(false);

  // Match switch state
  const [matchSwitchEnabled, setMatchSwitchEnabled] = useState(false);

  // Privacy settings states
  const [preventFollowing, setPreventFollowing] = useState(false);
  const [chatPermission, setChatPermission] = useState("Everyone");
  const [mysteriousVisitor, setMysteriousVisitor] = useState(false);

  // Language states
  const [systemLanguage, setSystemLanguage] = useState("English");
  const [contentLanguage, setContentLanguage] = useState("English");

  const languages = ["English", "Spanish", "French", "German", "Chinese", "Japanese", "Arabic", "Hindi"];

  // Support section modals
  const [checkUpdateVisible, setCheckUpdateVisible] = useState(false);
  const [updateChecking, setUpdateChecking] = useState(false);
  const [updateChecked, setUpdateChecked] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    { id: 1, q: "How do I match with someone?", a: "Enable your Match switch in Settings and browse nearby profiles. Tap the heart icon to send a match request!" },
    { id: 2, q: "Why is my location not working?", a: "Make sure location permissions are enabled for Tuk-Tuk in your device Settings > Apps > Tuk-Tuk > Permissions." },
    { id: 3, q: "How do I report a user?", a: "Open the user's profile, tap the three-dot menu in the top right, then select 'Report'. We review all reports within 24 hours." },
    { id: 4, q: "Can I use Tuk-Tuk without sharing my location?", a: "Location is required for the matching and nearby features. You can set your profile to private mode to limit visibility." },
  ];

  const handleCheckUpdate = () => {
    setUpdateChecking(true);
    setUpdateChecked(false);
    setTimeout(() => {
      setUpdateChecking(false);
      setUpdateChecked(true);
    }, 2200);
  };

  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSent(true);
    setFeedbackText("");
    setTimeout(() => setFeedbackSent(false), 3000);
  };

  const handleItemPress = (item) => {
    if (item.type === "route") {
      if (item.route) {
        router.push(`/${item.route}`);
      }
      return;
    }

    switch (item.label) {
      case "Match switch":
        setMatchSwitchVisible(true);
        break;
      case "Privacy":
        setPrivacyVisible(true);
        break;
      case "Notifications":
        setNotificationsVisible(true);
        break;
      case "Message Notification":
        router.push("/message-notification");
        break;
      case "Blocked list":
        router.push("/blocked-accounts");
        break;
      case "System language":
        setSystemLanguageVisible(true);
        break;
      case "Content Language":
        setContentLanguageVisible(true);
        break;
      case "Share app":
        setShareAppVisible(true);
        break;
      case "Check for update":
        setUpdateChecked(false);
        setUpdateChecking(false);
        setCheckUpdateVisible(true);
        break;
      case "Help & feedback":
        setHelpVisible(true);
        break;
      case "About":
        setAboutVisible(true);
        break;
      case "Clear cache":
        Alert.alert("Clear cache", "Cache cleared successfully.");
        break;
      case "Clear chat cache":
        Alert.alert("Clear chat cache", "Chat cache cleared successfully.");
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0618" />
      <LinearGradient
        colors={["#1a0a2e", "#16082a", "#0d0618", "#1a0a2e", "#2d1b4e"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Customize your app preferences.</Text>

        {settingSections.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            {section.items.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={styles.settingItem}
                activeOpacity={0.75}
                onPress={() => handleItemPress(item)}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons name={item.icon} size={18} color="#d8cbff" />
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.subtitle ? (
                      <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.45)" />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.sectionCard, styles.dangerButton]}
          activeOpacity={0.8}
          onPress={() => Alert.alert("Log out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            { text: "Log out", style: "destructive", onPress: () => router.replace("/login") },
          ])}
        >
          <Text style={styles.dangerText}>Log out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionCard, styles.deleteButton]}
          activeOpacity={0.8}
          onPress={() => Alert.alert("Delete account", "This action cannot be undone.")}
        >
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── MATCH SWITCH MODAL ── */}
      <Modal
        visible={matchSwitchVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMatchSwitchVisible(false)}
      >
        <View style={styles.matchSwitchOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMatchSwitchVisible(false)}
          />
          <View style={styles.matchSwitchContainer}>
            <LinearGradient
              colors={["#1e0a3c", "#2d1b4e", "#1a0a2e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.matchSwitchContent}
            >
              {/* Phone Frame */}
              <View style={styles.phoneFrame}>
                <LinearGradient
                  colors={["#a18cffff", "#7c4dffff"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.phoneFrameGradient}
                >
                  {/* Phone notch */}
                  <View style={styles.phoneNotch} />

                  {/* Profile display area */}
                  <View style={styles.profileDisplayArea}>
                    <View style={styles.profileCircle}>
                      <Image
                        source={{ uri: "https://randomuser.me/api/portraits/women/32.jpg" }}
                        style={styles.profileImage}
                      />
                    </View>
                  </View>
                </LinearGradient>
              </View>

              {/* Close button */}
              <TouchableOpacity
                style={styles.closeButtonMatch}
                activeOpacity={0.8}
                onPress={() => setMatchSwitchVisible(false)}
              >
                <Text style={styles.closeButtonMatchText}>Close</Text>
              </TouchableOpacity>

              {/* Match Switch Toggle */}
              <View style={styles.matchSwitchToggleSection}>
                <Text style={styles.matchSwitchTitle}>Match switch</Text>
                <Text style={styles.matchSwitchDescription}>
                  Close will not match people for you.
                </Text>
                <Switch
                  style={styles.toggleSwitch}
                  value={matchSwitchEnabled}
                  onValueChange={setMatchSwitchEnabled}
                  trackColor={{ false: "#ccc", true: "#7c4dff" }}
                  thumbColor={matchSwitchEnabled ? "#fff" : "#f4f3f4"}
                />
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── NOTIFICATIONS BOTTOM SHEET ── */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.notificationsOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setNotificationsVisible(false)} />
          <View style={styles.notificationsSheet}>
            <View style={styles.handleBar} />
            {[
              "All notifications",
              "Only message, moments & interaction alerts",
              "Only message alerts",
              "No notifications",
            ].map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionRow, notificationOption === opt && styles.optionSelected]}
                onPress={() => {
                  setNotificationOption(opt);
                  setNotificationsVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionText, notificationOption === opt && styles.optionTextSelected]}>{opt}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelButton} onPress={() => setNotificationsVisible(false)} activeOpacity={0.8}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY MODAL ── */}
      <Modal
        visible={privacyVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPrivacyVisible(false)}
      >
        <View style={styles.privacyOverlay}>
          <TouchableOpacity
            style={styles.privacyBackdrop}
            activeOpacity={1}
            onPress={() => setPrivacyVisible(false)}
          />
          <SafeAreaView style={styles.privacyPanel}>
            <LinearGradient
              colors={["#1a0a2e", "#16082a", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View style={styles.privacyHeader}>
              <Text style={styles.privacyTitle}>Privacy</Text>
              <TouchableOpacity
                onPress={() => setPrivacyVisible(false)}
                style={styles.privacyCloseBtn}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.privacyDivider} />

            {/* Privacy Options */}
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Prevent following into room */}
              <View style={styles.privacyOptionItem}>
                <View style={styles.privacyOptionLeft}>
                  <Text style={styles.privacyOptionLabel}>Prevent following into room</Text>
                  <Text style={styles.privacyOptionValue}>
                    {preventFollowing ? "On" : "Off"}
                  </Text>
                </View>
                <Switch
                  value={preventFollowing}
                  onValueChange={setPreventFollowing}
                  trackColor={{ false: "#ccc", true: "#7c4dff" }}
                  thumbColor={preventFollowing ? "#fff" : "#f4f3f4"}
                />
              </View>

              {/* Who can chat to me */}
              <TouchableOpacity
                style={styles.privacyOptionItem}
                activeOpacity={0.7}
                onPress={() =>
                  Alert.alert(
                    "Who can chat to me?",
                    "Select who can send you messages",
                    [
                      {
                        text: "Everyone",
                        onPress: () => setChatPermission("Everyone"),
                      },
                      {
                        text: "Friends only",
                        onPress: () => setChatPermission("Friends only"),
                      },
                      {
                        text: "Nobody",
                        onPress: () => setChatPermission("Nobody"),
                      },
                      { text: "Cancel", style: "cancel" },
                    ]
                  )
                }
              >
                <View style={styles.privacyOptionLeft}>
                  <Text style={styles.privacyOptionLabel}>Who can chat to me?</Text>
                  <Text style={styles.privacyOptionValue}>{chatPermission}</Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="rgba(255,255,255,0.5)"
                />
              </TouchableOpacity>

              {/* Mysterious Visitor */}
              <View style={styles.privacyOptionItem}>
                <View style={styles.privacyOptionLeft}>
                  <Text style={styles.privacyOptionLabel}>Mysterious Visitor</Text>
                  <Text style={styles.privacyOptionValue}>
                    {mysteriousVisitor ? "On" : "Off"}
                  </Text>
                </View>
                <Switch
                  value={mysteriousVisitor}
                  onValueChange={setMysteriousVisitor}
                  trackColor={{ false: "#ccc", true: "#7c4dff" }}
                  thumbColor={mysteriousVisitor ? "#fff" : "#f4f3f4"}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── SYSTEM LANGUAGE MODAL ── */}
      <Modal
        visible={systemLanguageVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSystemLanguageVisible(false)}
      >
        <View style={styles.languageOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSystemLanguageVisible(false)} />
          <View style={styles.languageSheet}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>System Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.languageOption, systemLanguage === lang && styles.languageOptionSelected]}
                onPress={() => {
                  setSystemLanguage(lang);
                  setSystemLanguageVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.languageOptionText, systemLanguage === lang && styles.languageOptionTextSelected]}>{lang}</Text>
                {systemLanguage === lang && <Ionicons name="checkmark" size={20} color="#a78bfa" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.langCancelButton} onPress={() => setSystemLanguageVisible(false)} activeOpacity={0.8}>
              <Text style={styles.langCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CONTENT LANGUAGE MODAL ── */}
      <Modal
        visible={contentLanguageVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setContentLanguageVisible(false)}
      >
        <View style={styles.languageOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setContentLanguageVisible(false)} />
          <View style={styles.languageSheet}>
            <View style={styles.handleBar} />
            <Text style={styles.sheetTitle}>Content Language</Text>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[styles.languageOption, contentLanguage === lang && styles.languageOptionSelected]}
                onPress={() => {
                  setContentLanguage(lang);
                  setContentLanguageVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.languageOptionText, contentLanguage === lang && styles.languageOptionTextSelected]}>{lang}</Text>
                {contentLanguage === lang && <Ionicons name="checkmark" size={20} color="#a78bfa" />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.langCancelButton} onPress={() => setContentLanguageVisible(false)} activeOpacity={0.8}>
              <Text style={styles.langCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── CHECK FOR UPDATE MODAL ── */}
      <Modal
        visible={checkUpdateVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCheckUpdateVisible(false)}
      >
        <View style={styles.updateOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setCheckUpdateVisible(false)} />
          <View style={styles.updateContainer}>
            <LinearGradient
              colors={["#1e0a3c", "#2d1b4e", "#1a0a2e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.updateContent}
            >
              {/* Icon area */}
              <LinearGradient
                colors={["#7c4dff", "#a78bfa"]}
                style={styles.updateIconCircle}
              >
                {updateChecked
                  ? <Ionicons name="checkmark-circle" size={42} color="white" />
                  : <Ionicons name="rocket-outline" size={42} color="white" />}
              </LinearGradient>

              <Text style={styles.updateTitle}>
                {updateChecked ? "You're up to date!" : "Check for Update"}
              </Text>

              {/* Version badge */}
              <View style={styles.versionBadge}>
                <Ionicons name="phone-portrait-outline" size={14} color="#a78bfa" />
                <Text style={styles.versionText}>Current version  v1.0.0</Text>
              </View>

              {updateChecked ? (
                <Text style={styles.updateSubtext}>
                  Tuk-Tuk is running the latest version. We'll notify you when a new update is available.
                </Text>
              ) : (
                <Text style={styles.updateSubtext}>
                  Tap below to check if a newer version of Tuk-Tuk is available for your device.
                </Text>
              )}

              {updateChecking ? (
                <View style={styles.updateCheckingRow}>
                  <ActivityIndicator color="#a78bfa" size="small" />
                  <Text style={styles.updateCheckingText}>Checking for updates...</Text>
                </View>
              ) : updateChecked ? (
                <View style={styles.updateSuccessRow}>
                  <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
                  <Text style={styles.updateSuccessText}>Latest version installed</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.updateButton} onPress={handleCheckUpdate} activeOpacity={0.8}>
                  <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.updateButtonGradient}>
                    <Ionicons name="refresh" size={18} color="white" />
                    <Text style={styles.updateButtonText}>Check Now</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.updateCloseBtn} onPress={() => setCheckUpdateVisible(false)} activeOpacity={0.8}>
                <Text style={styles.updateCloseBtnText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── HELP & FEEDBACK MODAL ── */}
      <Modal
        visible={helpVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.helpOverlay}>
          <TouchableOpacity style={styles.helpBackdrop} activeOpacity={1} onPress={() => setHelpVisible(false)} />
          <SafeAreaView style={styles.helpPanel}>
            <LinearGradient colors={["#1a0a2e", "#16082a", "#0d0618"]} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.helpHeader}>
              <View>
                <Text style={styles.helpTitle}>Help & Feedback</Text>
                <Text style={styles.helpSubtitle}>We're here to help</Text>
              </View>
              <TouchableOpacity onPress={() => setHelpVisible(false)} style={styles.helpCloseBtn}>
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
              {/* FAQ */}
              <Text style={styles.helpSectionLabel}>Frequently Asked Questions</Text>
              {faqs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.faqItem}
                  activeOpacity={0.8}
                  onPress={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                >
                  <View style={styles.faqQuestion}>
                    <Ionicons name="help-circle" size={18} color="#a78bfa" style={{ marginRight: 10 }} />
                    <Text style={styles.faqQuestionText}>{item.q}</Text>
                    <Ionicons
                      name={expandedFaq === item.id ? "chevron-up" : "chevron-down"}
                      size={16}
                      color="rgba(255,255,255,0.45)"
                    />
                  </View>
                  {expandedFaq === item.id && (
                    <View style={styles.faqAnswer}>
                      <Text style={styles.faqAnswerText}>{item.a}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* Contact Support */}
              <Text style={styles.helpSectionLabel}>Contact Support</Text>
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.8}>
                <View style={[styles.contactIcon, { backgroundColor: "rgba(59,130,246,0.15)" }]}>
                  <Ionicons name="mail-outline" size={20} color="#60a5fa" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>Email Support</Text>
                  <Text style={styles.contactValue}>support@tuktukapp.com</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.contactRow} activeOpacity={0.8}>
                <View style={[styles.contactIcon, { backgroundColor: "rgba(37,211,102,0.15)" }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactLabel}>WhatsApp Support</Text>
                  <Text style={styles.contactValue}>Mon – Fri, 9 AM – 6 PM</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
              </TouchableOpacity>

              {/* Feedback Form */}
              <Text style={styles.helpSectionLabel}>Send Feedback</Text>
              <View style={styles.feedbackCard}>
                {feedbackSent ? (
                  <View style={styles.feedbackSentBox}>
                    <Ionicons name="checkmark-circle" size={36} color="#4ade80" />
                    <Text style={styles.feedbackSentText}>Thank you for your feedback!</Text>
                    <Text style={styles.feedbackSentSub}>We read every message and use it to improve Tuk-Tuk.</Text>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.feedbackInput}
                      placeholder="Tell us what's on your mind..."
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      multiline
                      numberOfLines={4}
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      textAlignVertical="top"
                    />
                    <TouchableOpacity
                      style={[styles.feedbackSendBtn, !feedbackText.trim() && { opacity: 0.45 }]}
                      onPress={handleSendFeedback}
                      activeOpacity={0.8}
                      disabled={!feedbackText.trim()}
                    >
                      <LinearGradient colors={["#7c4dff", "#a855f7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.feedbackSendBtnGradient}>
                        <Ionicons name="send" size={16} color="white" />
                        <Text style={styles.feedbackSendBtnText}>Send Feedback</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ── ABOUT MODAL ── */}
      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <View style={styles.aboutOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setAboutVisible(false)} />
          <View style={styles.aboutContainer}>
            <LinearGradient
              colors={["#1e0a3c", "#2d1b4e", "#1a0a2e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aboutContent}
            >
              {/* Close */}
              <TouchableOpacity style={styles.aboutCloseBtn} onPress={() => setAboutVisible(false)} activeOpacity={0.8}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>

              {/* App icon */}
              <LinearGradient colors={["#7c4dff", "#a855f7", "#ec4899"]} style={styles.aboutIconCircle}>
                <Image source={require("../assets/images/android-icon-monochrome.png")} style={styles.aboutIconImage} resizeMode="contain" />
              </LinearGradient>

              <Text style={styles.aboutAppName}>Tuk-Tuk</Text>
              <Text style={styles.aboutTagline}>Connect. Match. Vibe.</Text>

              <View style={styles.aboutVersionRow}>
                <View style={styles.aboutVersionBadge}>
                  <Text style={styles.aboutVersionText}>Version 1.0.0</Text>
                </View>
                <View style={styles.aboutBuildBadge}>
                  <Text style={styles.aboutBuildText}>Build 100</Text>
                </View>
              </View>

              <View style={styles.aboutDivider} />

              <Text style={styles.aboutDescription}>
                Tuk-Tuk is your social companion for meeting new people, joining voice parties, and building genuine connections nearby.
              </Text>

              {/* Stats row */}
              <View style={styles.aboutStatsRow}>
                <View style={styles.aboutStat}>
                  <Text style={styles.aboutStatNumber}>50K+</Text>
                  <Text style={styles.aboutStatLabel}>Users</Text>
                </View>
                <View style={styles.aboutStatDivider} />
                <View style={styles.aboutStat}>
                  <Text style={styles.aboutStatNumber}>120+</Text>
                  <Text style={styles.aboutStatLabel}>Countries</Text>
                </View>
                <View style={styles.aboutStatDivider} />
                <View style={styles.aboutStat}>
                  <Text style={styles.aboutStatNumber}>4.8★</Text>
                  <Text style={styles.aboutStatLabel}>Rating</Text>
                </View>
              </View>

              <View style={styles.aboutDivider} />

              {/* Social links */}
              <Text style={styles.aboutFollowText}>Follow us</Text>
              <View style={styles.aboutSocialRow}>
                <TouchableOpacity style={styles.aboutSocialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-instagram" size={22} color="#e1306c" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.aboutSocialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-twitter" size={22} color="#1DA1F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.aboutSocialBtn} activeOpacity={0.8}>
                  <Ionicons name="logo-tiktok" size={22} color="white" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.aboutSocialBtn} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={22} color="#a78bfa" />
                </TouchableOpacity>
              </View>

              <Text style={styles.aboutCopyright}>© 2025 Tuk-Tuk Inc. All rights reserved.</Text>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* ── SHARE APP MODAL ── */}
      <Modal
        visible={shareAppVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setShareAppVisible(false)}
      >
        <View style={styles.shareOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setShareAppVisible(false)} />
          <View style={styles.shareContainer}>
            <LinearGradient
              colors={["#1e0a3c", "#2d1b4e", "#1a0a2e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.shareContent}
            >
              <Text style={styles.shareTitle}>Share Tuk-Tuk App</Text>
              <Text style={styles.shareDescription}>Invite your friends to join Tuk-Tuk</Text>

              <View style={styles.shareButtonsGrid}>
                <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
                  <View style={styles.shareButtonIcon}>
                    <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                  </View>
                  <Text style={styles.shareButtonLabel}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
                  <View style={styles.shareButtonIcon}>
                    <Ionicons name="logo-facebook" size={28} color="#1877F2" />
                  </View>
                  <Text style={styles.shareButtonLabel}>Facebook</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
                  <View style={styles.shareButtonIcon}>
                    <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
                  </View>
                  <Text style={styles.shareButtonLabel}>Twitter</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.shareButton} activeOpacity={0.8}>
                  <View style={styles.shareButtonIcon}>
                    <Ionicons name="mail" size={28} color="#a78bfa" />
                  </View>
                  <Text style={styles.shareButtonLabel}>Email</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.shareCloseButton} onPress={() => setShareAppVisible(false)} activeOpacity={0.8}>
                <Text style={styles.shareCloseText}>Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0618",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  screenTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    marginBottom: 14,
  },
  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionTitle: {
    color: "#c4b5fd",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "rgba(124,77,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTextWrap: {
    flex: 1,
  },
  itemLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
  itemSubtitle: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 4,
  },
  dangerButton: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  dangerText: {
    color: "#ff6b81",
    fontSize: 16,
    fontWeight: "800",
    padding: 14,
  },
  deleteButton: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  deleteText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    fontWeight: "700",
    padding: 14,
  },

  // ── MATCH SWITCH MODAL ──
  matchSwitchOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  matchSwitchContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(26, 10, 46, 0.9)",
  },
  matchSwitchContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  phoneFrame: {
    width: 200,
    height: 340,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 28,
    borderWidth: 10,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  phoneFrameGradient: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: "center",
  },
  phoneNotch: {
    width: 120,
    height: 24,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
    marginBottom: 12,
  },
  profileDisplayArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  profileCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 56,
  },
  closeButtonMatch: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginBottom: 32,
  },
  closeButtonMatchText: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "700",
  },
  matchSwitchToggleSection: {
    width: "100%",
    alignItems: "center",
    gap: 14,
  },
  matchSwitchTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
  },
  matchSwitchDescription: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  toggleSwitch: {
    marginTop: 16,
    transform: [{ scaleX: 1.3 }, { scaleY: 1.3 }],
  },

  // ── PRIVACY MODAL ──
  privacyOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  privacyBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  privacyPanel: {
    height: "85%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  privacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 14,
  },
  privacyTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  privacyCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  privacyDivider: {
    height: 1,
    backgroundColor: "rgba(124,77,255,0.2)",
    marginHorizontal: 16,
  },
  privacyOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  privacyOptionLeft: {
    flex: 1,
    marginRight: 12,
  },
  privacyOptionLabel: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  privacyOptionValue: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontWeight: "500",
  },
  notificationsOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  notificationsSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 12,
    paddingBottom: 26,
    paddingHorizontal: 18,
    minHeight: 260,
  },
  handleBar: {
    width: 56,
    height: 6,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.08)",
    alignSelf: "center",
    marginBottom: 14,
  },
  optionRow: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
    color: "#111",
    textAlign: "center",
  },
  optionSelected: {
    backgroundColor: "rgba(124,77,255,0.06)",
  },
  optionTextSelected: {
    color: "#7c4dff",
    fontWeight: "800",
  },
  cancelButton: {
    marginTop: 12,
    backgroundColor: "#f3f4f6",
    paddingVertical: 14,
    borderRadius: 26,
    alignItems: "center",
  },
  cancelText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },

  // ── SYSTEM/CONTENT LANGUAGE MODALS ──
  languageOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  languageSheet: {
    backgroundColor: "rgba(26, 10, 46, 0.95)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 26,
    paddingHorizontal: 18,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderTopColor: "rgba(124,77,255,0.3)",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "white",
    marginBottom: 18,
    textAlign: "center",
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  languageOptionText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },
  languageOptionSelected: {
    backgroundColor: "rgba(124, 77, 255, 0.12)",
  },
  languageOptionTextSelected: {
    color: "#a78bfa",
    fontWeight: "800",
  },
  langCancelButton: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  langCancelText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── SHARE APP MODAL ──
  shareOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  shareContainer: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 28,
    overflow: "hidden",
  },
  shareContent: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  shareTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "white",
    marginBottom: 8,
  },
  shareDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 28,
  },
  shareButtonsGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    marginBottom: 24,
  },
  shareButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  shareButtonIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  shareButtonLabel: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  shareCloseButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  shareCloseText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── CHECK FOR UPDATE ──
  updateOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  updateContainer: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    overflow: "hidden",
  },
  updateContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  updateIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  updateTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 12,
    textAlign: "center",
  },
  versionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(124,77,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  versionText: {
    color: "#a78bfa",
    fontSize: 13,
    fontWeight: "700",
  },
  updateSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  updateCheckingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  updateCheckingText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
  },
  updateSuccessRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(74,222,128,0.1)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.25)",
  },
  updateSuccessText: {
    color: "#4ade80",
    fontSize: 14,
    fontWeight: "700",
  },
  updateButton: {
    width: "100%",
    borderRadius: 26,
    overflow: "hidden",
    marginBottom: 16,
  },
  updateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  updateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  updateCloseBtn: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  updateCloseBtnText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── HELP & FEEDBACK ──
  helpOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  helpBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  helpPanel: {
    height: "90%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: "rgba(124,77,255,0.3)",
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 14,
  },
  helpTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "900",
  },
  helpSubtitle: {
    color: "rgba(167,139,250,0.8)",
    fontSize: 13,
    marginTop: 2,
    fontWeight: "500",
  },
  helpCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpSectionLabel: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  faqItem: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  faqQuestionText: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },
  faqAnswerText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 19,
    paddingTop: 10,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  contactValue: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    marginTop: 2,
  },
  feedbackCard: {
    marginHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(124,77,255,0.2)",
  },
  feedbackInput: {
    color: "white",
    fontSize: 14,
    minHeight: 100,
    paddingTop: 4,
    marginBottom: 14,
  },
  feedbackSendBtn: {
    borderRadius: 22,
    overflow: "hidden",
  },
  feedbackSendBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
  },
  feedbackSendBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  feedbackSentBox: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  feedbackSentText: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "800",
  },
  feedbackSentSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },

  // ── ABOUT ──
  aboutOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  aboutContainer: {
    width: "100%",
    maxWidth: 370,
    borderRadius: 30,
    overflow: "hidden",
  },
  aboutContent: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 28,
  },
  aboutCloseBtn: {
    alignSelf: "flex-end",
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  aboutIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#7c4dff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  aboutIconImage: {
    width: 60,
    height: 60,
  },
  aboutAppName: {
    color: "white",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  aboutTagline: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: 14,
    letterSpacing: 1,
  },
  aboutVersionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  aboutVersionBadge: {
    backgroundColor: "rgba(124,77,255,0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  aboutVersionText: {
    color: "#a78bfa",
    fontSize: 12,
    fontWeight: "700",
  },
  aboutBuildBadge: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  aboutBuildText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
  },
  aboutDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 16,
  },
  aboutDescription: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 6,
  },
  aboutStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  aboutStat: {
    alignItems: "center",
  },
  aboutStatNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  aboutStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    marginTop: 2,
    fontWeight: "600",
  },
  aboutStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  aboutFollowText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  aboutSocialRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  aboutSocialBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  aboutCopyright: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    textAlign: "center",
  },
});
