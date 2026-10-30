import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { APP_INFO } from '@app/appConstants';

export function SettingsScreen({ navigation }) {
  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>App Version</Text>
          <Text style={styles.rowValue}>{APP_INFO.VERSION} ({APP_INFO.BUILD_NUMBER})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Audio RTC Engine</Text>
          <Text style={styles.rowValue}>Agora RTC</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Realtime Gateway</Text>
          <Text style={styles.rowValue}>WebSocket / STOMP</Text>
        </View>
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
  section: {
    margin: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rowLabel: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
  },
  rowValue: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
  },
});

export default SettingsScreen;
