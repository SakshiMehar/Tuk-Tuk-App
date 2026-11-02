import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { ThumbsUp } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';
import { homeApi } from '../api/homeApi';
import { ms } from '@shared/utils/responsive';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const QUICK_EMOJIS = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

export const CommentModal = memo(function CommentModal({
  visible,
  postId,
  onClose,
}) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [likedComments, setLikedComments] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!visible || !postId) return;
    setLoading(true);
    homeApi
      .getPostComments(postId)
      .then((data) => setComments(data || []))
      .finally(() => setLoading(false));
  }, [visible, postId]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    const draft = text.trim();
    setText('');
    setSending(true);

    const temp = {
      id: `c_${Date.now()}`,
      text: draft,
      user: { name: 'You' },
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, temp]);

    try {
      await homeApi.addComment(postId, draft);
    } catch {
      // rollback or keep
    } finally {
      setSending(false);
    }
  }, [text, sending, postId]);

  const handleQuickEmoji = useCallback((emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  const toggleCommentLike = useCallback((id) => {
    setLikedComments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Comments List */}
          <ScrollView
            style={styles.commentsList}
            contentContainerStyle={styles.commentsListContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator color="#7c4dff" style={{ marginVertical: 30 }} />
            ) : comments.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={styles.emptyTitle}>No comments yet</Text>
                <Text style={styles.emptySub}>Be the first to say something!</Text>
              </View>
            ) : (
              comments.map((item) => {
                const isLiked = likedComments.includes(item.id);
                return (
                  <View key={item.id} style={styles.commentRow}>
                    <View style={styles.avatarWrap}>
                      <Image
                        source={{
                          uri:
                            item.user?.avatar ||
                            'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120',
                        }}
                        style={styles.avatarImg}
                      />
                    </View>

                    <View style={styles.commentBody}>
                      <Text style={styles.username}>{item.user?.name || 'User'}</Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => toggleCommentLike(item.id)}
                    >
                      <ThumbsUp
                        size={15}
                        color={isLiked ? '#ff4ea3' : 'rgba(255,255,255,0.4)'}
                        fill={isLiked ? '#ff4ea3' : 'transparent'}
                      />
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Quick Reaction Emojis */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.emojiBar}
            contentContainerStyle={styles.emojiBarContent}
          >
            {QUICK_EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={styles.emojiBtn}
                onPress={() => handleQuickEmoji(e)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiTxt}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Composer Input */}
          <View style={styles.composerRow}>
            <TextInput
              ref={inputRef}
              style={styles.composerInput}
              placeholder="Add a comment…"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={text}
              onChangeText={setText}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  text.trim() ? ['#7c4dff', '#ff4ea3'] : ['#2a2a3e', '#2a2a3e']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendBtn}
              >
                <Text style={styles.sendIcon}>➤</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
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
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  topGlow: {
    height: 2,
    width: '100%',
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: '800',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  commentsList: {
    flex: 1,
  },
  commentsListContent: {
    paddingBottom: 16,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 38,
  },
  emptyTitle: {
    color: '#D4B8FF',
    fontSize: ms(15),
    fontWeight: '700',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: ms(12),
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatarWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#1E1B4B',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  commentBody: {
    flex: 1,
    gap: 2,
  },
  username: {
    color: '#E0CCFF',
    fontSize: ms(13),
    fontWeight: '700',
  },
  commentText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: ms(13),
    lineHeight: 18,
  },
  heartBtn: {
    padding: 6,
  },
  emojiBar: {
    maxHeight: 44,
    marginVertical: 8,
  },
  emojiBarContent: {
    gap: 6,
  },
  emojiBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiTxt: {
    fontSize: 18,
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  composerInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: ms(13.5),
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    color: 'white',
    fontSize: 16,
    marginLeft: 2,
  },
});

export default CommentModal;
