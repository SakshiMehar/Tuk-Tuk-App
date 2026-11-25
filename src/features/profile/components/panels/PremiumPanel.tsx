import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUser } from '../../../../store/authStore';
import { resolveProfileAvatarSource } from '../../../../utils/profileAvatar';
import { ProfileAvatarWithFrame } from '../ProfileAvatarWithFrame/ProfileAvatarWithFrame';

const TIER_LOGOS: Record<string, string> = {
  knight: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Knight+logo1.png',
  baron: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Baron+logo+2.png',
  viscount: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Viscount+logo+3.png',
  count: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Count+logo+4.png',
  king: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/King+logo+5.png',
  emperor: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Emperor+logo+6.png',
  sovereign: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Premium+logos/Sovereign+logo+7.png',
};

const PREMIUM_TIERS = [
  { id: 'knight', label: 'Knight', diamonds: 2000, accent: '#6d0a0a' },
  { id: 'baron', label: 'Baron', diamonds: 20000, accent: '#1b0747' },
  { id: 'viscount', label: 'Viscount', diamonds: 80000, accent: '#3b057d' },
  { id: 'count', label: 'Count', diamonds: 200000, accent: '#0761d0' },
  { id: 'king', label: 'King', diamonds: 500000, accent: '#5903ae' },
  { id: 'emperor', label: 'Emperor', diamonds: 1000000, accent: '#f97316' },
  { id: 'sovereign', label: 'Sovereign', diamonds: 2500000, accent: '#0b292d' },
];

export const PremiumPanel: React.FC<{ onClose?: () => void }> = () => {
  const [selectedTier, setSelectedTier] = useState('knight');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(setUser).catch(() => {});
  }, []);

  const current = PREMIUM_TIERS.find((t) => t.id === selectedTier) ?? PREMIUM_TIERS[0];
  const avatarSource = resolveProfileAvatarSource(user);

  const handleActivate = () => {
    Alert.alert('Activate Premium', `Activate ${current.label} tier for ${current.diamonds.toLocaleString()} 💎?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => Alert.alert('Activated!', `You are now a ${current.label}.`) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Tier selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierScroll}>
        {PREMIUM_TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[styles.tierPill, selectedTier === tier.id && styles.tierPillActive]}
            onPress={() => setSelectedTier(tier.id)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tierPillText, selectedTier === tier.id && styles.tierPillTextActive]}>
              {tier.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={['#311042', '#1a0628', '#0d0216']} style={StyleSheet.absoluteFill} />
        <View style={styles.avatarWrap}>
          <ProfileAvatarWithFrame
            user={user}
            avatarSource={avatarSource}
            size={88}
          />
        </View>

        {TIER_LOGOS[current.id] && (
          <Image source={{ uri: TIER_LOGOS[current.id] }} style={styles.crestImg} resizeMode="contain" />
        )}

        <Text style={styles.tierTitle}>{current.label} Noble Tier</Text>
        <Text style={styles.tierDiamonds}>Cost: {current.diamonds.toLocaleString()} 💎</Text>

        <TouchableOpacity style={styles.actBtn} onPress={handleActivate} activeOpacity={0.85}>
          <LinearGradient colors={['#ec4899', '#8b5cf6']} style={styles.actGrad}>
            <Text style={styles.actText}>Activate Tier</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Perks */}
      <Text style={styles.sectionTitle}>Noble Privileges</Text>
      <View style={styles.perksList}>
        {[
          { label: 'Exclusive Noble Crest & Name Glow', icon: 'sparkles' },
          { label: 'VIP Room Entrance Banner', icon: 'megaphone' },
          { label: 'Anti-Kick & Room Immunity', icon: 'shield-checkmark' },
          { label: 'Special Chat Bubble & Stickers', icon: 'chatbubbles' },
        ].map((item, idx) => (
          <View key={idx} style={styles.perkRow}>
            <Ionicons name={item.icon as any} size={20} color="#f472b6" style={{ marginRight: 10 }} />
            <Text style={styles.perkText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  tierScroll: { gap: 8, paddingBottom: 8 },
  tierPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tierPillActive: {
    backgroundColor: '#ec4899',
    borderColor: '#f472b6',
  },
  tierPillText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '700' },
  tierPillTextActive: { color: '#ffffff' },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
    gap: 10,
  },
  avatarWrap: { marginBottom: 6 },
  crestImg: { width: 72, height: 72 },
  tierTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  tierDiamonds: { color: '#f472b6', fontSize: 14, fontWeight: '700' },
  actBtn: { borderRadius: 24, overflow: 'hidden', width: '100%', marginTop: 8 },
  actGrad: { paddingVertical: 14, alignItems: 'center' },
  actText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  sectionTitle: {
    color: '#f472b6',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  perksList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.2)',
    gap: 12,
  },
  perkRow: { flexDirection: 'row', alignItems: 'center' },
  perkText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13.5, fontWeight: '600' },
});

export default PremiumPanel;
