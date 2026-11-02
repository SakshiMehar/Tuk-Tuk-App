import React, { memo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from '@shared/components';

const SOCIAL_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', bg: '#25D366', emoji: '💬' },
  { id: 'telegram', label: 'Telegram', bg: '#2CA5E0', emoji: '✈️' },
  { id: 'instagram', label: 'Instagram', bg: '#E1306C', emoji: '📸' },
  { id: 'facebook', label: 'Facebook', bg: '#1877F2', emoji: '📘' },
  { id: 'twitter', label: 'X', bg: '#14171A', emoji: '🐦' },
  { id: 'more', label: 'More', bg: '#7c4dff', emoji: '⋯' },
];

const MENU_ACTIONS = [
  { id: 'interested', label: 'Interested', emoji: '👍', color: '#7c4dff' },
  { id: 'not_interested', label: 'Not Interested', emoji: '👎', color: '#ff4ea3' },
  { id: 'report', label: 'Report User', emoji: '🚩', color: '#ff6b35' },
  { id: 'block', label: 'Block User', emoji: '🚫', color: '#ff3f72' },
];

export const PostMoreModal = memo(function PostMoreModal({
  visible,
  post,
  friends = [],
  onClose,
  onShareSocial,
  onAction,
  onDelete,
}) {
  if (!post) return null;

  const isOwnPost = post._isOwn;
  const filteredActions = isOwnPost
    ? MENU_ACTIONS.filter((a) => a.id !== 'block')
    : MENU_ACTIONS;

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

        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1e0a3c', '#16082a', '#0d0618']}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={['#7c4dff', '#ff4ea3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlow}
          />

          <View style={styles.handle} />

          {/* Social Platforms Row */}
          <Text style={styles.sectionTitle}>Share On</Text>
          <View style={styles.platformsRow}>
            {SOCIAL_PLATFORMS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.platformItem}
                onPress={() => onShareSocial && onShareSocial(post, p.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.platformIcon, { backgroundColor: p.bg }]}>
                  <Text style={styles.platformEmoji}>{p.emoji}</Text>
                </View>
                <Text style={styles.platformLabel}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <LinearGradient
            colors={['transparent', 'rgba(124,77,255,0.4)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* Actions List */}
          {filteredActions.map((action, i) => (
            <View key={action.id}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => onAction && onAction(action.id, post)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: action.color + '25' },
                  ]}
                >
                  <Text style={styles.actionEmoji}>{action.emoji}</Text>
                </View>

                <Text
                  style={[
                    styles.actionLabel,
                    action.id === 'block' && { color: '#ff3f72' },
                  ]}
                >
                  {action.id === 'block' && post?.name
                    ? `Block ${post.name}`
                    : action.label}
                </Text>

                <Text style={styles.actionChevron}>›</Text>
              </TouchableOpacity>
              {i < filteredActions.length - 1 && <View style={styles.actionDivider} />}
            </View>
          ))}

          {/* Delete Option (if author is own user) */}
          {isOwnPost && (
            <>
              <View style={styles.actionDivider} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={() => onDelete && onDelete(post.id)}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#ff3f7225' }]}>
                  <Text style={styles.actionEmoji}>🗑️</Text>
                </View>
                <Text style={[styles.actionLabel, { color: '#ff3f72' }]}>
                  Delete Post
                </Text>
                <Text style={styles.actionChevron}>›</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 20 }} />
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
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingTop: 0,
  },
  topGlow: {
    height: 2,
    width: '100%',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#b388ff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  platformsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  platformItem: {
    alignItems: 'center',
    gap: 6,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  platformEmoji: {
    fontSize: 22,
  },
  platformLabel: {
    color: '#c4a8ff',
    fontSize: 10,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    flex: 1,
    color: '#f0e6ff',
    fontSize: 15,
    fontWeight: '600',
  },
  actionChevron: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 20,
    fontWeight: '300',
  },
  actionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 52,
  },
});

export default PostMoreModal;
