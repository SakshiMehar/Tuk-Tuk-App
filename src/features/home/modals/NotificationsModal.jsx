import React, { memo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from '@shared/components';
import { useHomeStore } from '../store/homeStore';
import { ms } from '@shared/utils/responsive';

export const NotificationsModal = memo(function NotificationsModal({
  visible,
  notifications = [],
  onClose,
  onPressNotification,
}) {
  const unreadNotifications = useHomeStore((s) => s.unreadNotifications);
  const setUnreadNotifications = useHomeStore((s) => s.setUnreadNotifications);

  const handleMarkAllRead = useCallback(() => {
    setUnreadNotifications([]);
  }, [setUnreadNotifications]);

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
            <Text style={styles.title}>Notifications</Text>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
                <Text style={styles.markAllTxt}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <LinearGradient
            colors={['transparent', '#7c4dff', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🔔</Text>
                <Text style={styles.emptyTitle}>No notifications yet</Text>
              </View>
            ) : (
              notifications.map((item) => {
                const isUnread = unreadNotifications.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.notifItem, isUnread && styles.notifItemUnread]}
                    activeOpacity={0.8}
                    onPress={() => onPressNotification && onPressNotification(item)}
                  >
                    {isUnread && <View style={styles.unreadDot} />}

                    <View style={styles.iconBox}>
                      <LinearGradient
                        colors={['#3d1a6e', '#7c4dff']}
                        style={styles.iconGrad}
                      >
                        <Text style={{ fontSize: 20 }}>
                          {item.type === 'party'
                            ? '🎉'
                            : item.type === 'gift'
                            ? '🎁'
                            : '👍'}
                        </Text>
                      </LinearGradient>
                    </View>

                    <View style={styles.metaCol}>
                      <Text style={styles.notifTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.notifMessage} numberOfLines={2}>
                        {item.message}
                      </Text>
                      <Text style={styles.notifTime}>{item.time}</Text>
                    </View>

                    {item.imageUrl && (
                      <Image source={{ uri: item.imageUrl }} style={styles.previewThumb} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
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
    height: '75%',
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
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontWeight: '800',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllTxt: {
    color: '#B388FF',
    fontSize: ms(12),
    fontWeight: '700',
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
  divider: {
    height: 1,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: ms(15),
    fontWeight: '600',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 12,
  },
  notifItemUnread: {
    backgroundColor: 'rgba(124,77,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EC4899',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  iconGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaCol: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    color: '#FFFFFF',
    fontSize: ms(13.5),
    fontWeight: '700',
  },
  notifMessage: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: ms(12),
    lineHeight: 17,
  },
  notifTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    marginTop: 2,
  },
  previewThumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
});

export default NotificationsModal;
