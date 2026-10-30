import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { colors, typography, spacing, radii } from '@shared/theme';
import { useWalletStore } from '../../store/walletStore';

export function RechargeModal({ visible, onClose, onSelectPackage }) {
  const packages = useWalletStore((s) => s.packages);

  const renderPackage = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.packageCard}
      onPress={() => onSelectPackage(item)}
    >
      <View style={styles.diamondRow}>
        <Text style={styles.diamondIcon}>💎</Text>
        <Text style={styles.diamondCount}>{item.diamonds}</Text>
      </View>
      {item.bonus > 0 && (
        <Text style={styles.bonusBadge}>+{item.bonus} Bonus</Text>
      )}
      <Text style={styles.priceTag}>{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} onClose={onClose} position="bottom">
      <View style={styles.container}>
        <Text style={styles.title}>Diamond Top-Up</Text>
        <Text style={styles.subtitle}>Select a diamond package to recharge instantly</Text>

        <FlatList
          data={packages}
          keyExtractor={(item) => item.id}
          renderItem={renderPackage}
          numColumns={2}
          contentContainerStyle={styles.grid}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  grid: {
    gap: spacing.sm,
  },
  packageCard: {
    flex: 1,
    margin: spacing.xs,
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.highlight,
  },
  diamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diamondIcon: {
    fontSize: 20,
    marginRight: 4,
  },
  diamondCount: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  bonusBadge: {
    backgroundColor: colors.state.success,
    color: colors.text.primary,
    fontSize: 9,
    fontWeight: typography.weights.bold,
    paddingHorizontal: 4,
    borderRadius: radii.xs,
    marginVertical: 4,
  },
  priceTag: {
    color: colors.brand.amber,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginTop: 4,
  },
});

export default RechargeModal;
