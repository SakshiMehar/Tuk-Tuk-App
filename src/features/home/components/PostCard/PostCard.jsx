import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { ThumbsUp } from 'lucide-react-native';
import { vs, ms } from '@shared/utils/responsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PostCard = memo(function PostCard({
  post,
  isLiked = false,
  isFollowing = false,
  onLikeToggle,
  onFollowToggle,
  onCommentPress,
  onMorePress,
  onImagePress,
}) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(SCREEN_WIDTH - 32);

  const galleryUrls = useMemo(() => {
    if (post.imageUrls && post.imageUrls.length > 0) return post.imageUrls;
    if (post.imageUrl) return [post.imageUrl];
    return [];
  }, [post.imageUrls, post.imageUrl]);

  const isGallery = galleryUrls.length > 1;
  const hasImage = galleryUrls.length === 1;

  const handleTextToggle = useCallback(() => {
    setIsTextExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.postOuter}>
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            {post.avatar ? (
              <Image source={{ uri: post.avatar }} style={styles.postAvatar} />
            ) : (
              <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
                <Text style={styles.avatarLetter}>
                  {(post.name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.authorMeta}>
              <Text style={styles.postName}>{post.name || 'User'}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {!post._isOwn && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={() => onFollowToggle && onFollowToggle(post.userId)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.followBtnText,
                    isFollowing && styles.followBtnTextActive,
                  ]}
                >
                  {isFollowing ? '✓ Following' : '👤 Follow'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => onMorePress && onMorePress(post)}
            >
              <Text style={styles.moreBtnText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Text / Caption */}
        {!!post.text && (
          <View style={styles.captionContainer}>
            <Text
              style={styles.postText}
              numberOfLines={isTextExpanded ? undefined : 3}
            >
              {post.text}
            </Text>
            {post.text.length > 120 && (
              <TouchableOpacity onPress={handleTextToggle} activeOpacity={0.7}>
                <Text style={styles.moreText}>
                  {isTextExpanded ? 'Less' : 'More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Single Image */}
        {hasImage && (
          <TouchableOpacity
            activeOpacity={0.94}
            onPress={() => onImagePress && onImagePress({ post, imageUrls: galleryUrls, startIndex: 0 })}
            style={styles.singleImageWrap}
          >
            <Image
              source={{ uri: galleryUrls[0] }}
              style={styles.postImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {/* Multi-Photo Carousel */}
        {isGallery && (
          <View
            style={styles.galleryContainer}
            onLayout={(e) => setGalleryWidth(e.nativeEvent.layout.width)}
          >
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const w = e.nativeEvent.layoutMeasurement.width || 1;
                setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / w));
              }}
            >
              {galleryUrls.map((uri, idx) => (
                <TouchableOpacity
                  key={uri + idx}
                  activeOpacity={0.94}
                  style={[styles.galleryPage, { width: galleryWidth }]}
                  onPress={() =>
                    onImagePress &&
                    onImagePress({ post, imageUrls: galleryUrls, startIndex: idx })
                  }
                >
                  <Image source={{ uri }} style={styles.galleryImg} resizeMode="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Badge 1/N */}
            <View style={styles.galleryCountBadge}>
              <Text style={styles.galleryCountText}>
                {galleryIndex + 1}/{galleryUrls.length}
              </Text>
            </View>

            {/* Dot pager */}
            <View style={styles.galleryDots}>
              {galleryUrls.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.galleryDot,
                    idx === galleryIndex && styles.galleryDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.postFooter}>
          <View style={styles.postFooterLeft}>
            {(post.likeCount || 0) > 0 && (
              <Text style={styles.postLikeCount}>👍 {post.likeCount}</Text>
            )}
          </View>

          <View style={styles.postFooterRight}>
            <TouchableOpacity
              style={[styles.postActionBtn, isLiked && styles.postActionBtnLiked]}
              onPress={() => onLikeToggle && onLikeToggle(post.id)}
              activeOpacity={0.75}
            >
              <ThumbsUp
                size={16}
                color={isLiked ? '#EC4899' : '#64748B'}
                fill={isLiked ? '#EC4899' : 'transparent'}
              />
              <Text style={[styles.postActionLabel, isLiked && { color: '#EC4899' }]}>
                {isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postActionBtn}
              onPress={() => onCommentPress && onCommentPress(post.id)}
              activeOpacity={0.75}
            >
              <Text style={styles.postActionEmoji}>💬</Text>
              <Text style={styles.postActionLabel}>Comment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  postOuter: {
    paddingHorizontal: 16,
    marginBottom: vs(12),
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E2E8F0',
  },
  postAvatarPlaceholder: {
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
  authorMeta: {
    gap: 2,
  },
  postName: {
    fontSize: ms(14),
    fontWeight: '800',
    color: '#0F172A',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F3EEFF',
    borderWidth: 1,
    borderColor: '#E2D3FE',
  },
  followBtnActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  followBtnText: {
    color: '#7C3AED',
    fontSize: ms(11),
    fontWeight: '700',
  },
  followBtnTextActive: {
    color: '#64748B',
  },
  moreBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  moreBtnText: {
    fontSize: 20,
    color: '#64748B',
    lineHeight: 20,
  },
  captionContainer: {
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  postText: {
    fontSize: ms(13.5),
    lineHeight: 20,
    color: '#334155',
  },
  moreText: {
    color: '#7C3AED',
    fontSize: ms(12),
    fontWeight: '700',
    marginTop: 3,
  },
  singleImageWrap: {
    width: '100%',
    height: 240,
    backgroundColor: '#0F172A',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  galleryContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  galleryPage: {
    height: '100%',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  galleryCountBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  galleryCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  galleryDots: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  galleryDotActive: {
    backgroundColor: '#FFFFFF',
    width: 14,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  postFooterLeft: {
    flex: 1,
  },
  postLikeCount: {
    color: '#64748B',
    fontSize: ms(12),
    fontWeight: '600',
  },
  postFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  postActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
  },
  postActionBtnLiked: {
    opacity: 1,
  },
  postActionEmoji: {
    fontSize: 15,
  },
  postActionLabel: {
    color: '#64748B',
    fontSize: ms(12.5),
    fontWeight: '600',
  },
});

export default PostCard;
