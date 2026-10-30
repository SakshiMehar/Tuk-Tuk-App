import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { colors, typography, spacing } from '@shared/theme';

export function PkBattleModal({ visible, onClose, onStartPk }) {
  return (
    <Modal visible={visible} onClose={onClose} position="bottom">
      <View style={styles.container}>
        <Text style={styles.title}>⚔️ PK Battle Arena</Text>
        <Text style={styles.description}>
          Challenge another room or host to a timed gift-battle showdown!
        </Text>
        <Button
          title="Challenge Random Host"
          variant="primary"
          size="md"
          onPress={onStartPk}
          style={styles.btn}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
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
    backgroundColor: colors.brand.secondary,
  },
});

export default PkBattleModal;
