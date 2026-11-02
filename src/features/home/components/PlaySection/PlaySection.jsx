import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';
import { s, vs, ms } from '@shared/utils/responsive';

const PLAY_ITEMS_DATA = [
  {
    key: 'truth-dare',
    title: 'Truth &\nDare',
    colors: ['#FE5B74', '#FF7E52', '#FF924E'],
    arrowColor: '#FE5B74',
    img: require('@assets/images/icon_play_truth_dare.png'),
    label: 'Truth & Dare',
    comingSoon: true,
  },
  {
    key: 'personality-test',
    title: 'Personality\nTest',
    colors: ['#5144FD', '#6B49FD', '#8E41FC'],
    arrowColor: '#7044FD',
    img: require('@assets/images/icon_play_personality.png'),
    label: 'Personality Test',
    route: '/personality-test',
  },
  {
    key: 'mini-games',
    title: 'Mini\nGames',
    colors: ['#00BF9F', '#00A889', '#008E74'],
    arrowColor: '#008E74',
    img: require('@assets/images/icon_play_mini_games.png'),
    label: 'Mini Games',
    comingSoon: true,
  },
];

export const PlaySection = memo(function PlaySection({ onSeeAllPress, onItemPress }) {
  return (
    <View style={styles.sectionWrap}>
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('@assets/images/icon_gamepad_purple.png')}
            style={styles.playHeaderIcon}
            resizeMode="contain"
          />
          <Text style={styles.sectionTitle}>Play & Connect</Text>
        </View>
        <TouchableOpacity onPress={onSeeAllPress} activeOpacity={0.75}>
          <Text style={styles.sectionSeeAll}>See All ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.playCardsRow}>
        {PLAY_ITEMS_DATA.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.playCard}
            activeOpacity={0.85}
            onPress={() => onItemPress && onItemPress(item)}
          >
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={s(18)}
              style={styles.playCardGradient}
            >
              <View style={styles.playCardImgWrap}>
                <Image
                  source={item.img}
                  style={styles.playCardImg}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.playCardContent}>
                <Text
                  style={styles.playCardTitle}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {item.title}
                </Text>
              </View>

              <View style={styles.playCardArrow}>
                <ChevronRight size={s(9)} color={item.arrowColor} strokeWidth={3} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: vs(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: vs(10),
  },
  sectionTitle: {
    color: '#111827',
    fontSize: ms(16.5),
    fontWeight: '800',
    marginLeft: 6,
  },
  sectionSeeAll: {
    color: '#7C3AED',
    fontSize: ms(13),
    fontWeight: '700',
  },
  playHeaderIcon: {
    width: s(22),
    height: vs(18),
  },
  playCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: s(8),
  },
  playCard: {
    flex: 1,
    height: vs(78),
    borderRadius: s(18),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  playCardGradient: {
    flex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: s(6),
    paddingRight: s(6),
    paddingVertical: vs(6),
    borderRadius: s(18),
  },
  playCardImgWrap: {
    width: s(38),
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCardImg: {
    width: '100%',
    height: '100%',
  },
  playCardContent: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-start',
    paddingLeft: s(2),
    paddingRight: s(14),
    paddingTop: vs(4),
  },
  playCardTitle: {
    color: '#FFFFFF',
    fontSize: ms(11.5),
    fontWeight: '900',
    lineHeight: ms(14),
    letterSpacing: -0.2,
  },
  playCardArrow: {
    position: 'absolute',
    bottom: vs(7),
    right: s(7),
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default PlaySection;
