import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const GetRewardsPanel: React.FC<{ active?: boolean }> = () => {
  const [inviteCode] = useState('TUKTUK99');

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Tuk-Tuk Voice Party! Use my referral code: ${inviteCode} to earn bonus diamonds! Download: https://tuktuk.live`,
      });
    } catch {}
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={['#7c3aed', '#db2777']} style={StyleSheet.absoluteFill} />
        <Text style={styles.heroEmoji}>🎁</Text>
        <Text style={styles.heroTitle}>Invite & Earn Diamonds</Text>
        <Text style={styles.heroSub}>
          Invite friends to Tuk-Tuk and earn 50 💎 for every successful registration!
        </Text>
      </View>

      {/* Referral Code Box */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Exclusive Referral Code</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{inviteCode}</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => Alert.alert('Copied!', 'Referral code copied to clipboard.')}
            activeOpacity={0.8}
          >
            <Text style={styles.copyBtnText}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
          <LinearGradient colors={['#7c4dff', '#a855f7']} style={styles.shareGrad}>
            <Ionicons name="share-social-outline" size={18} color="white" style={{ marginRight: 6 }} />
            <Text style={styles.shareBtnText}>Share Invitation Link</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Rewards Ladder */}
      <Text style={styles.sectionTitle}>Invitation Milestones</Text>
      <View style={styles.milestoneList}>
        {[
          { friends: 1, reward: '50 💎', done: true },
          { friends: 3, reward: '200 💎 + Starter Frame', done: false },
          { friends: 5, reward: '500 💎 + VIP Entrance', done: false },
          { friends: 10, reward: '1,500 💎 + Rare Badge', done: false },
        ].map((m, i) => (
          <View key={i} style={styles.milestoneRow}>
            <View style={styles.milestoneIcon}>
              <Text style={{ fontSize: 20 }}>{m.done ? '✅' : '🎯'}</Text>
            </View>
            <View style={styles.milestoneInfo}>
              <Text style={styles.milestoneFriends}>Invite {m.friends} friend{m.friends > 1 ? 's' : ''}</Text>
              <Text style={styles.milestoneReward}>{m.reward}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  heroEmoji: { fontSize: 44 },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  codeCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
    alignItems: 'center',
    gap: 12,
  },
  codeLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '600' },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
    gap: 12,
  },
  codeText: { color: 'white', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  copyBtn: {
    backgroundColor: '#7c4dff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  copyBtnText: { color: 'white', fontSize: 12, fontWeight: '700' },
  shareBtn: { borderRadius: 20, overflow: 'hidden', width: '100%' },
  shareGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  shareBtnText: { color: 'white', fontSize: 15, fontWeight: '800' },
  sectionTitle: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  milestoneList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.15)',
    gap: 10,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  milestoneIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: { flex: 1 },
  milestoneFriends: { color: 'white', fontSize: 14, fontWeight: '700' },
  milestoneReward: { color: '#a78bfa', fontSize: 12, marginTop: 2 },
});

export default GetRewardsPanel;
