import React, { useCallback, useMemo, useState } from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { colors } from '@shared/theme';
import { Toast, EmptyState, AppBackground } from '@shared/components';
import { ROUTES } from '@navigation/navigationConstants';
import { homeApi } from '../api/homeApi';

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
} from '../modals';

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
  const bannerSlides = useHomeStore((s) => s.bannerSlides);
  const popularRooms = useHomeStore((s) => s.popularRooms);
  const feedPosts = useHomeStore((s) => s.feedPosts);
  const feedLoading = useHomeStore((s) => s.feedLoading);
  const likedPostIds = useHomeStore((s) => s.likedPostIds);
  const followingUserIds = useHomeStore((s) => s.followingUserIds);
  const unreadNotifications = useHomeStore((s) => s.unreadNotifications);
  const modals = useHomeStore((s) => s.modals);
  const setModalVisible = useHomeStore((s) => s.setModalVisible);

  // 3. Local UI state
  const [activeBanner, setActiveBanner] = useState(0);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

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
      try {
        const rooms = await homeApi.getPopularRooms(filter);
        if (rooms) {
          useHomeStore.getState().setPopularRooms(rooms);
        }
      } catch {
        // ignore
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
          onLikeToggle={() => handleLike(item.id)}
          onFollowToggle={() => handleFollow(item.userId)}
          onCommentPress={() => setModalVisible('commentPostId', item.id)}
          onMorePress={() => setModalVisible('postMore', item)}
          onImagePress={() => showToast('Viewing photo')}
        />
      );
    },
    [
      bannerSlides,
      activeBanner,
      likedPostIds,
      followingUserIds,
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
          unreadNotificationsCount={unreadNotifications.length}
          onAvatarPress={() => navigation.navigate(ROUTES.TABS.PROFILE)}
          onDiamondRechargePress={() => setModalVisible('recharge', true)}
          onNotificationPress={() => setModalVisible('notifications', true)}
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
          onItemPress={(item) => setModalVisible('comingSoon', item.label)}
        />

        <PopularRooms
          rooms={popularRooms}
          activeFilter={roomFilter}
          onFilterChange={handleRoomFilterChange}
          onRoomPress={(room) =>
            navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: room.id })
          }
        />

        <FeedTabs selectedTab={selectedTab} onTabPress={handleTabPress} />
      </View>
    );
  }, [
    userProfile,
    walletDiamonds,
    activeUsers,
    featuredUserAvatar,
    unreadNotifications.length,
    popularRooms,
    roomFilter,
    selectedTab,
    setModalVisible,
    handleRoomFilterChange,
    handleTabPress,
    navigation,
    showToast,
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
        notifications={useHomeStore.getState().feedPosts}
        onClose={() => setModalVisible('notifications', false)}
        onPressNotification={(notif) => {
          setModalVisible('notifications', false);
          if (notif.type === 'party') {
            navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: '101' });
          }
        }}
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
