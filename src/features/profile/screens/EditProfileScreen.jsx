import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Button, Avatar } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { useAuthStore } from '@store/auth/authStore';

export function EditProfileScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState('Voice Party Enthusiast 🎤');

  const handleSave = () => {
    updateUser({ name });
    navigation.goBack();
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.avatarSection}>
          <Avatar uri={user?.avatar} name={name} size={90} />
          <TouchableOpacity style={styles.changePhotoBtn}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Nickname</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter nickname"
          placeholderTextColor={colors.text.muted}
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell others about yourself..."
          placeholderTextColor={colors.text.muted}
          multiline
        />

        <Button
          title="Save Changes"
          variant="primary"
          size="lg"
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </View>
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
  backBtn: {
    paddingHorizontal: spacing.sm,
  },
  backText: {
    color: colors.text.primary,
    fontSize: 32,
    lineHeight: 32,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  changePhotoBtn: {
    marginTop: spacing.sm,
  },
  changePhotoText: {
    color: colors.brand.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  label: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.xxl,
  },
});

export default EditProfileScreen;
