import { useState, useEffect, useCallback, useRef } from 'react';
import { useHomeStore } from '../store/homeStore';
import { homeApi } from '../api/homeApi';

export function useHomeFeed() {
  const [refreshing, setRefreshing] = useState(false);
  const selectedTab = useHomeStore((s) => s.selectedTab);
  const setFeedPosts = useHomeStore((s) => s.setFeedPosts);
  const setFeedLoading = useHomeStore((s) => s.setFeedLoading);
  const setFeedHasMore = useHomeStore((s) => s.setFeedHasMore);
  const setBannerSlides = useHomeStore((s) => s.setBannerSlides);
  const setPopularRooms = useHomeStore((s) => s.setPopularRooms);
  const setUserProfile = useHomeStore((s) => s.setUserProfile);
  const setWalletDiamonds = useHomeStore((s) => s.setWalletDiamonds);
  const setActiveUsers = useHomeStore((s) => s.setActiveUsers);
  const setFeaturedUserAvatar = useHomeStore((s) => s.setFeaturedUserAvatar);
  const setUnreadNotifications = useHomeStore((s) => s.setUnreadNotifications);

  const pageRef = useRef(1);

  const loadInitialData = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await homeApi.getHomeData();
      if (data) {
        if (data.userProfile) setUserProfile(data.userProfile);
        if (data.userProfile?.diamonds) setWalletDiamonds(data.userProfile.diamonds);
        if (data.stats?.activeUsers) setActiveUsers(data.stats.activeUsers);
        if (data.stats?.featuredUserAvatar) setFeaturedUserAvatar(data.stats.featuredUserAvatar);
        if (data.bannerSlides) setBannerSlides(data.bannerSlides);
        if (data.popularRooms) setPopularRooms(data.popularRooms);
        if (data.feedPosts) setFeedPosts(data.feedPosts);
        if (data.notifications) {
          const unread = data.notifications.filter((n) => n.unread).map((n) => n.id);
          setUnreadNotifications(unread);
        }
      }
    } finally {
      setFeedLoading(false);
    }
  }, [
    setFeedLoading,
    setUserProfile,
    setWalletDiamonds,
    setActiveUsers,
    setBannerSlides,
    setPopularRooms,
    setFeedPosts,
    setUnreadNotifications,
  ]);

  const loadTabPosts = useCallback(async (tab) => {
    setFeedLoading(true);
    pageRef.current = 1;
    try {
      const res = await homeApi.refreshFeed(tab, 1);
      setFeedPosts(res.posts || []);
      setFeedHasMore(res.hasMore || false);
    } finally {
      setFeedLoading(false);
    }
  }, [setFeedLoading, setFeedPosts, setFeedHasMore]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
      await loadTabPosts(selectedTab);
    } finally {
      setRefreshing(false);
    }
  }, [loadInitialData, loadTabPosts, selectedTab]);

  const loadMore = useCallback(async () => {
    const hasMore = useHomeStore.getState().feedHasMore;
    const loading = useHomeStore.getState().feedLoading;
    if (!hasMore || loading) return;

    pageRef.current += 1;
    const nextPage = pageRef.current;
    try {
      const res = await homeApi.refreshFeed(selectedTab, nextPage);
      if (res.posts && res.posts.length > 0) {
        useHomeStore.setState((s) => ({
          feedPosts: [...s.feedPosts, ...res.posts],
          feedHasMore: res.hasMore || false,
        }));
      }
    } catch {
      // ignore
    }
  }, [selectedTab]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return {
    refreshing,
    refresh,
    loadMore,
    loadTabPosts,
  };
}

export default useHomeFeed;
