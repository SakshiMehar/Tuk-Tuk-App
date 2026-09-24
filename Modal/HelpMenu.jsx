import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HelpMenu({ insets, onClose }) {
  const [helpTab, setHelpTab] = useState("FAQ");
  const [helpSearch, setHelpSearch] = useState("");
  const [expandedFaqMM, setExpandedFaqMM] = useState(null);

  const faqData = [
    {
      category: "General Guide",
      icon: "book",
      items: [
        { q: "App use kaise karein", a: "App use karne ke liye, sabse pehle profile setup karein aur home screen se rooms explore karein." },
        { q: "Room join/create kaise karein", a: "Home screen par '+' button dabayein naya room create karne ke liye, ya kisi bhi active room par click karke join karein." },
        { q: "Profile & settings", a: "Neeche right corner mein profile icon par click karein, wahan se aap apni profile edit aur settings manage kar sakte hain." },
      ]
    },
    {
      category: "Account & Login",
      icon: "lock-closed",
      items: [
        { q: "Login/OTP problem", a: "Network check karein ya thodi der baad try karein. Agar phir bhi issue ho toh support se contact karein." },
        { q: "Account recovery", a: "Aap apne registered email/phone se account recover kar sakte hain." },
        { q: "Account delete/deactivate", a: "Settings -> Security & Privacy mein jaakar account delete ya deactivate kar sakte hain." },
      ]
    },
    {
      category: "Voice Chat / Room Issues",
      icon: "mic",
      items: [
        { q: "Mic kaam nahi kar raha", a: "Apne phone ki settings mein jaakar app ko microphone permission allow karein." },
        { q: "Voice clear nahi aa rahi", a: "Aapka internet connection slow ho sakta hai. Network switch karke try karein." },
        { q: "Room join nahi ho raha", a: "Room full ho sakta hai ya fir internet issue ho sakta hai." },
        { q: "Host/Moderator related issue", a: "Agar host/mod ke sath koi issue hai toh aap unko block ya report kar sakte hain." },
      ]
    },
    {
      category: "Coins / Diamonds / Premium",
      icon: "diamond",
      items: [
        { q: "Coins purchase issue", a: "Payment fail hui hai toh 24-48 hours wait karein, amount refund ho jayega." },
        { q: "Coins/diamonds missing", a: "Refresh karein ya apni transaction history check karein." },
        { q: "Premium benefits", a: "Premium lene par aapko exclusive frames, entry effects aur ad-free experience milta hai." },
        { q: "Payment/refund related help", a: "Refunds ke liye please apne app store (Google/Apple) support se contact karein." },
      ]
    },
    {
      category: "Music / Audio Help",
      icon: "musical-notes",
      items: [
        { q: "Music play nahi ho raha", a: "Ensure kijiye ki aapne media volume badhaya hua hai aur network proper chal raha hai." },
        { q: "Device music add kaise karein", a: "Room mein '+' icon par tap karke 'Music' select karein aur apne device files choose karein." },
        { q: "Audio permission/settings", a: "App settings mein jaakar audio permissions check karein." },
      ]
    },
    {
      category: "Report a User",
      icon: "alert-circle",
      items: [
        { q: "Abuse/harassment", a: "User ki profile par jaakar 3 dots dabayein aur Report select karein." },
        { q: "Fake profile", a: "Fake profile ko fake account category mein report karein." },
        { q: "Spam/scam", a: "Kisi bhi spam link ya scam message ko turant report karein." },
        { q: "Inappropriate content", a: "Galat content post karne walo ko report karke community ko safe rakhein." },
      ]
    },
    {
      category: "Safety & Privacy",
      icon: "shield-checkmark",
      items: [
        { q: "Privacy settings", a: "Settings mein Privacy tab mein jaakar apni profile visibility set karein." },
        { q: "Block user", a: "User profile par jakar Block option select karein. Woh aapko messages ya rooms mein nahi dekh payenge." },
        { q: "Personal information safety", a: "Kabhi bhi apna OTP, bank details ya password kisi ke sath share na karein." },
        { q: "Community guidelines", a: "App mein positive mahool banaye rakhne ke liye hamari guidelines follow karein." },
      ]
    },
    {
      category: "Report a Technical Problem",
      icon: "bug",
      items: [
        { q: "App crash", a: "App update karein. Agar phir bhi crash ho toh cache clear karke dekhein." },
        { q: "Bug report", a: "Koi bhi bug dikhe toh Support ko detailed description ke sath report karein." },
        { q: "Screenshot/video attach karne ka option", a: "Support email/chat mein aap direct file attach kar sakte hain." },
      ]
    },
    {
      category: "Contact Support",
      icon: "chatbubbles",
      items: [
        { q: "WhatsApp Support", a: "Settings > Help mein WhatsApp support ka button available hai." },
        { q: "Email Support", a: "Aap humein support@tuktuk.com par email kar sakte hain." },
        { q: "Support Ticket / Request ID", a: "Ticket raise karne ke baad apne email par Reference ID save rakhein." },
      ]
    },
    {
      category: "Terms & Policies",
      icon: "document-text",
      items: [
        { q: "Terms & Conditions", a: "Humari terms of service padhne ke liye app settings mein jayein." },
        { q: "Privacy Policy", a: "Hum apka data kaise use karte hain, yeh Privacy Policy mein available hai." },
        { q: "Community Guidelines", a: "Tuk-Tuk par sabhi users ko guidelines follow karni hoti hain." },
        { q: "Refund/Cancellation Policy", a: "Virtual items non-refundable hain. Details ke liye policies page dekhein." },
      ]
    }
  ];

  const filteredCategories = faqData.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.q.toLowerCase().includes(helpSearch.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <View style={styles.helpContainer}>
      <LinearGradient colors={["#6a4cff", "#7b4aff"]} style={styles.helpTopBg}>
        {/* Custom Header for Help */}
        <View style={[styles.helpHeader, { paddingTop: Math.max(insets?.top || 0, 10) + 10 }]}>
          <TouchableOpacity onPress={onClose} style={styles.helpHeaderBackCircle}>
            <Ionicons name="chevron-back" size={18} color="#6a4cff" />
          </TouchableOpacity>
          <Text style={styles.helpHeaderTitle}>Help Center</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Tabs */}
        <View style={styles.helpTabRow}>
          <TouchableOpacity 
            style={[styles.helpTabBtn, helpTab === "FAQ" ? styles.helpTabBtnActive : styles.helpTabBtnInactive]}
            onPress={() => setHelpTab("FAQ")}
            activeOpacity={0.9}
          >
            <Text style={[styles.helpTabText, helpTab === "FAQ" && styles.helpTabTextActive]}>FAQ</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.helpTabBtn, helpTab === "Contact" ? styles.helpTabBtnActive : styles.helpTabBtnInactive]}
            onPress={() => setHelpTab("Contact")}
            activeOpacity={0.9}
          >
            <Text style={[styles.helpTabText, helpTab === "Contact" && styles.helpTabTextActive]}>Contact</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        {helpTab === "FAQ" && (
          <View style={styles.helpSearchWrapper}>
            <Ionicons name="search" size={16} color="#ffffff" style={{ marginLeft: 14, marginRight: 8, opacity: 0.8 }} />
            <TextInput 
              style={styles.helpSearchInput}
              placeholder="Search..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={helpSearch}
              onChangeText={setHelpSearch}
            />
          </View>
        )}
      </LinearGradient>

      {/* Content Area */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.helpContentScroll}>
        {helpTab === "FAQ" ? (
          <>
            {/* Warning Card */}
            {!helpSearch && (
              <View style={styles.warningCard}>
                <View style={styles.warningIconContainer}>
                  <Ionicons name="warning" size={20} color="#b45309" />
                </View>
                <View style={styles.warningTextContainer}>
                  <Text style={styles.warningTitle}>Important Alert</Text>
                  <Text style={styles.warningText}>
                    Never share your OTP, password, or financial details with anyone. Tuk-Tuk staff will never ask for them.
                  </Text>
                </View>
              </View>
            )}

            {/* Categorized FAQ List */}
            {filteredCategories.length > 0 ? filteredCategories.map((cat, catIdx) => (
              <View key={catIdx} style={styles.categorySection}>
                <View style={styles.categoryHeader}>
                  <Ionicons name={cat.icon} size={18} color="#6a4cff" style={{ marginRight: 8 }} />
                  <Text style={styles.categoryTitle}>{cat.category}</Text>
                </View>

                {cat.items.map((f, i) => (
                  <View key={i} style={styles.helpFaqCard}>
                    <TouchableOpacity 
                      style={styles.helpFaqQ}
                      activeOpacity={0.7} 
                      onPress={() => setExpandedFaqMM(expandedFaqMM === f.q ? null : f.q)}
                    >
                      <Text style={styles.helpFaqQText}>{f.q}</Text>
                      <Ionicons 
                        name={expandedFaqMM === f.q ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color="#948fa8" 
                      />
                    </TouchableOpacity>
                    {expandedFaqMM === f.q && (
                      <View style={styles.helpFaqA}>
                        <View style={styles.helpFaqDivider} />
                        <Text style={styles.helpFaqAText}>{f.a}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No FAQs found for "{helpSearch}".</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.helpContactView}>
            <View style={styles.contactIconBg}>
              <Ionicons name="chatbubbles" size={32} color="#6a4cff" />
            </View>
            <Text style={styles.helpContactTitle}>Need more assistance?</Text>
            <Text style={styles.helpContactSub}>Our support team is always here to help you out.</Text>
            <TouchableOpacity 
              style={styles.helpContactBtn} 
              activeOpacity={0.8}
              onPress={() => Linking.openURL('mailto:support@tuktuk.com').catch(err => console.error("Error opening email", err))}
            >
              <Ionicons name="mail" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.helpContactBtnText}>Contact Support Team</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  helpContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  helpTopBg: {
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  helpHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  helpHeaderBackCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  helpHeaderTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
  },
  helpTabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  helpTabBtn: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  helpTabBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  helpTabBtnInactive: {
    backgroundColor: "transparent",
  },
  helpTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
  },
  helpTabTextActive: {
    color: "#6a4cff",
  },
  helpSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    marginHorizontal: 20,
    height: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  helpSearchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 14,
    height: "100%",
  },
  helpContentScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#fffbeb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fef3c7",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  warningIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: "#b45309",
    lineHeight: 18,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
  },
  helpFaqCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    overflow: "hidden",
    shadowColor: "#64748b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  helpFaqQ: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  helpFaqQText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginRight: 10,
  },
  helpFaqDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 14,
    marginBottom: 10,
  },
  helpFaqA: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  helpFaqAText: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748b",
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: 12,
    color: '#94a3b8',
    fontSize: 14,
  },
  helpContactView: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  contactIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f5f3ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  helpContactTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  helpContactSub: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  helpContactBtn: {
    flexDirection: "row",
    backgroundColor: "#6a4cff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#6a4cff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  helpContactBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
