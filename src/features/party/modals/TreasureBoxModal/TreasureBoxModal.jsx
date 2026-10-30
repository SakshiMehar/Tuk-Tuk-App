import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { colors, typography, spacing } from '@shared/theme';

export function TreasureBoxModal({ visible, onClose, onOpenBox }) {
  return (
    <Modal visible={visible} onClose={onClose} position="center">
      <View style={styles.container}>
        <Text style={styles.icon}>🎁</Text>
        <Text style={styles.title}>Lucky Treasure Box</Text>
        <Text style={styles.description}>
          Win random diamonds, VIP badges, and avatar frames!
        </Text>
        <Button
          title="Open for 100 Diamonds"
          variant="primary"
          size="md"
          onPress={onOpenBox}
          style={styles.btn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.brand.amber,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  description: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.brand.amber,
  },
});

export default TreasureBoxModal;
