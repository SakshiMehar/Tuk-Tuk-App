import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUser } from '../../../../store/authStore';
import { resolveProfileAvatarSource } from '../../../../utils/profileAvatar';
import { syncUserLevelForSession } from '../../../../services/userLevelService';
import { loadMyVipAssets } from '../../../../services/vipService';
import { fetchUserDecorations } from '../../../../services/decorationsService';
import { VIP_PROFILE_FRAME_LAYOUT } from '../../../../constants/vip';
import { resolveLocalLevelBadge } from '../../../../utils/levelBadge';
import { ProfileAvatarWithFrame } from '../ProfileAvatarWithFrame/ProfileAvatarWithFrame';

const LEVEL_TABS = ['Active Level', 'Wealth Level', 'Charm Level', 'Game Level'];

const LEVEL_UP_WAYS = [
  { label: 'Diamond cost', rate: '1 diamond / 1 Exp', current: 0, target: 2000 },
  { label: 'Stay in room', rate: '10 mins / 10 Exp', current: 0, target: 200 },
  { label: 'Send Messages to Friends', rate: '1 message / 10 Exp', current: 0, target: 50 },
  { label: 'Gold cost', rate: '10 golds / 1 Exp', current: 0, target: 50 },
];

const LEVEL_MEDAL_LEVELS = [1, 2, 3, 4, 5, 6, 10, 11];

export const UserLevelPanel: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [activeTab, setActiveTab] = useState('Active Level');
  const [user, setUser] = useState<any>(null);
  const [vipAssets, setVipAssets] = useState<any>(null);
  const [decorations, setDecorations] = useState<any>({ badgeUrl: null, frameUrl: null });

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      const levelData = await syncUserLevelForSession();
      if (levelData?.level) setLevel(levelData.level);
      setVipAssets(await loadMyVipAssets(levelData?.xp?.totalXp));
      if (u?.id || u?.userId) {
        setDecorations(await fetchUserDecorations(String(u?.id ?? u?.userId)));
      }
    })();
  }, []);

  const avatarSource = resolveProfileAvatarSource(user);

  return (
    <View style={styles.container}>
      {/* Top Hero Section */}
      <View style={styles.hero}>
        <LinearGradient
          colors={['#ede9fe', '#fdf4ff', '#f5f3ff']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.avatarWrap}>
          <ProfileAvatarWithFrame
            user={user}
            avatarSource={avatarSource}
            frameSource={decorations.frameUrl ?? vipAssets?.profileFrame}
            size={80}
            {...(vipAssets?.profileFrame ? VIP_PROFILE_FRAME_LAYOUT : {})}
          />
        </View>
        <Text style={styles.levelTitle}>Lv.{level}</Text>
        <Text style={styles.levelSubtitle}>Next level: {level + 1}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRowOuter}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {LEVEL_TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, activeTab === tab && styles.tabPillActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabPillText, activeTab === tab && styles.tabPillTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Ways to level up */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>How to Level Up</Text>
          {LEVEL_UP_WAYS.map((way, i) => (
            <View key={i} style={styles.wayRow}>
              <Text style={styles.wayLabel}>{way.label}</Text>
              <View style={styles.wayTrack}>
                <View style={[styles.wayFill, { width: `${Math.min(100, (way.current / way.target) * 100)}%` }]} />
              </View>
              <View style={styles.wayFooterRow}>
                <Text style={styles.wayRate}>{way.rate}</Text>
                <Text style={styles.wayCount}>{way.current}/{way.target}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Benefits of Higher Level</Text>
          <Text style={styles.benefitItem}>1. Receive special rewards when reaching milestone levels.</Text>
          <Text style={styles.benefitItem}>2. Stand out in voice parties and community chats.</Text>
          <Text style={styles.benefitItem}>3. Unlock exclusive level badges and cosmetics.</Text>
        </View>

        {/* Medal Grid */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Level Medals</Text>
          <View style={styles.medalGrid}>
            {LEVEL_MEDAL_LEVELS.map((lv) => {
              const unlocked = level >= lv;
              return (
                <View key={lv} style={[styles.medalCard, !unlocked && styles.medalCardLocked]}>
                  <Image
                    source={resolveLocalLevelBadge(lv)}
                    style={styles.medalCardImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.medalCardText}>Lv.{lv}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  avatarWrap: {
    marginBottom: 8,
  },
  levelTitle: {
    color: '#5b21b6',
    fontSize: 22,
    fontWeight: '900',
  },
  levelSubtitle: {
    color: '#8b7aa8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  tabRowOuter: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#faf5ff',
    borderBottomWidth: 1,
    borderBottomColor: '#ede9fe',
  },
  tabRow: {
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(124,77,255,0.08)',
  },
  tabPillActive: {
    backgroundColor: '#7c4dff',
  },
  tabPillText: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#ffffff',
  },
  bodyScroll: { flex: 1 },
  body: { padding: 16, paddingBottom: 40, gap: 16 },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ede9fe',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#7c4dff',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    color: '#4c1d95',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  wayRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f3ff',
  },
  wayLabel: {
    color: '#1e1b4b',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  wayTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f1e9ff',
    overflow: 'hidden',
    marginBottom: 6,
  },
  wayFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#7c4dff',
  },
  wayFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wayRate: { color: '#8b7aa8', fontSize: 11.5 },
  wayCount: { color: '#7c4dff', fontSize: 11.5, fontWeight: '700' },
  benefitItem: {
    color: '#5b4d75',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  medalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  medalCard: {
    width: '22%',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  medalCardLocked: { opacity: 0.45 },
  medalCardImage: { width: 36, height: 36 },
  medalCardText: { color: '#5b21b6', fontSize: 11, fontWeight: '800' },
});

export default UserLevelPanel;
