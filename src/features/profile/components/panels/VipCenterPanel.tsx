import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VIP_TIER_THRESHOLDS, VIP_PROFILE_FRAME_LAYOUT } from '../../../../constants/vip';
import { getUser } from '../../../../store/authStore';
import { resolveProfileAvatarSource } from '../../../../utils/profileAvatar';
import { useWalletBalance } from '../../../../hooks/useWalletBalance';
import { ProfileAvatarWithFrame } from '../ProfileAvatarWithFrame/ProfileAvatarWithFrame';
import { DiamondRechargeModal } from '../../../home/modals/DiamondRechargeModal';

const SCREEN_WIDTH = Dimensions.get('window').width;

const VIP_TIERS = VIP_TIER_THRESHOLDS.map(({ tier, exp, assets }) => ({
  id: tier,
  label: `VIP ${tier}`,
  exp,
  image: assets.logo,
  frame: assets.profileFrame,
}));

export const VipCenterPanel: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [rechargeVisible, setRechargeVisible] = useState(false);
  const { diamonds } = useWalletBalance();

  useEffect(() => {
    getUser().then(setUser).catch(() => {});
  }, []);

  const currentTier = VIP_TIERS.find((t) => t.id === selectedTier) ?? VIP_TIERS[0];
  const avatarSource = resolveProfileAvatarSource(user);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Tier Selector Horizontal Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierScroll}>
        {VIP_TIERS.map((tier) => (
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

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={['#2e1065', '#1e1b4b', '#0f172a']}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.avatarWrap}>
          <ProfileAvatarWithFrame
            user={user}
            avatarSource={avatarSource}
            frameSource={currentTier.frame}
            size={88}
            {...VIP_PROFILE_FRAME_LAYOUT}
          />
        </View>

        {currentTier.image && (
          <Image source={{ uri: currentTier.image }} style={styles.vipLogo} resizeMode="contain" />
        )}

        <Text style={styles.tierLabel}>{currentTier.label}</Text>
        <Text style={styles.tierExp}>Requires {currentTier.exp.toLocaleString()} VIP Exp</Text>

        <TouchableOpacity
          style={styles.rechargeBtn}
          onPress={() => setRechargeVisible(true)}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#a855f7', '#7c3aed']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.rechargeGrad}
          >
            <Text style={styles.rechargeBtnText}>Recharge to Unlock</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Privileges Grid */}
      <Text style={styles.sectionTitle}>Exclusive Privileges</Text>
      <View style={styles.privilegesGrid}>
        {[
          { icon: 'ribbon', label: 'VIP Badge' },
          { icon: 'square-outline', label: 'Avatar Frame' },
          { icon: 'people', label: 'Entrance Effect' },
          { icon: 'chatbubble-ellipses', label: 'Chat Frame' },
        ].map((item, idx) => (
          <View key={idx} style={styles.privCard}>
            <View style={styles.privIconBox}>
              <Ionicons name={item.icon as any} size={24} color="#c084fc" />
            </View>
            <Text style={styles.privLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      <DiamondRechargeModal
        visible={rechargeVisible}
        currentDiamonds={diamonds}
        onClose={() => setRechargeVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  content: { padding: 16, paddingBottom: 40 },
  tierScroll: { gap: 8, paddingBottom: 16 },
  tierPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
  },
  tierPillActive: {
    backgroundColor: '#7c4dff',
    borderColor: '#a855f7',
  },
  tierPillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  tierPillTextActive: {
    color: '#ffffff',
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
    marginBottom: 24,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  vipLogo: {
    width: 64,
    height: 64,
    marginBottom: 8,
  },
  tierLabel: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  tierExp: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  rechargeBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
  },
  rechargeGrad: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  rechargeBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionTitle: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  privilegesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  privCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.15)',
  },
  privIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124,77,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default VipCenterPanel;
