import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';
import { HomeHeader } from '../components/HomeHeader/HomeHeader';
import { useHomeFeed } from '../hooks/useHomeFeed';
import { useHomeStore } from '../store/homeStore';

export function HomeScreen({ navigation }) {
  const { loading, refresh } = useHomeFeed();
  const recommendedUsers = useHomeStore((s) => s.recommendedUsers);

  const handleUserPress = (user) => {
    // Navigate to user profile
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.userCard}
      onPress={() => handleUserPress(item)}
    >
      <Avatar uri={item.avatar} name={item.name} size={64} />
      <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
      <View style={styles.badgeRow}>
        <Text style={styles.tagBadge}>{item.tag}</Text>
        <Text style={styles.levelBadge}>Lv.{item.level}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <HomeHeader
        onNotificationPress={() => navigation.navigate(ROUTES.SCREENS.NOTIFICATIONS)}
        onWalletPress={() => navigation.navigate(ROUTES.SCREENS.WALLET)}
      />

      <View style={styles.bannerContainer}>
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bannerCard}
          onPress={() => navigation.navigate(ROUTES.SCREENS.PARTY_EXPLORE)}
        >
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerBadge}>HOT EVENT</Text>
            <Text style={styles.bannerTitle}>Join Voice Parties Now</Text>
            <Text style={styles.bannerSub}>Hangout, sing, and battle with top hosts!</Text>
          </View>
          <Text style={styles.bannerIcon}>🎙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Popular Creators</Text>
      </View>

      <FlatList
        data={recommendedUsers}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        refreshing={loading}
        onRefresh={refresh}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  bannerCard: {
    backgroundColor: colors.brand.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerBadge: {
    color: colors.brand.amber,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.heavy,
  },
  bannerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    marginTop: 2,
  },
  bannerSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  bannerIcon: {
    fontSize: 40,
    marginLeft: spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  gridContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  userCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  userName: {
    marginTop: spacing.sm,
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  tagBadge: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.secondary,
    fontSize: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
  levelBadge: {
    backgroundColor: colors.brand.amber,
    color: colors.text.inverse,
    fontSize: 10,
    fontWeight: typography.weights.heavy,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.xs,
  },
});

export default HomeScreen;
