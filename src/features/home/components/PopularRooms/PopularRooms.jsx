import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@shared/components';
import { s, vs, ms } from '@shared/utils/responsive';

const ROOM_FILTER_TABS = ['Trending', 'Nearby', 'Following'];

const fmtListeners = (n) => {
  if (n == null || n === 0) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

export const PopularRooms = memo(function PopularRooms({
  rooms = [],
  activeFilter = 'Trending',
  onFilterChange,
  onRoomPress,
  loading = false,
  activeRegion = 'Global',
  onRegionPress,
}) {
  const displayRooms = Array.isArray(rooms) ? rooms : [];

  return (
    <View style={styles.sectionWrap}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={styles.sectionTitle}>Popular Rooms</Text>
        </View>
        {loading && displayRooms.length > 0 && (
          <ActivityIndicator size="small" color="#6D28D9" style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsContent}
        style={styles.filterPillsScroll}
      >
        <TouchableOpacity
          style={styles.filterPillGlobal}
          activeOpacity={0.85}
          onPress={() => onRegionPress && onRegionPress()}
        >
          <Text style={styles.filterPillGlobalTxt}>
            🌐 {activeRegion || 'Global'} ▾
          </Text>
        </TouchableOpacity>

        {ROOM_FILTER_TABS.map((f) => {
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterTabItem, isActive && styles.filterTabItemActive]}
              activeOpacity={0.75}
              onPress={() => onFilterChange && onFilterChange(f)}
            >
              <Text style={[styles.filterTabTxt, isActive && styles.filterTabTxtActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Rooms horizontal carousel */}
      {loading && displayRooms.length === 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomsScrollContent}
        >
          {[1, 2, 3].map((skeletonKey) => (
            <View key={skeletonKey} style={[styles.roomCard, styles.skeletonCard]}>
              <View style={[styles.roomRing, styles.skeletonRing]}>
                <View style={styles.skeletonImagePlaceholder} />
              </View>
              <View style={styles.skeletonTitlePlaceholder} />
              <View style={styles.skeletonMetaPlaceholder} />
            </View>
          ))}
        </ScrollView>
      ) : displayRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconWrap}>
            <Text style={{ fontSize: 26 }}>🎙️</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {activeFilter === 'Following'
              ? 'No Live Following Rooms'
              : 'No Live Rooms Right Now'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === 'Following'
              ? 'Follow room hosts to catch their live audio parties here.'
              : 'Live voice parties will appear here when hosts go live.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomsScrollContent}
        >
          {displayRooms.map((room, idx) => {
            const rawUrl =
              room.profileImageUrl ||
              room.imageUrl ||
              room.roomImageUrl ||
              room.coverImage ||
              room.avatarUrl ||
              (typeof room.image === 'string' ? room.image : null) ||
              (room.image?.uri ? room.image.uri : null);

            const coverSource = rawUrl
              ? { uri: rawUrl }
              : typeof room.image === 'number'
                ? room.image
                : require('@assets/images/room_good_vibes.jpg');

            const isLive =
              String(room.status || '').toUpperCase() === 'LIVE' ||
              room.isLive !== false;

            const listenerCount =
              room.listenerCount ?? room.userCount ?? room.memberCount ?? 0;

            const region = room.region || room.countryCode || 'Global';

            return (
              <TouchableOpacity
                key={room.id || room.roomId || idx}
                style={styles.roomCard}
                activeOpacity={0.88}
                onPress={() => onRoomPress && onRoomPress(room)}
              >
                <LinearGradient
                  colors={['#F59E0B', '#EC4899', '#8B5CF6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.roomRing}
                >
                  <Image
                    source={coverSource}
                    style={styles.roomCardImg}
                    resizeMode="cover"
                  />
                  {isLive && (
                    <View style={styles.roomLiveBadge}>
                      <View style={styles.roomLiveDot} />
                      <Text style={styles.roomLiveTxt}>Live</Text>
                    </View>
                  )}
                </LinearGradient>

                <Text style={styles.roomCardName} numberOfLines={1}>
                  {room.name || room.title || 'Live Room'}
                </Text>

                <View style={styles.roomCardCountRow}>
                  <Text style={{ fontSize: 11 }}>👥</Text>
                  <Text style={styles.roomCardCount}>
                    {fmtListeners(listenerCount)}
                  </Text>
                </View>

                <View style={styles.roomCardRegionRow}>
                  <Text style={{ fontSize: 10 }}>🌐</Text>
                  <Text style={styles.roomCardRegion} numberOfLines={1}>
                    {region}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  sectionWrap: {
    marginBottom: vs(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: vs(10),
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: ms(16.5),
    fontWeight: '800',
    color: '#111827',
    marginLeft: 6,
  },
  filterPillsScroll: {
    marginBottom: vs(12),
  },
  filterPillsContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  filterPillGlobal: {
    backgroundColor: '#6D28D9',
    borderRadius: 16,
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
  },
  filterPillGlobalTxt: {
    color: 'white',
    fontSize: ms(12),
    fontWeight: '800',
  },
  filterTabItem: {
    paddingVertical: vs(4),
    paddingHorizontal: s(6),
    borderRadius: 12,
  },
  filterTabItemActive: {
    backgroundColor: 'rgba(109, 40, 217, 0.08)',
  },
  filterTabTxt: {
    color: '#64748B',
    fontSize: ms(13),
    fontWeight: '600',
  },
  filterTabTxtActive: {
    color: '#6D28D9',
    fontWeight: '900',
  },
  roomsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 6,
  },
  roomCard: {
    width: s(124),
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: s(10),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  roomRing: {
    width: s(82),
    height: s(82),
    borderRadius: s(41),
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  roomCardImg: {
    width: '100%',
    height: '100%',
    borderRadius: s(39),
    backgroundColor: '#F1F5F9',
  },
  roomLiveBadge: {
    position: 'absolute',
    top: 2,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  roomLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
  },
  roomLiveTxt: {
    color: 'white',
    fontSize: ms(9),
    fontWeight: '900',
  },
  roomCardName: {
    color: '#0F172A',
    fontSize: ms(12.5),
    fontWeight: '800',
    textAlign: 'center',
    marginTop: vs(8),
  },
  roomCardCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: vs(3),
  },
  roomCardCount: {
    color: '#64748B',
    fontSize: ms(11),
    fontWeight: '600',
  },
  roomCardRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: vs(2),
  },
  roomCardRegion: {
    color: '#6D28D9',
    fontSize: ms(10.5),
    fontWeight: '600',
  },

  // Empty state
  emptyContainer: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: vs(20),
    paddingHorizontal: s(16),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  emptyIconWrap: {
    width: s(50),
    height: s(50),
    borderRadius: s(25),
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(8),
  },
  emptyTitle: {
    fontSize: ms(14),
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: ms(11.5),
    color: '#64748B',
    textAlign: 'center',
    marginTop: vs(4),
    lineHeight: ms(16),
  },

  // Skeleton loading styles
  skeletonCard: {
    opacity: 0.7,
  },
  skeletonRing: {
    backgroundColor: '#E2E8F0',
    padding: 0,
  },
  skeletonImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: s(41),
    backgroundColor: '#CBD5E1',
  },
  skeletonTitlePlaceholder: {
    width: s(70),
    height: vs(12),
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    marginTop: vs(10),
  },
  skeletonMetaPlaceholder: {
    width: s(45),
    height: vs(10),
    borderRadius: 5,
    backgroundColor: '#F1F5F9',
    marginTop: vs(6),
  },
});

export default PopularRooms;
