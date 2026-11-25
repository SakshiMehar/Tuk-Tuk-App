import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

const resolveNotifIcon = (icon, type) => {
  const str = String(type || '').toLowerCase();
  if (
    str.includes('message') ||
    str.includes('chat') ||
    str.includes('direct_message')
  ) {
    return '💬';
  }
  if (str.includes('gift')) return '🎁';
  if (str.includes('like') || str.includes('heart')) return '👍';
  if (str.includes('follow') || str.includes('friend')) return '👤';
  if (str.includes('party') || str.includes('room') || str.includes('voice')) {
    return '🎉';
  }
  if (
    icon &&
    typeof icon === 'string' &&
    icon.trim().length > 0 &&
    icon !== '🔔' &&
    icon.length <= 4
  ) {
    return icon;
  }
  return '🔔';
};

export const NotificationsModal = memo(function NotificationsModal({
  visible,
  notifications = [],
  unreadNotifications = [],
  loading = false,
  onClose,
  onPressNotification,
  onMarkAllRead,
}) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.notifOverlay}>
        <TouchableOpacity
          style={styles.notifBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <SafeAreaView style={styles.notifPanel}>
          <LinearGradient
            colors={['#1a0a2e', '#16082a', '#0d0618']}
            style={StyleSheet.absoluteFill}
          />

          {/* Header */}
          <View style={styles.notifHeader}>
            <Text style={styles.notifTitle}>Notifications</Text>
            <View style={styles.notifHeaderRight}>
              <TouchableOpacity
                style={styles.notifMarkAll}
                onPress={onMarkAllRead}
                activeOpacity={0.75}
              >
                <Text style={styles.notifMarkAllText}>Mark all read</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                style={styles.notifCloseBtn}
                activeOpacity={0.75}
              >
                <Text style={styles.notifCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Glowing divider */}
          <LinearGradient
            colors={['transparent', '#7c4dff', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.notifDivider}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {loading ? (
              <View style={styles.notifStateBox}>
                <ActivityIndicator size="small" color="#7c4dff" />
                <Text style={styles.notifStateText}>
                  Loading notifications...
                </Text>
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.notifStateBox}>
                <Text style={styles.notifStateEmoji}>🔔</Text>
                <Text style={styles.notifStateText}>
                  No notifications yet
                </Text>
              </View>
            ) : (
              notifications.map((notif, index) => {
                const notifId = notif.id ?? notif._id ?? `notif_${index}`;
                const isUnread =
                  unreadNotifications.includes(notifId) ||
                  notif.unread === true ||
                  notif.read === false ||
                  notif.isRead === false;

                const avatarUri =
                  notif.avatar || notif.senderAvatar || notif.userAvatar;
                const rightImageUri =
                  notif.imageUrl || notif.image || notif.mediaUrl;
                const displaySub =
                  notif.message ?? notif.subtitle ?? notif.body ?? '';
                const displayTime = notif.time ?? notif.createdAt ?? '';
                const displayTitle =
                  notif.title ?? notif.senderName ?? 'Tuk-Tuk';

                return (
                  <TouchableOpacity
                    key={String(notifId)}
                    style={[
                      styles.notifItem,
                      isUnread && styles.notifItemUnread,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onPressNotification && onPressNotification(notif)}
                  >
                    {isUnread && <View style={styles.unreadDot} />}

                    {/* Left: System icon related to notification */}
                    <View style={styles.notifAvatarWrapper}>
                      <LinearGradient
                        colors={['#3d1a6e', '#7c4dff']}
                        style={styles.notifSystemIcon}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={{ fontSize: 24 }}>
                          {resolveNotifIcon(notif.icon, notif.type)}
                        </Text>
                      </LinearGradient>
                    </View>

                    {/* Middle: Title, text message & timestamp */}
                    <View style={styles.notifTextCol}>
                      <Text style={styles.notifItemTitle} numberOfLines={1}>
                        {displayTitle}
                      </Text>
                      {displaySub ? (
                        <Text style={styles.notifItemSub} numberOfLines={2}>
                          {displaySub}
                        </Text>
                      ) : null}
                      {displayTime ? (
                        <Text style={styles.notifTime}>{displayTime}</Text>
                      ) : null}
                    </View>

                    {/* Right: Small image preview thumbnail (like Instagram notifications) */}
                    {rightImageUri ? (
                      <View style={styles.notifRightImageWrap}>
                        <Image
                          source={{ uri: rightImageUri }}
                          style={styles.notifRightImage}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  notifOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  notifBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  notifPanel: {
    height: '85%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#0d0618',
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  notifTitle: {
    color: '#ffffff',
    fontSize: ms(20),
    fontWeight: '800',
  },
  notifHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notifMarkAll: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  notifMarkAllText: {
    color: '#b388ff',
    fontSize: ms(13),
    fontWeight: '700',
  },
  notifCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCloseTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: ms(14),
    fontWeight: '700',
  },
  notifDivider: {
    height: 1,
    width: '100%',
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 16,
  },
  notifStateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  notifStateEmoji: {
    fontSize: 44,
  },
  notifStateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: ms(14),
    fontWeight: '600',
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginBottom: 8,
    position: 'relative',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  notifItemUnread: {
    backgroundColor: 'rgba(124,77,255,0.12)',
    borderColor: 'rgba(124,77,255,0.3)',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7c4dff',
  },
  notifAvatarWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  notifSystemIcon: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTextCol: {
    flex: 1,
    gap: 3,
  },
  notifItemTitle: {
    color: '#ffffff',
    fontSize: ms(14.5),
    fontWeight: '700',
  },
  notifItemSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: ms(12.5),
    lineHeight: ms(17),
  },
  notifTime: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: ms(11),
    marginTop: 2,
  },
  notifRightImageWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a0a2e',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  notifRightImage: {
    width: '100%',
    height: '100%',
  },
});

export default NotificationsModal;
