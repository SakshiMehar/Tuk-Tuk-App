import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';

const MOCK_NEARBY = [
  { id: 'nb1', name: 'Alina Roy', distance: '1.2 km away', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150', isOnline: true },
  { id: 'nb2', name: 'Dev Sharma', distance: '2.5 km away', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150', isOnline: true },
  { id: 'nb3', name: 'Sana Malik', distance: '3.1 km away', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', isOnline: false },
  { id: 'nb4', name: 'Vikram Singh', distance: '4.8 km away', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150', isOnline: true },
];

export function DiscoveryScreen() {
  const [activeTab, setActiveTab] = useState('nearby');

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Avatar uri={item.avatar} name={item.name} size={50} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.distance}>{item.distance}</Text>
      </View>
      <TouchableOpacity style={styles.waveBtn}>
        <Text style={styles.waveText}>Say Hi 👋</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Discovery</Text>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
              Nearby
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'radar' && styles.activeTab]}
            onPress={() => setActiveTab('radar')}
          >
            <Text style={[styles.tabText, activeTab === 'radar' && styles.activeTabText]}>
              Live Radar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={MOCK_NEARBY}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.full,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderRadius: radii.full,
  },
  activeTab: {
    backgroundColor: colors.brand.primary,
  },
  tabText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  activeTabText: {
    color: colors.text.primary,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  distance: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  waveBtn: {
    backgroundColor: colors.background.elevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  waveText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});

export default DiscoveryScreen;
