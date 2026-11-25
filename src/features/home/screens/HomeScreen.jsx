import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, StatusBar, TouchableOpacity, Text } from 'react-native';
import { colors } from '@shared/theme';
import { Toast, EmptyState, AppBackground } from '@shared/components';
import { ROUTES } from '@navigation/navigationConstants';
import { useRouter } from '@shared/compat/expoRouter';
import { homeApi } from '../api/homeApi';
import {
  fetchNotificationsData,
  markAllNotificationsAsRead,
  markNotificationsAsRead,
  loadUnreadNotificationCount,
} from '@/services/notificationService';
import { navigateFromNotification } from '@/utils/notificationNavigation';
import { websocketService } from '@shared/services/websocket/websocketService';

// Feature components
import {
  HomeHeader,
  FeatureCards,
  PlaySection,
  PopularRooms,
  FeedTabs,
  PostCard,
  BannerSlider,
  PostFAB,
} from '../components';

// Feature modals
import {
  PostCreateModal,
  PostMoreModal,
  CommentModal,
  SearchModal,
  NotificationsModal,
  DailyGiftsModal,
  GenderPickerModal,
  DiamondRechargeModal,
  ComingSoonModal,
  ReportReasonModal,
  MorningLoginRewardModal,
} from '../modals';
import { getMorningRewardStatus } from '../../../services/morningRewardService';
import { refreshWalletBalance } from '../../../store/walletStore';

// Feature hooks & store
import { useHomeFeed, usePostInteractions } from '../hooks';
import { useHomeStore } from '../store/homeStore';

const TAB_EMPTY_COPY = {
  'For You': {
    emoji: '✨',
    title: 'Nothing here yet',
    subtitle: 'Posts picked for you will show up here.',
  },
  Online: {
    emoji: '🟢',
    title: "No one's online right now",
    subtitle: 'Active people will appear here when they come online.',
  },
  Following: {
    emoji: '👥',
    title: 'No posts from following',
    subtitle: 'Follow creators and friends to see their latest moments.',
  },
  New: {
    emoji: '🆕',
    title: 'No new posts',
    subtitle: "Fresh moments will appear here as they're shared.",
  },
};

export function HomeScreen({ navigation }) {
  const router = useRouter();

  // 1. Data & Lifecycle
  const { refreshing, refresh, loadMore, loadTabPosts } = useHomeFeed();
  const { handleLike, handleFollow, handleDelete, handleCreatePost, handleShare } =
    usePostInteractions();

  // 2. Selectors from Home Store
  const userProfile = useHomeStore((s) => s.userProfile);
  const walletDiamonds = useHomeStore((s) => s.walletDiamonds);
  const activeUsers = useHomeStore((s) => s.activeUsers);
  const featuredUserAvatar = useHomeStore((s) => s.featuredUserAvatar);
  const selectedTab = useHomeStore((s) => s.selectedTab);
  const setSelectedTab = useHomeStore((s) => s.setSelectedTab);
  const roomFilter = useHomeStore((s) => s.roomFilter);
  const setRoomFilter = useHomeStore((s) => s.setRoomFilter);
  const roomLoading = useHomeStore((s) => s.roomLoading);
  const bannerSlides = useHomeStore((s) => s.bannerSlides);
  const popularRooms = useHomeStore((s) => s.popularRooms);
  const feedPosts = useHomeStore((s) => s.feedPosts);
  const feedLoading = useHomeStore((s) => s.feedLoading);
  const likedPostIds = useHomeStore((s) => s.likedPostIds);
  const followingUserIds = useHomeStore((s) => s.followingUserIds);
  const notifications = useHomeStore((s) => s.notifications);
  const unreadNotifications = useHomeStore((s) => s.unreadNotifications);
  const unreadCount = useHomeStore((s) => s.unreadCount);
  const notificationsLoading = useHomeStore((s) => s.notificationsLoading);
  const setNotifications = useHomeStore((s) => s.setNotifications);
  const setUnreadNotifications = useHomeStore((s) => s.setUnreadNotifications);
  const setUnreadCount = useHomeStore((s) => s.setUnreadCount);
  const setNotificationsLoading = useHomeStore((s) => s.setNotificationsLoading);
  const modals = useHomeStore((s) => s.modals);
  const setModalVisible = useHomeStore((s) => s.setModalVisible);

  // 3. Local UI state
  const [activeBanner, setActiveBanner] = useState(0);
  const [toastMessage, setToastMessage] = useState('');
  const [morningRewardVisible, setMorningRewardVisible] = useState(false);
  const [morningRewardStatus, setMorningRewardStatus] = useState(null);
  const morningRewardCheckedRef = React.useRef(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // ── Morning Login Reward Check (5 AM – 10 AM) ──
  useEffect(() => {
    // Check morning login reward status when user opens the app
    const timer = setTimeout(() => {
      getMorningRewardStatus()
        .then((status) => {
          if (status?.eligible === true && !status?.alreadyClaimed) {
            setMorningRewardStatus(status);
            setMorningRewardVisible(true);
          }
        })
        .catch((err) => {
          console.warn('[HomeScreen] Morning reward check error:', err?.message || err);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Fetch initial unread notification count
  useEffect(() => {
    loadUnreadNotificationCount()
      .then((count) => {
        if (typeof count === 'number') {
          setUnreadCount(count);
        }
      })
      .catch(() => {});
  }, [setUnreadCount]);

  // Dynamic active users count from backend and real-time presence updates
  useEffect(() => {
    let isMounted = true;
    homeApi
      .getActiveUsersCount()
      .then((count) => {
        if (isMounted && typeof count === 'number' && count > 0) {
          useHomeStore.getState().setActiveUsers(count);
        }
      })
      .catch(() => {});

    const interval = setInterval(() => {
      homeApi
        .getActiveUsersCount()
        .then((count) => {
          if (isMounted && typeof count === 'number' && count > 0) {
            useHomeStore.getState().setActiveUsers(count);
          }
        })
        .catch(() => {});
    }, 20000);

    const unsubWs = websocketService.subscribe('/topic/presence', (payload) => {
      if (isMounted && payload && payload.activeUsers != null) {
        useHomeStore.getState().setActiveUsers(Number(payload.activeUsers));
      }
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typeof unsubWs === 'function') unsubWs();
    };
  }, []);

  // Open notifications modal and fetch real-time notifications
  const openNotif = useCallback(async () => {
    setModalVisible('notifications', true);
    setNotificationsLoading(true);
    try {
      const { content, unreadCount: count } = await fetchNotificationsData({
        page: 0,
        size: 30,
      });
      if (Array.isArray(content)) {
        setNotifications(content);
        const unreadIds = content
          .filter(
            (n) => n.unread === true || n.read === false || n.isRead === false
          )
          .map((n) => n.id ?? n._id);
        setUnreadNotifications(unreadIds);
      }
      if (typeof count === 'number') {
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn('[HomeScreen] Failed to load notifications on open:', err?.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, [setModalVisible, setNotifications, setUnreadNotifications, setUnreadCount, setNotificationsLoading]);

  // Mark all notifications as read
  const handleMarkAllRead = useCallback(async () => {
    const prevUnread = unreadNotifications;
    const prevCount = unreadCount;
    setUnreadNotifications([]);
    setUnreadCount(0);
    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error('[HomeScreen] markAllNotificationsAsRead failed:', error);
      setUnreadNotifications(prevUnread);
      setUnreadCount(prevCount);
    }
  }, [unreadNotifications, unreadCount, setUnreadNotifications, setUnreadCount]);

  // Handle tapping a notification
  const handleNotificationPress = useCallback(
    async (notif) => {
      if (!notif) return;
      const notifId = notif.id ?? notif._id;
      if (unreadNotifications.includes(notifId)) {
        setUnreadNotifications(unreadNotifications.filter((id) => id !== notifId));
        setUnreadCount(Math.max(0, unreadCount - 1));
        markNotificationsAsRead([notifId]).catch(() => {});
      }
      setModalVisible('notifications', false);

      setTimeout(async () => {
        try {
          await navigateFromNotification(router, notif);
        } catch (navErr) {
          console.error('[HomeScreen] Navigation error on notification tap:', navErr);
        }
      }, 150);
    },
    [unreadNotifications, unreadCount, router, setModalVisible, setUnreadNotifications, setUnreadCount]
  );

  // 4. Tab selection handler
  const handleTabPress = useCallback(
    (tab) => {
      setSelectedTab(tab);
      loadTabPosts(tab);
    },
    [setSelectedTab, loadTabPosts]
  );

  // 4b. Room filter selection handler
  const handleRoomFilterChange = useCallback(
    async (filter) => {
      setRoomFilter(filter);
      useHomeStore.getState().setRoomLoading(true);
      try {
        const rooms = await homeApi.getPopularRooms(filter);
        useHomeStore.getState().setPopularRooms(rooms || []);
      } catch (err) {
        console.warn('[HomeScreen] handleRoomFilterChange error:', err);
      } finally {
        useHomeStore.getState().setRoomLoading(false);
      }
    },
    [setRoomFilter]
  );

  // 5. Interleaved feed list data (posts + promo banner at position 2)
  const feedData = useMemo(() => {
    if (feedPosts.length === 0) return [];
    if (feedPosts.length <= 2) {
      return feedPosts.map((p) => ({ ...p, _type: 'post' }));
    }
    return [
      ...feedPosts.slice(0, 2).map((p) => ({ ...p, _type: 'post' })),
      { id: '__promo_banner__', _type: 'banner' },
      ...feedPosts.slice(2).map((p) => ({ ...p, _type: 'post' })),
    ];
  }, [feedPosts]);

  const renderFeedItem = useCallback(
    ({ item }) => {
      if (item._type === 'banner') {
        return (
          <BannerSlider
            slides={bannerSlides}
            activeBanner={activeBanner}
            onBannerChange={setActiveBanner}
            onPressSlide={() => navigation.navigate(ROUTES.SCREENS.PARTY_EXPLORE)}
          />
        );
      }

      return (
        <PostCard
          post={item}
          isLiked={likedPostIds.includes(item.id)}
          isFollowing={followingUserIds.includes(item.userId)}
          currentUserId={userProfile?.id || userProfile?.userId}
          onLikeToggle={() => handleLike(item.id)}
          onFollowToggle={() => handleFollow(item.userId)}
          onCommentPress={() => setModalVisible('commentPostId', item.id)}
          onMorePress={() => setModalVisible('postMore', item)}
          onImagePress={(imgData) => showToast('Viewing photo')}
          onAvatarPress={(post) => {
            if (post?.userId) {
              navigation.navigate(ROUTES.TABS.PROFILE, { userId: post.userId });
            }
          }}
        />
      );
    },
    [
      bannerSlides,
      activeBanner,
      likedPostIds,
      followingUserIds,
      userProfile?.id,
      userProfile?.userId,
      handleLike,
      handleFollow,
      setModalVisible,
      navigation,
      showToast,
    ]
  );

  // 6. Header containing all top visual components
  const renderListHeader = useMemo(() => {
    return (
      <View>
        <HomeHeader
          userProfile={userProfile}
          walletDiamonds={walletDiamonds}
          activeUsers={activeUsers}
          featuredUserAvatar={featuredUserAvatar}
          unreadNotificationsCount={unreadCount > 0 ? unreadCount : unreadNotifications.length}
          onAvatarPress={() => navigation.navigate(ROUTES.TABS.PROFILE)}
          onDiamondRechargePress={() => setModalVisible('recharge', true)}
          onNotificationPress={openNotif}
          onJoinActivePress={() => navigation.navigate(ROUTES.TABS.CHAT)}
          onJoinVoicePartyPress={() =>
            navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: '101' })
          }
        />

        <FeatureCards
          onCardPress={(card) => {
            if (card.routeKey === 'find-friends') {
              navigation.navigate(ROUTES.TABS.DISCOVERY);
            } else {
              setModalVisible('comingSoon', card.title);
            }
          }}
          onNearbyPress={() => {
            showToast('Showing nearby friends around you 📍');
            navigation.navigate(ROUTES.TABS.DISCOVERY);
          }}
        />

        <PlaySection
          onSeeAllPress={() => setModalVisible('comingSoon', 'Games')}
          onItemPress={(item) => {
            if (
              item.key === 'personality-test' ||
              item.route === '/personality-test' ||
              item.label === 'Personality Test'
            ) {
              navigation.navigate(ROUTES.SCREENS.PERSONALITY_TEST);
            } else {
              setModalVisible('comingSoon', item.label);
            }
          }}
        />

        <PopularRooms
          rooms={popularRooms}
          activeFilter={roomFilter}
          loading={roomLoading}
          onFilterChange={handleRoomFilterChange}
          onRoomPress={(room) => {
            const targetRoomId = String(room?.roomId || room?.id || '');
            navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: targetRoomId, party: 'true' });
          }}
        />

        <FeedTabs selectedTab={selectedTab} onTabPress={handleTabPress} />
      </View>
    );
  }, [
    userProfile,
    walletDiamonds,
    activeUsers,
    featuredUserAvatar,
    unreadCount,
    unreadNotifications.length,
    popularRooms,
    roomFilter,
    roomLoading,
    selectedTab,
    setModalVisible,
    handleRoomFilterChange,
    handleTabPress,
    navigation,
    showToast,
    openNotif,
  ]);

  const listEmpty = useMemo(() => {
    if (feedLoading) {
      return (
        <View style={styles.centerLoading}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
        </View>
      );
    }
    const copy = TAB_EMPTY_COPY[selectedTab] || TAB_EMPTY_COPY['For You'];
    return (
      <EmptyState
        title={copy.title}
        description={copy.subtitle}
        iconText={copy.emoji}
      />
    );
  }, [feedLoading, selectedTab]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <AppBackground />

      {/* Main Virtualized Feed */}
      <FlatList
        data={feedData}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderFeedItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={listEmpty}
        refreshing={refreshing}
        onRefresh={refresh}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
      />

      {/* Floating Action Button */}
      <PostFAB onPress={() => setModalVisible('createPost', true)} />

      {/* ── Feature Modals ── */}
      <PostCreateModal
        visible={modals.createPost}
        onClose={() => setModalVisible('createPost', false)}
        onSubmit={handleCreatePost}
      />

      <PostMoreModal
        visible={Boolean(modals.postMore)}
        post={modals.postMore}
        onClose={() => setModalVisible('postMore', null)}
        onShareSocial={handleShare}
        onDelete={handleDelete}
        onAction={(actionId, post) => {
          setModalVisible('postMore', null);
          if (actionId === 'report') {
            setModalVisible('reportTarget', post);
          } else if (actionId === 'block') {
            showToast(`Blocked ${post.name}`);
          } else {
            showToast('Feedback noted. Thank you!');
          }
        }}
      />

      <CommentModal
        visible={Boolean(modals.commentPostId)}
        postId={modals.commentPostId}
        onClose={() => setModalVisible('commentPostId', null)}
      />

      <SearchModal
        visible={modals.search}
        onClose={() => setModalVisible('search', false)}
        onSelectUser={() => {
          setModalVisible('search', false);
          navigation.navigate(ROUTES.TABS.PROFILE);
        }}
      />

      <NotificationsModal
        visible={modals.notifications}
        notifications={notifications}
        unreadNotifications={unreadNotifications}
        loading={notificationsLoading}
        onClose={() => setModalVisible('notifications', false)}
        onMarkAllRead={handleMarkAllRead}
        onPressNotification={handleNotificationPress}
      />

      <DailyGiftsModal
        visible={modals.gifts}
        onClose={() => setModalVisible('gifts', false)}
        onClaimFreeGift={() => {
          setModalVisible('gifts', false);
          showToast('Claimed 500 Daily Free Diamonds! 💎');
        }}
      />

      <DiamondRechargeModal
        visible={modals.recharge}
        currentDiamonds={walletDiamonds}
        onClose={() => setModalVisible('recharge', false)}
        onSelectPackage={(pkg) => {
          setModalVisible('recharge', false);
          showToast(`Recharge successful: +${pkg.diamonds} Diamonds! 💎`);
        }}
      />

      <GenderPickerModal
        visible={modals.genderPicker}
        onSelect={({ gender, country }) => {
          setModalVisible('genderPicker', false);
          showToast(`Welcome! Identity set to ${gender} (${country}) ✨`);
        }}
      />

      <ComingSoonModal
        feature={modals.comingSoon}
        onClose={() => setModalVisible('comingSoon', null)}
      />

      <ReportReasonModal
        visible={Boolean(modals.reportTarget)}
        targetLabel={modals.reportTarget?.name}
        onClose={() => setModalVisible('reportTarget', null)}
        onSubmit={(reason) => {
          setModalVisible('reportTarget', null);
          showToast('Report submitted. Thank you for keeping Tuk-Tuk safe!');
        }}
      />

      {/* ── Morning Login Reward Modal (5 AM – 10 AM) ── */}
      <MorningLoginRewardModal
        visible={morningRewardVisible}
        statusData={morningRewardStatus}
        onClose={() => setMorningRewardVisible(false)}
        onClaimSuccess={(awarded) => {
          setMorningRewardStatus((prev) => (prev ? { ...prev, eligible: false, alreadyClaimed: true } : null));
          showToast(`+${awarded} Diamonds credited to your wallet! 💎`);
          refreshWalletBalance().catch(() => {});
        }}
      />

      <Toast message={toastMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },

});

export default HomeScreen;
