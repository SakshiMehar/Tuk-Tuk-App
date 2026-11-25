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
import { API_BASE_URL } from '@/config/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const toAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('ph://')
  ) {
    return trimmed;
  }

  if (
    trimmed.includes('.ngrok-free.dev') ||
    trimmed.includes('.ngrok.io') ||
    trimmed.includes('localhost:') ||
    trimmed.includes('127.0.0.1:') ||
    trimmed.includes('10.0.2.2:')
  ) {
    try {
      const match = trimmed.match(/^https?:\/\/[^\/]+(\/.*)$/);
      if (match && match[1]) {
        return `${API_BASE_URL}${match[1]}`;
      }
    } catch {}
  }

  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  return `${API_BASE_URL}/${trimmed}`;
};

export const PostCard = memo(function PostCard({
  post,
  isLiked = false,
  isFollowing = false,
  currentUserId,
  onLikeToggle,
  onFollowToggle,
  onCommentPress,
  onMorePress,
  onImagePress,
  onAvatarPress,
}) {
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryWidth, setGalleryWidth] = useState(SCREEN_WIDTH - 32);
  const [imgFailed, setImgFailed] = useState(false);

  // Normalize image gallery URLs from various API response shapes
  const galleryUrls = useMemo(() => {
    const single =
      post?.imageUrl ||
      post?.mediaUrl ||
      post?.image ||
      post?._localMediaUri ||
      null;

    const rawList = post?.imageUrls?.length
      ? post.imageUrls
      : post?.mediaUrls?.length
        ? post.mediaUrls
        : post?.images?.length
          ? post.images
          : single
            ? [single]
            : [];
    return rawList
      .map((item) => (typeof item === 'string' ? item : item?.url || item?.imageUrl || item?.mediaUrl))
      .filter(Boolean)
      .map(toAbsoluteUrl);
  }, [post?.imageUrls, post?.imageUrl, post?.mediaUrls, post?.mediaUrl, post?.images, post?.image, post?._localMediaUri]);

  const avatarUrl = useMemo(() => {
    return toAbsoluteUrl(post?.avatar || post?.avatarUrl || post?.profileImage || post?.userAvatar);
  }, [post?.avatar, post?.avatarUrl, post?.profileImage, post?.userAvatar]);

  const hasVideo = Boolean(
    post?.hasVideo ||
    post?.videoUrl ||
    post?.mediaType === 'video' ||
    post?._mediaType === 'video'
  );

  const isGallery = !hasVideo && galleryUrls.length > 1;
  const hasImage = !hasVideo && galleryUrls.length >= 1 && !isGallery;

  const isOwnPost = Boolean(
    post?._isOwn === true ||
    (currentUserId && post?.userId && String(post.userId) === String(currentUserId))
  );

  const handleTextToggle = useCallback(() => {
    setIsTextExpanded((prev) => !prev);
  }, []);

  const handleAuthorPress = useCallback(() => {
    if (onAvatarPress) {
      onAvatarPress(post);
    }
  }, [onAvatarPress, post]);

  const authorName = post?.name || post?.username || post?.authorName || 'User';
  const authorInitial = (authorName || '?')[0].toUpperCase();
  const captionText = post?.text || post?.caption || post?.content || '';
  const likeCount = Number(post?.likeCount ?? post?.likes ?? 0);

  return (
    <View style={styles.postOuter}>
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity
            style={styles.authorRow}
            activeOpacity={0.8}
            onPress={handleAuthorPress}
          >
            {avatarUrl && !imgFailed ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.postAvatar}
                onError={() => setImgFailed(true)}
              />
            ) : (
              <View style={[styles.postAvatar, styles.postAvatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{authorInitial}</Text>
              </View>
            )}
            <View style={styles.authorMeta}>
              <Text style={styles.postName} numberOfLines={1}>
                {authorName}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {!isOwnPost && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={() => onFollowToggle && onFollowToggle(post?.userId)}
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
              activeOpacity={0.7}
            >
              <Text style={styles.moreBtnText}>⋯</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Text / Caption */}
        {!!captionText && (
          <View style={styles.captionContainer}>
            <Text
              style={styles.postText}
              numberOfLines={isTextExpanded ? undefined : 3}
            >
              {captionText}
            </Text>
            {captionText.length > 120 && (
              <TouchableOpacity onPress={handleTextToggle} activeOpacity={0.7}>
                <Text style={styles.moreText}>
                  {isTextExpanded ? 'Less' : 'More'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Video Player Box */}
        {hasVideo && (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() =>
              onImagePress &&
              onImagePress({ post, imageUrls: galleryUrls, startIndex: 0 })
            }
            style={styles.videoBox}
          >
            {galleryUrls[0] ? (
              <Image
                source={{ uri: galleryUrls[0] }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.videoPlaceholder} />
            )}
            <View style={styles.playOverlay}>
              <View style={styles.playBtn}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
            </View>
            {post?.duration && (
              <View style={styles.videoDurationBadge}>
                <Text style={styles.videoDurationText}>{post.duration}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Single Image */}
        {hasImage && (
          <TouchableOpacity
            activeOpacity={0.94}
            onPress={() =>
              onImagePress &&
              onImagePress({ post, imageUrls: galleryUrls, startIndex: 0 })
            }
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
            {likeCount > 0 && (
              <Text style={styles.postLikeCount}>👍 {likeCount}</Text>
            )}
          </View>

          <View style={styles.postFooterRight}>
            <TouchableOpacity
              style={[styles.postActionBtn, isLiked && styles.postActionBtnLiked]}
              onPress={() => onLikeToggle && onLikeToggle(post?.id)}
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
              onPress={() => onCommentPress && onCommentPress(post?.id)}
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
    flex: 1,
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
    flex: 1,
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
  videoBox: {
    width: '100%',
    height: 220,
    backgroundColor: '#0F172A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1E1B4B',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    color: 'white',
    fontSize: 18,
    marginLeft: 3,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  videoDurationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
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
