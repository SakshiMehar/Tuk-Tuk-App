import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { useWalletBalance } from '../../../hooks/useWalletBalance';
import { refreshWalletBalance } from '../../../store/walletStore';
import WalletRechargeSection from '../components/WalletRechargeSection';

export interface WalletScreenProps {
  navigation?: any;
}

export function WalletScreen({ navigation }: WalletScreenProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { diamonds, coins } = useWalletBalance();

  useEffect(() => {
    refreshWalletBalance().catch(() => {});
  }, []);

  const handleBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else {
      router.back();
    }
  };

  const headerPaddingTop = Math.max(insets.top, 16) + 6;
  const contentBottomPad = Math.max(insets.bottom, 20) + 24;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        {...({ backgroundColor: '#070616' } as any)}
      />
      <LinearGradient
        colors={['#070616', '#110d2f', '#150f3d']}
        style={StyleSheet.absoluteFill}
      />

      {/* Screen Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.8}
        >
          <ArrowLeft size={22} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottomPad }]}
      >
        <WalletRechargeSection currentDiamonds={diamonds} currentCoins={coins} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070616',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});

export default WalletScreen;
