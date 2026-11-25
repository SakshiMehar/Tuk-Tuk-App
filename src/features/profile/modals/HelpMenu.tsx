import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface HelpMenuProps {
  insets?: any;
  onClose?: () => void;
}

const FAQ_DATA = [
  {
    category: 'Account & Profile',
    icon: 'person',
    items: [
      {
        q: 'How do I edit my profile name or avatar?',
        a: 'Tap the edit pencil button next to your username on the Profile screen. You can select from various bundled avatars or update your display name.',
      },
      {
        q: 'How do I change my country flag?',
        a: 'Your country is tied to your account location or selected preferences in account settings.',
      },
    ],
  },
  {
    category: 'Diamonds & Wallet',
    icon: 'wallet',
    items: [
      {
        q: 'How do I recharge diamonds?',
        a: 'Tap the "+" icon next to your diamond counter or select the Wallet option from the Profile menu to choose a top-up package.',
      },
      {
        q: 'What can I do with diamonds?',
        a: 'Diamonds can be used to send gifts to friends and streamers in voice parties, create families, and unlock VIP perks.',
      },
    ],
  },
  {
    category: 'Voice Parties & Rooms',
    icon: 'mic',
    items: [
      {
        q: 'How do I join a voice party?',
        a: 'Go to the Party tab on the bottom bar, tap any live party room to enter, and take an empty seat to speak.',
      },
      {
        q: 'How do I create my own voice party room?',
        a: 'Tap the create room button on the Party screen to start your own live audio room.',
      },
    ],
  },
];

export const HelpMenu: React.FC<HelpMenuProps> = ({ insets, onClose }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');
  const [search, setSearch] = useState('');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const filteredCategories = FAQ_DATA.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (it) =>
        it.q.toLowerCase().includes(search.toLowerCase()) ||
        it.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: (insets?.top ?? 20) + 10 }]}>
        <LinearGradient
          colors={['#7c4dff', '#9333ea']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={20} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Tab switch */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'faq' && styles.tabBtnActive]}
            onPress={() => setActiveTab('faq')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
              FAQ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'contact' && styles.tabBtnActive]}
            onPress={() => setActiveTab('contact')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'contact' && styles.tabTextActive]}>
              Contact Us
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'faq' && (
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color="rgba(255,255,255,0.6)" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search help topics..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'faq' ? (
          filteredCategories.map((cat, idx) => (
            <View key={idx} style={styles.catSection}>
              <View style={styles.catHeader}>
                <Ionicons name={cat.icon as any} size={16} color="#7c4dff" style={{ marginRight: 6 }} />
                <Text style={styles.catTitle}>{cat.category}</Text>
              </View>
              {cat.items.map((it, i) => (
                <View key={i} style={styles.faqCard}>
                  <TouchableOpacity
                    style={styles.faqQuestion}
                    onPress={() => setExpandedQ(expandedQ === it.q ? null : it.q)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.faqQText}>{it.q}</Text>
                    <Ionicons
                      name={expandedQ === it.q ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                  {expandedQ === it.q && (
                    <View style={styles.faqAnswer}>
                      <View style={styles.faqDivider} />
                      <Text style={styles.faqAText}>{it.a}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={styles.contactWrap}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="mail" size={32} color="#7c4dff" />
            </View>
            <Text style={styles.contactTitle}>Need more help?</Text>
            <Text style={styles.contactSub}>Our dedicated team is ready to answer your questions.</Text>
            <TouchableOpacity
              style={styles.contactBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL('mailto:support@tuktuk.live').catch(() => {})}
            >
              <Text style={styles.contactBtnText}>Email Support</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#7c4dff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
    paddingVertical: 0,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  catSection: { gap: 8 },
  catHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  catTitle: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '800',
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQText: {
    flex: 1,
    color: '#334155',
    fontSize: 13.5,
    fontWeight: '700',
    marginRight: 8,
  },
  faqAnswer: { marginTop: 8 },
  faqDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  faqAText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
  },
  contactWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  contactIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124,77,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  contactTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '800',
  },
  contactSub: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  contactBtn: {
    backgroundColor: '#7c4dff',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  contactBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default HelpMenu;
