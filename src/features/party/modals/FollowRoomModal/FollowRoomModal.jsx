import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { colors, typography, spacing } from '@shared/theme';

export function FollowRoomModal({ visible, onClose, onFollow }) {
  return (
    <Modal visible={visible} onClose={onClose} position="center">
      <View style={styles.container}>
        <Text style={styles.icon}>❤️</Text>
        <Text style={styles.title}>Follow This Room</Text>
        <Text style={styles.description}>
          Get notified whenever this host goes live or starts a party!
        </Text>
        <Button
          title="Follow Room"
          variant="primary"
          size="md"
          onPress={onFollow}
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
    fontSize: 40,
    marginBottom: spacing.sm,
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
  },
});

export default FollowRoomModal;
