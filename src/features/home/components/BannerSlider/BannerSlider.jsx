import React, { memo, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image, Dimensions } from 'react-native';
import { ms } from '@shared/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_SLIDE_WIDTH = SCREEN_WIDTH - 32;

const BANNER_IMAGES = [
  require('@assets/images/cat gif.gif'),
  require('@assets/images/labelgif (1).jpg'),
  require('@assets/images/labelgif (2).jpg'),
  require('@assets/images/labelgif (3).jpg'),
  require('@assets/images/labelgif (4).jpg'),
];

export const BannerSlider = memo(function BannerSlider({
  slides = [],
  activeBanner = 0,
  onBannerChange,
  onPressSlide,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      if (onBannerChange) {
        onBannerChange((prev) => {
          const next = (prev + 1) % slides.length;
          listRef.current?.scrollToIndex({ index: next, animated: true });
          return next;
        });
      }
    }, 7000);
    return () => clearInterval(timer);
  }, [slides.length, onBannerChange]);

  if (slides.length === 0) return null;

  return (
    <View style={styles.bannerWrapper}>
      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item, index) => item.id || String(index)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / BANNER_SLIDE_WIDTH);
          if (onBannerChange) onBannerChange(index);
        }}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.bannerSlide}
            onPress={() => onPressSlide && onPressSlide(item)}
          >
            <Image
              source={
                item.imageUrl
                  ? { uri: item.imageUrl }
                  : BANNER_IMAGES[index % BANNER_IMAGES.length]
              }
              style={styles.bannerImg}
              resizeMode="cover"
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerTitle}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {slides.length > 1 && (
        <View style={styles.bannerDots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.bannerDot,
                activeBanner === i && styles.bannerDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  bannerWrapper: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerSlide: {
    width: BANNER_SLIDE_WIDTH,
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
  },
  bannerImg: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bannerTitle: {
    color: '#ffd700',
    fontSize: ms(18),
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  bannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.09)',
  },
  bannerDotActive: {
    width: 20,
    backgroundColor: '#7c4dff',
  },
});

export default BannerSlider;
