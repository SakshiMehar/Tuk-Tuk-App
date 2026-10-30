import React, { memo } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { Avatar } from '@shared/components/Avatar/Avatar';
import { spacing } from '@shared/theme';

export const RoomUserList = memo(function RoomUserList({ users = [] }) {
  if (!users.length) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Avatar
            uri={item.avatar}
            name={item.name}
            size={32}
            style={styles.avatar}
          />
        )}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  avatar: {
    marginRight: spacing.xs,
  },
});

export default RoomUserList;
