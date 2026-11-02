import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';
import { s, vs, ms } from '@shared/utils/responsive';

const FEATURE_CARDS_DATA = [
  {
    key: 'find-friends',
    title: 'Find Friends',
    subtitle: 'Meet new people',
    colors: ['#FF4D80', '#FF2A6D', '#E0185D'],
    arrowColor: '#FF2A6D',
    img: require('@assets/images/icon_find_friends.jpg'),
    routeKey: 'find-friends',
  },
  {
    key: 'nearby',
    title: 'Nearby',
    subtitle: 'People around you',
    colors: ['#00B4D8', '#0096C7', '#0077B6'],
    arrowColor: '#0077B6',
    img: require('@assets/images/icon_nearby_pin.jpg'),
    isNearby: true,
  },
  {
    key: 'blind-pick',
    title: 'Blind Pick',
    subtitle: 'Mystery match',
    colors: ['#A855F7', '#7C3AED', '#5B21B6'],
    arrowColor: '#7C3AED',
    img: require('@assets/images/icon_blind_pick.jpg'),
    routeKey: 'blind-pick',
  },
];

export const FeatureCards = memo(function FeatureCards({ onCardPress, onNearbyPress }) {
  return (
    <View style={styles.featureCardsRow}>
      {FEATURE_CARDS_DATA.map((card) => (
        <TouchableOpacity
          key={card.key}
          style={styles.featureCard}
          activeOpacity={0.85}
          onPress={() => {
            if (card.isNearby && onNearbyPress) {
              onNearbyPress();
            } else if (onCardPress) {
              onCardPress(card);
            }
          }}
        >
          <LinearGradient
            colors={card.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={18}
            style={styles.featureCardGradient}
          >
            <View style={styles.featureCardImgWrap}>
              <Image
                source={card.img}
                style={styles.featureCardImg}
                resizeMode="cover"
              />
            </View>

            <View style={styles.featureCardBottom}>
              <View style={styles.featureCardTextCol}>
                <Text style={styles.featureCardTitle} numberOfLines={2}>
                  {card.title}
                </Text>
                <Text style={styles.featureCardSub} numberOfLines={1}>
                  {card.subtitle}
                </Text>
              </View>

              <View style={styles.featureCardArrowWrap}>
                <ChevronRight
                  size={12}
                  color={card.arrowColor}
                  strokeWidth={2.6}
                />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  featureCardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: s(9),
    marginBottom: vs(14),
  },
  featureCard: {
    flex: 1,
    height: vs(100),
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  featureCardGradient: {
    flex: 1,
    paddingHorizontal: s(8),
    paddingVertical: vs(8),
    justifyContent: 'space-between',
    borderRadius: 18,
  },
  featureCardImgWrap: {
    width: s(42),
    height: s(42),
    borderRadius: s(14),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardImg: {
    width: '100%',
    height: '100%',
  },
  featureCardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  featureCardTextCol: {
    flex: 1,
    paddingRight: 2,
  },
  featureCardTitle: {
    color: '#FFFFFF',
    fontSize: ms(13),
    fontWeight: '900',
    lineHeight: ms(15),
    letterSpacing: -0.2,
  },
  featureCardSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: ms(9),
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: -0.1,
  },
  featureCardArrowWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default FeatureCards;
