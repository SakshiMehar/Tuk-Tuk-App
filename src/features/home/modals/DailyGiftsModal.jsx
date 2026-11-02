import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

const GIFTS = [
  { id: 'g1', name: 'Rose', value: 10, emoji: '🌹', colors: ['#E11D48', '#BE123C'], isFree: true, description: 'Send sweet gesture' },
  { id: 'g2', name: 'Heart Ring', value: 99, emoji: '💍', colors: ['#9333EA', '#7E22CE'], description: 'Sparkle with grace' },
  { id: 'g3', name: 'Super Car', value: 499, emoji: '🏎️', colors: ['#D97706', '#B45309'], description: 'Cruise into party' },
  { id: 'g4', name: 'Super Rocket', value: 999, emoji: '🚀', colors: ['#2563EB', '#1D4ED8'], description: 'Full room animation' },
];

export const DailyGiftsModal = memo(function DailyGiftsModal({
  visible,
  onClose,
  onClaimFreeGift,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.panel}>
          <LinearGradient
            colors={['#1a0a2e', '#16082a', '#0d0618']}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Daily Gifts</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Free Banner */}
          <TouchableOpacity
            style={styles.freeBanner}
            activeOpacity={0.85}
            onPress={onClaimFreeGift}
          >
            <LinearGradient
              colors={['#ffb700', '#ff9500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.freeGradient}
            >
              <Text style={styles.freeEmoji}>🎉</Text>
              <View style={styles.freeTextCol}>
                <Text style={styles.freeTitle}>Free Gift Daily!</Text>
                <Text style={styles.freeSub}>Tap to claim your daily bonus</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
          >
            {GIFTS.map((gift) => (
              <View key={gift.id} style={styles.giftCard}>
                <LinearGradient
                  colors={gift.colors}
                  style={styles.giftCardGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                  <Text style={styles.giftName}>{gift.name}</Text>
                  <Text style={styles.giftValue}>+{gift.value}</Text>
                  <Text style={styles.giftDesc}>{gift.description}</Text>
                  {gift.isFree && (
                    <View style={styles.freeTag}>
                      <Text style={styles.freeTagTxt}>FREE</Text>
                    </View>
                  )}
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  panel: {
    height: '65%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  freeBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  freeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  freeEmoji: {
    fontSize: 28,
  },
  freeTextCol: {
    flex: 1,
  },
  freeTitle: {
    color: '#000000',
    fontSize: ms(15),
    fontWeight: '800',
  },
  freeSub: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: ms(12),
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  giftCard: {
    width: '48%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  giftCardGrad: {
    padding: 14,
    alignItems: 'center',
    position: 'relative',
  },
  giftEmoji: {
    fontSize: 34,
    marginBottom: 6,
  },
  giftName: {
    color: '#FFFFFF',
    fontSize: ms(14),
    fontWeight: '800',
  },
  giftValue: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: ms(12),
    fontWeight: '700',
    marginTop: 2,
  },
  giftDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },
  freeTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#22C55E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  freeTagTxt: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});

export default DailyGiftsModal;
