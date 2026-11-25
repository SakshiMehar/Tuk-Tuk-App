import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const TIERS = [
  {
    key: 'basic',
    label: 'Basic Card',
    price: 'INR 144 / 30 Days',
    totalValue: '44,500',
    description: 'Wear and use the exclusive Monthly Card frame. During the subscription period, enjoy special profile highlights.',
  },
  {
    key: 'elite',
    label: 'Elite Card',
    price: 'INR 349 / 30 Days',
    totalValue: '98,000',
    description: 'Wear and use the exclusive Elite Card frame plus a bonus room-entrance effect in all voice parties.',
  },
  {
    key: 'dress',
    label: 'Dress Card',
    price: 'INR 599 / 30 Days',
    totalValue: '1,60,000',
    description: 'Wear and use the exclusive Dress Card outfit plus a luxury chat bubble across all voice rooms.',
  },
];

export const MonthlyCardPanel: React.FC = () => {
  const [selectedKey, setSelectedKey] = useState('elite');

  const handleSubscribe = (tier: any) => {
    Alert.alert('Monthly Card', `Selected ${tier.label} for ${tier.price}.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.heroBox}>
        <LinearGradient colors={['#9333ea', '#6b21a8']} style={StyleSheet.absoluteFill} />
        <Text style={styles.heroIcon}>💳</Text>
        <Text style={styles.heroTitle}>Monthly Privilege Card</Text>
        <Text style={styles.heroSub}>Supercharge your status with monthly avatar frames and entrance effects</Text>
      </View>

      <View style={styles.tierCards}>
        {TIERS.map((tier) => {
          const isSelected = selectedKey === tier.key;
          return (
            <TouchableOpacity
              key={tier.key}
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedKey(tier.key)}
              activeOpacity={0.85}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{tier.label}</Text>
                <Text style={styles.cardPrice}>{tier.price}</Text>
              </View>
              <Text style={styles.cardValue}>Total Value: {tier.totalValue}💎</Text>
              <Text style={styles.cardDesc}>{tier.description}</Text>

              <TouchableOpacity
                style={styles.subBtn}
                onPress={() => handleSubscribe(tier)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected ? ['#a855f7', '#7c3aed'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                  style={styles.subGrad}
                >
                  <Text style={[styles.subBtnText, !isSelected && styles.subBtnTextInactive]}>
                    Subscribe Now
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  heroBox: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  heroIcon: { fontSize: 44 },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  tierCards: { gap: 14 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(124,77,255,0.2)',
    gap: 8,
  },
  cardSelected: {
    borderColor: '#a855f7',
    backgroundColor: 'rgba(168,85,247,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: { color: 'white', fontSize: 18, fontWeight: '800' },
  cardPrice: { color: '#c084fc', fontSize: 14, fontWeight: '700' },
  cardValue: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  cardDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, lineHeight: 18 },
  subBtn: { borderRadius: 20, overflow: 'hidden', marginTop: 8 },
  subGrad: { paddingVertical: 12, alignItems: 'center' },
  subBtnText: { color: 'white', fontSize: 14, fontWeight: '800' },
  subBtnTextInactive: { color: 'rgba(255,255,255,0.6)' },
});

export default MonthlyCardPanel;
