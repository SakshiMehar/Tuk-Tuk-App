import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Screen } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { getNotifications, markNotificationsRead } from '@/api/notificationApi';

const MOCK_NOTIFS = [
  { id: 'n1', title: 'Gift Received!', body: 'Zoya Khan sent you a Super Rocket in Midnight Chill Lounge.', time: '10m ago', icon: '🚀' },
  { id: 'n2', title: 'New Follower', body: 'Kabir Singhania started following you.', time: '1h ago', icon: '👤' },
  { id: 'n3', title: 'Room Invitation', body: 'Samir invited you to co-host a party room.', time: '3h ago', icon: '🎙️' },
];

export function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getNotifications({ page: 0, size: 30 });
      const list = res?.content ?? res?.data ?? (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        setNotifications(
          list.map((n) => ({
            id: String(n.id || n.notificationId || `notif_${Date.now()}`),
            title: n.title || n.senderName || 'Notification',
            body: n.body || n.message || n.content || '',
            time: n.time || (n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'),
            icon: n.icon || (n.type === 'party' ? '🎉' : n.type === 'gift' ? '🎁' : '🔔'),
          }))
        );
      } else {
        setNotifications(MOCK_NOTIFS);
      }
    } catch {
      setNotifications(MOCK_NOTIFS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifs();
  };

  const handleMarkAllRead = async () => {
    try {
      await markNotificationsRead('all');
    } catch {
      // ignore
    }
  };

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
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>Read All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.brand.primary}
            />
          }
        />
      )}
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
  markReadText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background.secondary,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  body: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  time: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});

export default NotificationsScreen;
