import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ROOM_TIERS = [
  { level: 1, micSeats: 15, totalValue: 50000 },
  { level: 2, micSeats: 20, totalValue: 90000 },
  { level: 3, micSeats: 24, totalValue: 150000 },
  { level: 4, micSeats: 30, totalValue: 240000 },
  { level: 5, micSeats: 40, totalValue: 400000 },
];

const PRIVILEGES = [
  { icon: 'speedometer', label: 'Room level speed: 110%' },
  { icon: 'person-add', label: 'Admin number: 15' },
  { icon: 'people', label: 'Max listeners in room: 500' },
  { icon: 'mic', label: 'Mic number: 15 mics' },
  { icon: 'shield-checkmark', label: 'Room enter permission: followers only' },
  { icon: 'image', label: 'Custom room background' },
  { icon: 'sparkles', label: 'Room entrance effect' },
  { icon: 'ribbon', label: 'Exclusive room frame' },
  { icon: 'chatbubble-ellipses', label: 'Exclusive chat bubble' },
];

export const RoomPremiumPanel: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Tier selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tierRow}>
        {ROOM_TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.level}
            style={[styles.tierTab, selectedLevel === tier.level && styles.tierTabActive]}
            onPress={() => setSelectedLevel(tier.level)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tierTabText, selectedLevel === tier.level && styles.tierTabTextActive]}>
              Level {tier.level}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Hero card */}
      <View style={styles.heroCard}>
        <LinearGradient colors={['#7c3aed', '#4c1d95']} style={StyleSheet.absoluteFill} />
        <Text style={styles.heroEmoji}>👑</Text>
        <Text style={styles.heroTitle}>Room Premium Lv.{selectedLevel}</Text>
        <Text style={styles.heroSub}>
          Upgrade your voice party room with more speaker seats, advanced audio perks, and custom branding.
        </Text>
      </View>

      {/* Privileges list */}
      <Text style={styles.sectionTitle}>Room Privileges</Text>
      <View style={styles.privilegesList}>
        {PRIVILEGES.map((p, idx) => (
          <View key={idx} style={styles.privRow}>
            <View style={styles.privIconCircle}>
              <Ionicons name={p.icon as any} size={20} color="#a855f7" />
            </View>
            <Text style={styles.privText}>{p.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0618' },
  content: { padding: 16, paddingBottom: 40, gap: 16 },
  tierRow: { gap: 8, paddingBottom: 8 },
  tierTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.2)',
  },
  tierTabActive: {
    backgroundColor: '#7c4dff',
    borderColor: '#a855f7',
  },
  tierTabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
  },
  tierTabTextActive: { color: 'white' },
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionTitle: {
    color: '#c4b5fd',
    fontSize: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  privilegesList: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.15)',
    gap: 10,
  },
  privRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  privIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,77,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13.5,
    fontWeight: '600',
  },
});

export default RoomPremiumPanel;
