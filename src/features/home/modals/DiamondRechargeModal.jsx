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

const PACKAGES = [
  { id: 'p1', diamonds: 500, price: '₹49', bonus: null },
  { id: 'p2', diamonds: 1200, price: '₹99', bonus: '+10% Free' },
  { id: 'p3', diamonds: 3500, price: '₹249', bonus: '+20% Free' },
  { id: 'p4', diamonds: 8000, price: '₹499', bonus: '+35% Free' },
  { id: 'p5', diamonds: 18000, price: '₹999', bonus: '+50% Free' },
  { id: 'p6', diamonds: 50000, price: '₹2499', bonus: 'VIP Elite' },
];

export const DiamondRechargeModal = memo(function DiamondRechargeModal({
  visible,
  currentDiamonds = 28951,
  onClose,
  onSelectPackage,
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
            colors={['#1e0a3c', '#16082a', '#0d0618']}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.header}>
            <Text style={styles.title}>Diamond Top-Up</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <LinearGradient
              colors={['#7c4dff', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.balanceGrad}
            >
              <View>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceVal}>
                  💎 {Number(currentDiamonds || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <Text style={{ fontSize: 36 }}>✨</Text>
            </LinearGradient>
          </View>

          <Text style={styles.sectionTitle}>Select Package</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.packagesGrid}
          >
            {PACKAGES.map((pkg) => (
              <TouchableOpacity
                key={pkg.id}
                style={styles.pkgCard}
                activeOpacity={0.85}
                onPress={() => onSelectPackage && onSelectPackage(pkg)}
              >
                <View style={styles.pkgTop}>
                  <Text style={styles.pkgDiamonds}>💎 {pkg.diamonds}</Text>
                  {pkg.bonus && (
                    <View style={styles.bonusBadge}>
                      <Text style={styles.bonusTxt}>{pkg.bonus}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.pkgBottom}>
                  <Text style={styles.pkgPrice}>{pkg.price}</Text>
                </View>
              </TouchableOpacity>
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
    height: '70%',
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
  balanceCard: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 18,
  },
  balanceGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: ms(12),
    fontWeight: '600',
  },
  balanceVal: {
    color: '#FFFFFF',
    fontSize: ms(24),
    fontWeight: '900',
    marginTop: 2,
  },
  sectionTitle: {
    color: '#B388FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  packagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 24,
  },
  pkgCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  pkgTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pkgDiamonds: {
    color: '#FFFFFF',
    fontSize: ms(15),
    fontWeight: '800',
  },
  bonusBadge: {
    backgroundColor: '#EC4899',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bonusTxt: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  pkgBottom: {
    marginTop: 10,
  },
  pkgPrice: {
    color: '#A78BFA',
    fontSize: ms(14),
    fontWeight: '700',
  },
});

export default DiamondRechargeModal;
