import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { colors, typography, spacing } from '@shared/theme';

export function ExitRoomModal({ visible, onClose, onConfirmExit }) {
  return (
    <Modal visible={visible} onClose={onClose} position="center">
      <View style={styles.container}>
        <Text style={styles.title}>Leave Party Room?</Text>
        <Text style={styles.description}>
          Are you sure you want to exit? Your seat will be released.
        </Text>
        <View style={styles.buttons}>
          <Button
            title="Cancel"
            variant="secondary"
            size="md"
            onPress={onClose}
            style={styles.btn}
          />
          <Button
            title="Leave"
            variant="primary"
            size="md"
            onPress={onConfirmExit}
            style={[styles.btn, styles.leaveBtn]}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  description: {
    marginTop: spacing.sm,
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    gap: spacing.md,
    width: '100%',
  },
  btn: {
    flex: 1,
  },
  leaveBtn: {
    backgroundColor: colors.state.error,
  },
});

export default ExitRoomModal;
