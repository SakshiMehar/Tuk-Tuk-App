import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Screen, Avatar, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';
import { useAuthStore } from '@store/auth/authStore';
import { useProfileStore } from '../store/profileStore';
import { LevelBadge, VipBadge } from '../components/LevelBadge/LevelBadge';
import { UserStats } from '../components/UserStats/UserStats';

export function ProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const stats = useProfileStore((s) => s.stats);

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <TouchableOpacity
            style={styles.settingsBtn}
            onPress={() => navigation.navigate(ROUTES.SCREENS.SETTINGS)}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <Avatar
            uri={user?.avatar}
            name={user?.name || 'Tuk-Tuk Star'}
            size={84}
          />
          <Text style={styles.name}>{user?.name || 'Tuk-Tuk Star'}</Text>
          <Text style={styles.phone}>{user?.phone || '+91 ••••• •••••'}</Text>

          <View style={styles.badgesRow}>
            <LevelBadge level={user?.level || 1} />
            <VipBadge isVip={user?.isVip} vipLevel={1} />
          </View>

          <UserStats
            followers={stats.followers}
            following={stats.following}
            diamonds={user?.diamonds || 500}
          />
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.SCREENS.EDIT_PROFILE)}
          >
            <Text style={styles.menuIcon}>✏️</Text>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.SCREENS.WALLET)}
          >
            <Text style={styles.menuIcon}>💎</Text>
            <Text style={styles.menuLabel}>Wallet & Diamonds</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate(ROUTES.SCREENS.PARTY_EXPLORE)}
          >
            <Text style={styles.menuIcon}>🎙️</Text>
            <Text style={styles.menuLabel}>Voice Parties</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Button
          title="Log Out"
          variant="outline"
          size="md"
          onPress={logout}
          style={styles.logoutBtn}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  settingsBtn: {
    padding: spacing.xs,
  },
  settingsIcon: {
    fontSize: 22,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  name: {
    color: colors.text.primary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  phone: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  menuSection: {
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.xs,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  menuLabel: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  menuArrow: {
    color: colors.text.muted,
    fontSize: 22,
  },
  logoutBtn: {
    marginTop: spacing.xl,
    borderColor: colors.state.error,
  },
});

export default ProfileScreen;
