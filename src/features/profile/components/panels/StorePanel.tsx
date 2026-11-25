import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useWalletBalance } from '../../../../hooks/useWalletBalance';

const CATEGORIES = ['Frames', 'Rides', 'Bubbles', 'Badges'];

const STORE_ITEMS = [
  { id: 's1', name: 'Golden Halo Frame', price: 500, emoji: '👑', tag: 'HOT', category: 'Frames' },
  { id: 's2', name: 'Neon Cyber Ring', price: 1200, emoji: '⚡', tag: 'NEW', category: 'Frames' },
  { id: 's3', name: 'Crystal Dragon Car', price: 3000, emoji: '🏎️', tag: 'VIP', category: 'Rides' },
  { id: 's4', name: 'Purple Heart Bubble', price: 300, emoji: '💜', tag: null, category: 'Bubbles' },
  { id: 's5', name: 'Emerald Crown Badge', price: 800, emoji: '🌟', tag: 'POPULAR', category: 'Badges' },
  { id: 's6', name: 'Fire Phoenix Ride', price: 5000, emoji: '🔥', tag: 'LIMITED', category: 'Rides' },
];

export const StorePanel: React.FC<{ onClose?: () => void; onNavigateBackpack?: () => void }> = ({
  onClose,
  onNavigateBackpack,
}) => {
  const [activeCategory, setActiveCategory] = useState('Frames');
  const { diamonds } = useWalletBalance();

  const handleBuy = (item: any) => {
    Alert.alert('Store Purchase', `Buy ${item.name} for ${item.price} 💎?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Buy', onPress: () => Alert.alert('Purchased!', `${item.name} added to your backpack.`) },
    ]);
  };

  const filtered = STORE_ITEMS.filter((it) => it.category === activeCategory);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Dress-Up Store</Text>
          <Text style={styles.diamondBalance}>💎 {diamonds.toLocaleString()} Diamonds</Text>
        </View>
        <TouchableOpacity
          style={styles.backpackLink}
          onPress={onNavigateBackpack}
          activeOpacity={0.8}
        >
          <Ionicons name="briefcase" size={16} color="#c084fc" style={{ marginRight: 4 }} />
          <Text style={styles.backpackLinkText}>Backpack</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoriesRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catBtn, activeCategory === cat && styles.catBtnActive]}
            onPress={() => setActiveCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {item.tag && (
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{item.tag}</Text>
              </View>
            )}
            <View style={styles.itemIconBox}>
              <Text style={{ fontSize: 36 }}>{item.emoji}</Text>
            </View>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <TouchableOpacity
              style={styles.buyBtn}
              onPress={() => handleBuy(item)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#7c4dff', '#a855f7']} style={styles.buyGrad}>
                <Text style={styles.buyText}>💎 {item.price}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerLeft: { gap: 2 },
  headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
  diamondBalance: { color: '#7c4dff', fontSize: 13, fontWeight: '700' },
  backpackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  backpackLinkText: { color: '#7c4dff', fontSize: 12, fontWeight: '700' },
  categoriesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  catBtnActive: { backgroundColor: '#7c4dff' },
  catText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#ffffff', fontWeight: '700' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  itemCard: {
    width: '48%',
    backgroundColor: '#faf5ff',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ede9fe',
    position: 'relative',
  },
  tagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ec4899',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  itemIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: '#7c4dff',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  itemName: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  buyBtn: { borderRadius: 16, overflow: 'hidden', width: '100%' },
  buyGrad: { paddingVertical: 8, alignItems: 'center' },
  buyText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});

export default StorePanel;
