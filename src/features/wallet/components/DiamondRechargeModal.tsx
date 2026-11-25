import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatDiamonds, formatInr } from '../../../data/diamondRechargeCatalog';
import { DIAMOND_PACKAGE_TIERS, DiamondPackageTier } from '../../../data/diamondPackageTiers';
import { loadOfflineRechargeAgent, OfflineRechargeAgent } from '../../../services/offlineRechargeService';
import { loadDiamondStockPackages } from '../../../services/diamondStockService';
import { getDiamondStockManager } from '../../../api/rechargeApi';
import { getAppUserId } from '../../../utils/sessionUser';
import { getUser } from '../../../store/authStore';
import WalletUserCard from './WalletUserCard';
import WalletDetailsModal from './WalletDetailsModal';

const REWARD_GEMS_IMAGE = {
  uri: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Treasure/reward-gems.png',
};

const sanitizePhone = (value: any) => String(value ?? '').replace(/[^\d+]/g, '');

export interface DiamondRechargeModalProps {
  visible: boolean;
  onClose: () => void;
  currentDiamonds?: number;
  currentCoins?: number;
  initialTab?: string;
  onSelectPackage?: (pkg: DiamondPackageTier) => void;
}

export function DiamondRechargeModal({
  visible,
  onClose,
  currentDiamonds = 0,
  currentCoins = 0,
  initialTab = 'diamonds',
  onSelectPackage,
}: DiamondRechargeModalProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 16);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedId, setSelectedId] = useState(DIAMOND_PACKAGE_TIERS[0]?.id ?? 'starter');
  const [packages, setPackages] = useState<DiamondPackageTier[]>(DIAMOND_PACKAGE_TIERS);
  const [packagesLoading, setPackagesLoading] = useState(false);

  const [agent, setAgent] = useState<OfflineRechargeAgent | null>(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [detailsVisible, setDetailsVisible] = useState(false);

  // Stock Managers popup states
  const [stockManagersVisible, setStockManagersVisible] = useState(false);
  const [stockManagers, setStockManagers] = useState<any[]>([]);
  const [stockManagersLoading, setStockManagersLoading] = useState(false);
  const [stockManagersError, setStockManagersError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && initialTab) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  const fetchPackages = useCallback(async () => {
    setPackagesLoading(true);
    try {
      const list = await loadDiamondStockPackages();
      if (list && list.length > 0) {
        setPackages(list);
        setSelectedId((prev) => (list.some((p) => p.id === prev) ? prev : list[0].id));
      }
    } catch {
      setPackages(DIAMOND_PACKAGE_TIERS);
    } finally {
      setPackagesLoading(false);
    }
  }, []);

  const fetchAgent = useCallback(async () => {
    setAgentLoading(true);
    try {
      const [agentData, resolvedUserId] = await Promise.all([
        loadOfflineRechargeAgent().catch(() => null),
        getAppUserId().catch(() => null),
      ]);
      if (agentData) setAgent(agentData);
      if (resolvedUserId) setUserId(resolvedUserId);
    } catch {
      // ignore
    } finally {
      setAgentLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    fetchPackages();
    fetchAgent();
  }, [visible, fetchPackages, fetchAgent]);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedId) ?? packages[0] ?? null,
    [packages, selectedId]
  );

  const buildRechargeMessage = (pkg?: DiamondPackageTier | null) => {
    const p = pkg || selectedPackage;
    if (!p) return '';
    const idLine = userId ? `User ID: ${userId}\n` : '';
    const nameLine = p.name ? ` (${p.name})` : '';
    const expText = p.exp != null ? ` (+${p.exp} Exp)` : '';
    const diamondText = Number(p.diamonds).toLocaleString('en-IN');
    return (
      `Hi, I want to recharge Tuk-Tuk diamonds.\n` +
      `Package: ${formatInr(p.inr)} for ${diamondText} diamonds${expText}${nameLine}\n` +
      idLine +
      `Please share payment details.`
    );
  };

  const handleRechargePress = async () => {
    if (onSelectPackage && selectedPackage) {
      onSelectPackage(selectedPackage);
    }
    setStockManagersLoading(true);
    setStockManagersError(null);
    setStockManagersVisible(true);

    try {
      const response = await getDiamondStockManager();
      let rawList: any[] = [];

      if (Array.isArray(response)) {
        rawList = response;
      } else if (response?.data && Array.isArray(response.data)) {
        rawList = response.data;
      } else if (response?.result && Array.isArray(response.result)) {
        rawList = response.result;
      } else if (response?.stockManagers && Array.isArray(response.stockManagers)) {
        rawList = response.stockManagers;
      } else if (response && typeof response === 'object') {
        rawList = [response];
      }

      const normalized = rawList
        .filter((item) => item && (item.name || item.mobileNo || item.phone || item.email || item.whatsapp))
        .map((item, idx) => ({
          id: item.id ?? item._id ?? idx + 1,
          name: item.name ?? item.displayName ?? item.agentName ?? 'Recharge Manager',
          mobileNo: item.whatsapp ?? item.mobileNo ?? item.phone ?? item.phoneNumber ?? '',
          countryName: item.countryName ?? item.country ?? 'India',
          flagEmoji: item.flagEmoji ?? '🇮🇳',
        }));

      // If empty from API, provide fallback offline agent
      if (normalized.length === 0 && agent) {
        normalized.push({
          id: 'agent-1',
          name: agent.name || 'Official Support',
          mobileNo: agent.whatsapp || agent.phone || '',
          countryName: agent.countryName || 'India',
          flagEmoji: agent.flagEmoji || '🇮🇳',
        });
      }

      setStockManagers(normalized);
    } catch (err: any) {
      setStockManagers(
        agent
          ? [
              {
                id: 'agent-fallback',
                name: agent.name || 'Official Support',
                mobileNo: agent.whatsapp || agent.phone || '',
                countryName: agent.countryName || 'India',
                flagEmoji: agent.flagEmoji || '🇮🇳',
              },
            ]
          : []
      );
      setStockManagersError(agent ? null : (err?.message || 'Failed to load recharge managers.'));
    } finally {
      setStockManagersLoading(false);
    }
  };

  const handleContactManager = async (manager: any) => {
    const contact = sanitizePhone(manager?.mobileNo);
    if (!contact) {
      Alert.alert('No Contact Info', 'No phone number available for this manager.');
      return;
    }
    const message = encodeURIComponent(buildRechargeMessage(selectedPackage));
    const url = `https://wa.me/${contact.replace(/^\+/, '')}?text=${message}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (!canOpen) {
      Alert.alert('WhatsApp', 'Could not open WhatsApp on this device.');
      return;
    }
    Linking.openURL(url);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <SafeAreaView edges={['bottom']} style={styles.safe}>
          <View style={[styles.sheet, { paddingBottom: bottomPad }]}>
            <LinearGradient colors={['#1c0c32', '#140826', '#0d0618']} style={StyleSheet.absoluteFill} />

            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <View style={styles.tabRow}>
                <TouchableOpacity onPress={() => setActiveTab('diamonds')} activeOpacity={0.8}>
                  <Text style={[styles.tabLabel, activeTab === 'diamonds' && styles.tabLabelActive]}>
                    Diamonds
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('golds')} activeOpacity={0.8}>
                  <Text style={[styles.tabLabel, activeTab === 'golds' && styles.tabLabelActive]}>
                    Golds
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Ionicons name="close" size={22} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
              <View style={styles.balanceRow}>
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillIcon}>{activeTab === 'diamonds' ? '💎' : '🪙'}</Text>
                  <Text style={styles.balancePillValue}>
                    {(activeTab === 'diamonds' ? currentDiamonds : currentCoins).toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.detailsBtn}
                  activeOpacity={0.8}
                  onPress={() => setDetailsVisible(true)}
                >
                  <Ionicons name="receipt-outline" size={14} color="#e879f9" />
                  <Text style={styles.detailsBtnText}>Details</Text>
                  <Ionicons name="chevron-forward" size={14} color="#e879f9" />
                </TouchableOpacity>
              </View>

              <View style={{ height: 12 }} />
              <WalletUserCard />
              <View style={{ height: 12 }} />

              <LinearGradient
                colors={['#7c4dff', '#c026d3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promoBanner}
              >
                <Text style={styles.promoBannerText}>BIG REWARDS FOR FIRST RECHARGING!</Text>
              </LinearGradient>

              <Text style={styles.sectionTitle}>Recharge Diamonds</Text>

              <View style={styles.packageGrid}>
                {packages.map((pkg) => {
                  const active = pkg.id === selectedId;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.packageCard, active && styles.packageCardActive]}
                      activeOpacity={0.85}
                      onPress={() => setSelectedId(pkg.id)}
                    >
                      {pkg.popular && (
                        <View style={styles.popularRibbon}>
                          <Text style={styles.popularRibbonText}>Popular</Text>
                        </View>
                      )}
                      <Image source={REWARD_GEMS_IMAGE} style={styles.packageGemImage} resizeMode="contain" />
                      <Text style={styles.packageName}>{pkg.name}</Text>
                      <Text style={styles.packageAmount}>{pkg.diamonds.toLocaleString('en-IN')}</Text>
                      <View style={[styles.packagePriceStrip, active && styles.packagePriceStripActive]}>
                        <Text style={styles.packagePriceText}>{formatInr(pkg.inr)}</Text>
                      </View>
                      {pkg.exp != null && (
                        <View style={styles.packageExpStrip}>
                          <Text style={styles.packageExpText}>+{pkg.exp.toLocaleString('en-IN')} Exp</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ height: 16 }} />

              <TouchableOpacity
                style={styles.primaryBtnWrap}
                activeOpacity={0.85}
                onPress={handleRechargePress}
              >
                <LinearGradient
                  colors={['#f472b6', '#fb923c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>
                    Recharge {selectedPackage ? formatInr(selectedPackage.inr) : 'Now'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>

      <WalletDetailsModal
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        currency={activeTab}
        totalDiamonds={currentDiamonds}
        totalCoins={currentCoins}
      />

      {/* Stock Managers List Modal */}
      <Modal
        visible={stockManagersVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockManagersVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.managerModal}>
            <LinearGradient colors={['#24103e', '#16082a']} style={StyleSheet.absoluteFill} />
            <View style={styles.managerHeader}>
              <Text style={styles.managerTitle}>Official Recharge Partners</Text>
              <TouchableOpacity onPress={() => setStockManagersVisible(false)} style={styles.managerClose}>
                <Ionicons name="close" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text style={styles.managerSub}>
              Select a verified agent below to complete your recharge via WhatsApp/UPI.
            </Text>

            {stockManagersLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color="#a78bfa" size="large" />
                <Text style={styles.centerText}>Finding verified managers...</Text>
              </View>
            ) : stockManagersError ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{stockManagersError}</Text>
              </View>
            ) : stockManagers.length === 0 ? (
              <View style={styles.centerBox}>
                <Text style={styles.centerText}>No agents available right now.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
                {stockManagers.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={styles.managerItem}
                    activeOpacity={0.8}
                    onPress={() => handleContactManager(m)}
                  >
                    <View style={styles.managerLeft}>
                      <Text style={{ fontSize: 24 }}>{m.flagEmoji || '🇮🇳'}</Text>
                      <View>
                        <Text style={styles.managerName}>{m.name}</Text>
                        <Text style={styles.managerPhone}>{m.mobileNo || 'WhatsApp Available'}</Text>
                      </View>
                    </View>
                    <View style={styles.chatBadge}>
                      <Ionicons name="logo-whatsapp" size={16} color="#22c55e" />
                      <Text style={styles.chatBadgeText}>Chat</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  safe: {
    maxHeight: '90%',
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.25)',
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 18,
  },
  tabLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: 24,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(124,77,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.35)',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  balancePillIcon: { fontSize: 18 },
  balancePillValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(232,121,249,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,121,249,0.35)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailsBtnText: {
    color: '#e879f9',
    fontSize: 13,
    fontWeight: '700',
  },
  promoBanner: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginBottom: 14,
  },
  promoBannerText: {
    color: '#fde68a',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  packageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  packageCard: {
    width: '31.5%',
    backgroundColor: '#fdf1d3',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 12,
  },
  packageCardActive: {
    borderColor: '#e879f9',
  },
  popularRibbon: {
    position: 'absolute',
    top: 6,
    right: -24,
    width: 90,
    backgroundColor: '#f59e0b',
    transform: [{ rotate: '45deg' }],
    alignItems: 'center',
    paddingVertical: 2,
  },
  popularRibbonText: {
    color: '#3b1a08',
    fontSize: 8,
    fontWeight: '800',
  },
  packageGemImage: {
    width: 44,
    height: 32,
  },
  packageName: {
    color: '#7c4a1e',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  packageAmount: {
    color: '#2a1a06',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
    marginBottom: 10,
  },
  packagePriceStrip: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
    backgroundColor: '#f7dfa0',
  },
  packagePriceStripActive: {
    backgroundColor: '#f0c869',
  },
  packagePriceText: {
    color: '#7c4a1e',
    fontSize: 12,
    fontWeight: '800',
  },
  packageExpStrip: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  packageExpText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  primaryBtnWrap: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  managerModal: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  managerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  managerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  managerClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginBottom: 16,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  centerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
  },
  managerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  managerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  managerName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  managerPhone: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
  },
  chatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  chatBadgeText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default DiamondRechargeModal;
