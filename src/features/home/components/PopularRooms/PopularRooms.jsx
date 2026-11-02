import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image } from 'react-native';
import { LinearGradient } from '@shared/components';
import { s, vs, ms } from '@shared/utils/responsive';

const ROOM_FILTER_TABS = ['Trending', 'Nearby', 'Following'];

const FALLBACK_ROOMS = [
  {
    id: '__f1',
    name: 'Vipin Sharma n...',
    listenerCount: 0,
    image: require('@assets/images/room_good_vibes.jpg'),
    region: 'Global',
  },
  {
    id: '__f2',
    name: 'TukTuk Official',
    listenerCount: 0,
    image: require('@assets/images/room_music_chill.jpg'),
    region: 'Global',
  },
  {
    id: '__f3',
    name: 'New Updated...',
    listenerCount: 0,
    image: require('@assets/images/room_gaming_zone.jpg'),
    region: 'Global',
  },
  {
    id: '__f4',
    name: 'Good Vibes Only',
    listenerCount: 8200,
    image: require('@assets/images/room_lets_talk.jpg'),
    region: 'Global',
  },
];

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
}) {
  const displayRooms = rooms && rooms.length > 0 ? rooms : FALLBACK_ROOMS;

  return (
    <View style={styles.sectionWrap}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerTitleRow}>
          <Text style={{ fontSize: 18 }}>🔥</Text>
          <Text style={styles.sectionTitle}>Popular Rooms</Text>
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterPillsContent}
        style={styles.filterPillsScroll}
      >
        <TouchableOpacity style={styles.filterPillGlobal} activeOpacity={0.85}>
          <Text style={styles.filterPillGlobalTxt}>🌐 Global ▾</Text>
        </TouchableOpacity>

        {ROOM_FILTER_TABS.map((f) => (
          <TouchableOpacity
            key={f}
            style={styles.filterTabItem}
            activeOpacity={0.75}
            onPress={() => onFilterChange && onFilterChange(f)}
          >
            <Text
              style={[
                styles.filterTabTxt,
                activeFilter === f && styles.filterTabTxtActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Rooms horizontal carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.roomsScrollContent}
      >
        {displayRooms.map((room, idx) => {
          const coverSource =
            room.image ||
            (room.coverImage ? { uri: room.coverImage } : null) ||
            (room.avatarUrl ? { uri: room.avatarUrl } : null) ||
            FALLBACK_ROOMS[idx % FALLBACK_ROOMS.length].image;

          return (
            <TouchableOpacity
              key={room.id || idx}
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
                  source={typeof coverSource === 'number' ? coverSource : coverSource}
                  style={styles.roomCardImg}
                  resizeMode="cover"
                />
                <View style={styles.roomLiveBadge}>
                  <View style={styles.roomLiveDot} />
                  <Text style={styles.roomLiveTxt}>Live</Text>
                </View>
              </LinearGradient>

              <Text style={styles.roomCardName} numberOfLines={1}>
                {room.name || room.title || 'Room'}
              </Text>

              <View style={styles.roomCardCountRow}>
                <Text style={{ fontSize: 11 }}>👥</Text>
                <Text style={styles.roomCardCount}>
                  {fmtListeners(room.listenerCount || room.memberCount || 0)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
    paddingHorizontal: s(4),
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
});

export default PopularRooms;
