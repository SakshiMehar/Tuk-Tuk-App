import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';
import { s, vs, ms } from '@shared/utils/responsive';

const MATCH_WAVE_HEIGHTS = [5, 10, 7, 13, 9, 6, 11];

export const HomeHeader = memo(function HomeHeader({
  userProfile,
  walletDiamonds = 28961.4,
  activeUsers = 1,
  featuredUserAvatar = 'https://randomuser.me/api/portraits/men/45.jpg',
  unreadNotificationsCount = 20,
  onAvatarPress,
  onDiamondRechargePress,
  onNotificationPress,
  onJoinActivePress,
  onJoinVoicePartyPress,
}) {
  const insets = useSafeAreaInsets();
  const avatarUri = userProfile?.avatarUrl;
  const initial = (userProfile?.name || 'S')[0]?.toUpperCase() || 'S';

  const formattedDiamonds =
    walletDiamonds != null
      ? Number(walletDiamonds).toLocaleString('en-IN', {
          minimumFractionDigits: Number(walletDiamonds) % 1 !== 0 ? 1 : 0,
          maximumFractionDigits: 1,
        })
      : '28,961.4';
  const formattedActive = String(activeUsers || 1);

  return (
    <View style={styles.container}>
      {/* Soft pastel ambient glow */}
      <LinearGradient
        colors={['#EDE4FF', '#FAF5FF', 'rgba(255,255,255,0)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.topAmbientGlow}
        pointerEvents="none"
      />

      {/* ── TOP HEADER ROW ── */}
      <View style={[styles.headerRow, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onAvatarPress}
          style={styles.avatarWrap}
        >
          <View style={styles.vipAvatarContainer}>
            <View style={styles.vipAvatarInner}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <Text style={styles.avatarInitial}>{initial}</Text>
              )}
            </View>
            <Image
              source={require('@assets/images/VipProfileFrame1.png')}
              style={styles.vipFrameImg}
              resizeMode="contain"
              pointerEvents="none"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.appName}>Tuk Tuk</Text>

        <View style={{ flex: 1 }} />

        {/* Diamond pill */}
        <TouchableOpacity
          style={styles.diamondPill}
          onPress={onDiamondRechargePress}
          activeOpacity={0.85}
        >
          <Image
            source={{
              uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/Diamond.png',
            }}
            style={styles.diamondIcon}
            resizeMode="contain"
          />
          <Text style={styles.diamondCount} numberOfLines={1}>
            {formattedDiamonds}
          </Text>
          <View style={styles.diamondPlusBtn}>
            <Text style={styles.diamondPlusText}>+</Text>
          </View>
        </TouchableOpacity>

        {/* Notification bell */}
        <TouchableOpacity
          style={styles.bellBtn}
          onPress={onNotificationPress}
          activeOpacity={0.8}
        >
          <Bell size={21} color="#1E293B" strokeWidth={2.2} />
          {unreadNotificationsCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── ACTIVE NOW JOIN PILL ── */}
      <TouchableOpacity
        style={styles.activeNowPill}
        activeOpacity={0.9}
        onPress={onJoinActivePress}
      >
        <LinearGradient
          colors={['#FF1493', '#E01880', '#9333EA', '#7E22CE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          borderRadius={30}
          style={styles.activeNowGradient}
        >
          <View style={styles.activeNowLeft}>
            <View style={styles.activeNowAvatarWrap}>
              <Image
                source={{
                  uri:
                    featuredUserAvatar ||
                    'https://randomuser.me/api/portraits/men/45.jpg',
                }}
                style={styles.activeNowAvatar}
              />
              <View style={styles.activeNowGreenDot} />
            </View>

            <View style={styles.activeNowWaves}>
              {MATCH_WAVE_HEIGHTS.map((h, i) => (
                <View key={i} style={[styles.activeNowWaveBar, { height: h }]} />
              ))}
            </View>

            <View style={styles.activeNowTextCol}>
              <Text style={styles.activeNowNumber}>{formattedActive}</Text>
              <Text style={styles.activeNowLabel}>Active now 🟢</Text>
            </View>
          </View>

          <View style={styles.joinBtn}>
            <Text style={styles.joinBtnText}>Join</Text>
            <ChevronRight size={14} color="#FF1493" strokeWidth={3} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* ── VOICE PARTY HERO BANNER ── */}
      <TouchableOpacity
        style={styles.vpBanner}
        activeOpacity={0.92}
        onPress={onJoinVoicePartyPress}
      >
        <LinearGradient
          colors={['#240A5E', '#380D77', '#2D106E', '#1E1B4B', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          borderRadius={24}
          style={styles.vpBannerGradient}
        >
          <View style={styles.vpLeft}>
            <View style={styles.vpLiveBadge}>
              <View style={styles.vpLiveDot} />
              <Text style={styles.vpLiveTxt}>Live Now</Text>
            </View>
            <Text style={styles.vpTitle}>Voice Party</Text>
            <Text style={styles.vpSubtitle}>Talk • Make Friends • Have Fun</Text>

            <View style={styles.vpJoinBtn}>
              <LinearGradient
                colors={['#FF2A85', '#FF007A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                borderRadius={22}
                style={styles.vpJoinBtnGrad}
              >
                <Text style={{ fontSize: 13 }}>🎧</Text>
                <Text style={styles.vpJoinBtnText}>Join Live</Text>
                <ChevronRight size={13} color="white" strokeWidth={2.8} />
              </LinearGradient>
            </View>
          </View>

          <View style={styles.vpRight} pointerEvents="none">
            <Image
              source={require('@assets/images/voice_party_hero.jpg')}
              style={styles.vpHeroArt}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['#240A5E', 'rgba(36, 10, 94, 0.4)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.vpHeroArtFade}
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: vs(8),
    zIndex: 1,
  },
  avatarWrap: {
    overflow: 'visible',
    marginRight: s(1.5),
  },
  vipAvatarContainer: {
    width: s(50),
    height: s(50),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vipAvatarInner: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: ms(17),
  },
  vipFrameImg: {
    position: 'absolute',
    width: s(54),
    height: s(54),
    top: -2,
    left: -2,
    zIndex: 2,
  },
  appName: {
    fontSize: ms(22),
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.5,
    marginLeft: s(5),
  },
  diamondPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EEFF',
    borderRadius: s(22),
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderWidth: 1.5,
    borderColor: '#E2D3FE',
    gap: s(5),
  },
  diamondIcon: {
    width: s(24),
    height: s(24),
  },
  diamondCount: {
    color: '#581C87',
    fontSize: ms(13),
    fontWeight: '800',
    maxWidth: s(95),
  },
  diamondPlusBtn: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondPlusText: {
    color: 'white',
    fontSize: ms(13),
    fontWeight: '900',
    lineHeight: ms(15),
  },
  bellBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(3),
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bellBadgeText: {
    color: 'white',
    fontSize: ms(9),
    fontWeight: '800',
  },

  // Active Now Pill
  activeNowPill: {
    marginHorizontal: 16,
    marginTop: vs(6),
    marginBottom: vs(14),
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#FF1493',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 3,
  },
  activeNowGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(9),
    paddingHorizontal: s(14),
    borderRadius: 30,
  },
  activeNowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  activeNowAvatarWrap: {
    width: s(36),
    height: s(36),
    position: 'relative',
  },
  activeNowAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  activeNowGreenDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    borderWidth: 1.5,
    borderColor: '#FF1493',
  },
  activeNowWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
  },
  activeNowWaveBar: {
    width: 3,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 2,
  },
  activeNowTextCol: {
    marginLeft: s(2),
  },
  activeNowNumber: {
    color: 'white',
    fontSize: ms(15),
    fontWeight: '900',
    lineHeight: ms(18),
  },
  activeNowLabel: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: ms(11),
    fontWeight: '600',
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingVertical: vs(7),
    paddingHorizontal: s(16),
    gap: 3,
  },
  joinBtnText: {
    color: '#FF1493',
    fontSize: ms(13.5),
    fontWeight: '900',
  },

  // Voice Party Hero Banner
  vpBanner: {
    marginHorizontal: 16,
    marginBottom: vs(14),
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#380D77',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  vpBannerGradient: {
    flexDirection: 'row',
    height: vs(164),
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  vpLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: s(16),
    paddingRight: s(6),
    paddingVertical: vs(16),
    maxWidth: '58%',
    zIndex: 2,
  },
  vpLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,45,85,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,85,0.45)',
    borderRadius: 12,
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    alignSelf: 'flex-start',
    gap: s(5),
  },
  vpLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF2D55',
  },
  vpLiveTxt: {
    color: 'white',
    fontSize: ms(11),
    fontWeight: '800',
  },
  vpTitle: {
    color: 'white',
    fontSize: ms(26),
    fontWeight: '900',
    letterSpacing: -0.3,
    marginTop: vs(6),
  },
  vpSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: ms(11.5),
    fontWeight: '500',
    marginTop: vs(4),
    marginBottom: vs(14),
  },
  vpJoinBtn: {
    borderRadius: 22,
    alignSelf: 'flex-start',
    overflow: 'hidden',
    shadowColor: '#FF007A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  vpJoinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(9),
    paddingHorizontal: s(16),
    gap: 4,
    borderRadius: 22,
  },
  vpJoinBtnText: {
    color: 'white',
    fontSize: ms(13),
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  vpRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: s(185),
    overflow: 'hidden',
  },
  vpHeroArt: {
    width: '100%',
    height: '100%',
  },
  vpHeroArtFade: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 48,
  },
});

export default HomeHeader;
