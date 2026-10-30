import React, { memo } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';
import { useGiftStore } from '../../store/giftStore';

export const GiftPicker = memo(function GiftPicker({ onSendGift }) {
  const catalog = useGiftStore((s) => s.catalog);
  const selectedGift = useGiftStore((s) => s.selectedGift);
  const setSelectedGift = useGiftStore((s) => s.setSelectedGift);

  const renderItem = ({ item }) => {
    const isSelected = selectedGift?.id === item.id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.giftCard, isSelected && styles.selectedCard]}
        onPress={() => setSelectedGift(item)}
      >
        <Text style={styles.icon}>{item.icon}</Text>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>💎 {item.price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={catalog}
        horizontal
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.tertiary,
  },
  list: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  giftCard: {
    width: 80,
    height: 90,
    backgroundColor: colors.background.card,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectedCard: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  icon: {
    fontSize: 28,
  },
  name: {
    color: colors.text.primary,
    fontSize: 10,
    marginTop: 4,
  },
  price: {
    color: colors.brand.amber,
    fontSize: 10,
    fontWeight: typography.weights.bold,
  },
});

export default GiftPicker;
