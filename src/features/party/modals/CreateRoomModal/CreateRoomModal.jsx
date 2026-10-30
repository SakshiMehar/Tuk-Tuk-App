import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Modal } from '@shared/components/Modal/Modal';
import { Button } from '@shared/components/Button/Button';
import { colors, typography, spacing, radii } from '@shared/theme';

export function CreateRoomModal({ visible, onClose, onCreateRoom }) {
  const [title, setTitle] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreateRoom({ title: title.trim() });
    setTitle('');
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} position="bottom">
      <View style={styles.container}>
        <Text style={styles.title}>Create Voice Party</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter room title..."
          placeholderTextColor={colors.text.muted}
          value={title}
          onChangeText={setTitle}
        />
        <Button
          title="Start Party"
          variant="primary"
          size="md"
          onPress={handleCreate}
          disabled={!title.trim()}
          style={styles.createBtn}
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
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    marginBottom: spacing.lg,
  },
  createBtn: {
    marginTop: spacing.sm,
  },
});

export default CreateRoomModal;
