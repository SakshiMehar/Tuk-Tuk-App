import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen, Button } from '@shared/components';
import { colors, typography, spacing, radii } from '@shared/theme';
import { useWalletStore } from '../store/walletStore';
import { RechargeModal } from '../modals/RechargeModal/RechargeModal';

export function WalletScreen({ navigation }) {
  const diamonds = useWalletStore((s) => s.diamonds);
  const isRechargeModalOpen = useWalletStore((s) => s.isRechargeModalOpen);
  const setRechargeModalOpen = useWalletStore((s) => s.setRechargeModalOpen);
  const setDiamonds = useWalletStore((s) => s.setDiamonds);

  const handleSelectPackage = (pkg) => {
    setDiamonds(diamonds + pkg.diamonds + pkg.bonus);
    setRechargeModalOpen(false);
  };

  return (
    <Screen backgroundColor={colors.background.primary} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Diamond Balance</Text>
        <View style={styles.diamondRow}>
          <Text style={styles.diamondIcon}>💎</Text>
          <Text style={styles.balanceValue}>{diamonds.toLocaleString()}</Text>
        </View>

        <Button
          title="+ Recharge Diamonds"
          variant="primary"
          size="md"
          onPress={() => setRechargeModalOpen(true)}
          style={styles.rechargeBtn}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <View style={styles.emptyTransactions}>
          <Text style={styles.emptyText}>No recent diamond spending</Text>
        </View>
      </View>

      <RechargeModal
        visible={isRechargeModalOpen}
        onClose={() => setRechargeModalOpen(false)}
        onSelectPackage={handleSelectPackage}
      />
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
  balanceCard: {
    margin: spacing.lg,
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.highlight,
  },
  balanceLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  diamondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  diamondIcon: {
    fontSize: 36,
    marginRight: spacing.sm,
  },
  balanceValue: {
    color: colors.brand.amber,
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.heavy,
  },
  rechargeBtn: {
    width: '100%',
    marginTop: spacing.sm,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
  },
  emptyTransactions: {
    backgroundColor: colors.background.tertiary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.muted,
    fontSize: typography.sizes.sm,
  },
});

export default WalletScreen;
