import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Screen, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { ROUTES } from '@navigation/navigationConstants';
import { usePartyStore } from '../store/partyStore';
import { CreateRoomModal } from '../modals/CreateRoomModal/CreateRoomModal';

const MOCK_ROOMS = [
  { id: '101', title: 'Midnight Chill Lounge 🌙', host: 'Alex R.', members: 48, tag: 'Music' },
  { id: '102', title: 'Bollywood Karaoke Nonstop 🎤', host: 'Priya K.', members: 89, tag: 'Singing' },
  { id: '103', title: 'Crypto & Tech Banter 🚀', host: 'Rahul V.', members: 32, tag: 'Chat' },
  { id: '104', title: 'Gaming Squad PK Battle ⚔️', host: 'Samir', members: 114, tag: 'PK' },
];

export function PartyExploreScreen({ navigation }) {
  const [rooms] = useState(MOCK_ROOMS);
  const [createVisible, setCreateVisible] = useState(false);

  const handleRoomPress = useCallback((room) => {
    navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: room.id });
  }, [navigation]);

  const handleCreateRoom = useCallback((roomData) => {
    navigation.navigate(ROUTES.SCREENS.VOICE_PARTY, { roomId: `room_${Date.now()}` });
  }, [navigation]);

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.card}
      onPress={() => handleRoomPress(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <Text style={styles.memberBadge}>👥 {item.members}</Text>
      </View>
      <Text style={styles.roomTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.hostName}>Host: {item.host}</Text>
    </TouchableOpacity>
  );

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Party Rooms</Text>
        <Button
          title="+ Create"
          variant="primary"
          size="sm"
          onPress={() => setCreateVisible(true)}
        />
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomCard}
        contentContainerStyle={styles.list}
      />

      <CreateRoomModal
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
        onCreateRoom={handleCreateRoom}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  screenTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  tagBadge: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  tagText: {
    color: colors.text.primary,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  memberBadge: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  roomTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  hostName: {
    color: colors.text.muted,
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
});

export default PartyExploreScreen;
