import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';

const MOCK_NOTIFS = [
  { id: 'n1', title: 'Gift Received!', body: 'Zoya Khan sent you a Super Rocket in Midnight Chill Lounge.', time: '10m ago', icon: '🚀' },
  { id: 'n2', title: 'New Follower', body: 'Kabir Singhania started following you.', time: '1h ago', icon: '👤' },
  { id: 'n3', title: 'Room Invitation', body: 'Samir invited you to co-host a party room.', time: '3h ago', icon: '🎙️' },
];

export function NotificationsScreen({ navigation }) {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 32 }} />
      </View>

      <FlatList
        data={MOCK_NOTIFS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.text.primary,
    fontSize: 32,
    lineHeight: 32,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  time: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 4,
  },
});

export default NotificationsScreen;
