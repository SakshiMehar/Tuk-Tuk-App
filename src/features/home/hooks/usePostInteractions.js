import { useCallback } from 'react';
import { Share, Linking } from 'react-native';
import { useHomeStore } from '../store/homeStore';
import { homeApi } from '../api/homeApi';
import { followUser, unfollowUser } from '@/api/relationshipApi';

export function usePostInteractions() {
  const toggleLikePost = useHomeStore((s) => s.toggleLikePost);
  const toggleFollowUser = useHomeStore((s) => s.toggleFollowUser);
  const deletePostInStore = useHomeStore((s) => s.deletePost);
  const addPostInStore = useHomeStore((s) => s.addPost);
  const setModalVisible = useHomeStore((s) => s.setModalVisible);

  const handleLike = useCallback(
    async (postId) => {
      const wasLiked = useHomeStore.getState().likedPostIds.includes(postId);
      toggleLikePost(postId);
      try {
        if (wasLiked) {
          await homeApi.unlikePost(postId);
        } else {
          await homeApi.likePost(postId);
        }
      } catch (err) {
        console.warn('[usePostInteractions] like/unlike failed:', err?.message);
        // revert optimistic change
        toggleLikePost(postId);
      }
    },
    [toggleLikePost]
  );

  const handleFollow = useCallback(
    async (userId) => {
      if (!userId) return;
      const targetId = String(userId);
      const wasFollowing = useHomeStore.getState().followingUserIds.includes(targetId);
      toggleFollowUser(targetId);
      try {
        if (wasFollowing) {
          await unfollowUser(targetId);
        } else {
          await followUser(targetId);
        }
      } catch (err) {
        console.warn('[usePostInteractions] follow/unfollow failed:', err?.message);
        // revert optimistic change
        toggleFollowUser(targetId);
      }
    },
    [toggleFollowUser]
  );

  const handleDelete = useCallback(
    async (postId) => {
      deletePostInStore(postId);
      setModalVisible('postMore', null);
      try {
        await homeApi.deletePost(postId);
      } catch {
        // ignore
      }
    },
    [deletePostInStore, setModalVisible]
  );

  const handleCreatePost = useCallback(
    async (postData) => {
      const created = await homeApi.createPost(postData);
      const userProfile = useHomeStore.getState().userProfile;
      const formattedPost = {
        id: created.id || `p_${Date.now()}`,
        userId: userProfile?.id || 'u_me',
        name: userProfile?.name || 'You',
        avatar: userProfile?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
        text: postData.caption || '',
        imageUrl: postData.photos?.[0]?.uri || null,
        imageUrls: postData.photos?.map((p) => p.uri) || [],
        hasVideo: postData.mediaType === 'video',
        likeCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
        _isOwn: true,
      };
      addPostInStore(formattedPost);
      setModalVisible('createPost', false);
      return formattedPost;
    },
    [addPostInStore, setModalVisible]
  );

  const handleShare = useCallback(async (post, platformId) => {
    const text = `Check this out on Tuk-Tuk: "${(post?.text || '').slice(0, 80)}..."`;
    if (platformId === 'more' || !platformId) {
      await Share.share({ message: text }).catch(() => {});
      return;
    }

    const deepLinks = {
      whatsapp: `whatsapp://send?text=${encodeURIComponent(text)}`,
      telegram: `tg://msg?text=${encodeURIComponent(text)}`,
      instagram: 'instagram://',
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://tuktuk.app')}`,
      twitter: `twitter://post?message=${encodeURIComponent(text)}`,
    };

    const url = deepLinks[platformId];
    if (url) {
      const canOpen = await Linking.canOpenURL(url).catch(() => false);
      if (canOpen) {
        Linking.openURL(url);
      } else {
        await Share.share({ message: text }).catch(() => {});
      }
    }
  }, []);

  return {
    handleLike,
    handleFollow,
    handleDelete,
    handleCreatePost,
    handleShare,
  };
}

export default usePostInteractions;
