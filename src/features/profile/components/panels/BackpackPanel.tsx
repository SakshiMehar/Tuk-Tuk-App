import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const BACKPACK_TABS = ['All', 'Frames', 'Effects', 'Badges'];

const INITIAL_INVENTORY = [
  { id: 'bp1', name: 'Starter Frame', category: 'Frames', qty: 1, equipped: true, emoji: '🖼️' },
  { id: 'bp2', name: 'Sparkle Entry', category: 'Effects', qty: 1, equipped: false, emoji: '✨' },
  { id: 'bp3', name: 'Early Adopter Badge', category: 'Badges', qty: 1, equipped: true, emoji: '🌟' },
];

export const BackpackPanel: React.FC<{ onClose?: () => void; onGoToStore?: () => void }> = ({
  onClose,
  onGoToStore,
}) => {
  const [activeTab, setActiveTab] = useState('All');
  const [items, setItems] = useState(INITIAL_INVENTORY);

  const handleToggleEquip = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, equipped: !it.equipped } : it))
    );
  };

  const filtered = items.filter((it) => activeTab === 'All' || it.category === activeTab);

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Backpack</Text>
        <TouchableOpacity style={styles.storeLink} onPress={onGoToStore} activeOpacity={0.8}>
          <Ionicons name="storefront" size={16} color="#7c4dff" style={{ marginRight: 4 }} />
          <Text style={styles.storeLinkText}>Visit Store</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {BACKPACK_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Item list */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.emojiBox}>
              <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCat}>{item.category} • Quantity: {item.qty}</Text>
            </View>
            <TouchableOpacity
              style={[styles.equipBtn, item.equipped && styles.equipBtnActive]}
              onPress={() => handleToggleEquip(item.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.equipBtnText, item.equipped && styles.equipBtnTextActive]}>
                {item.equipped ? 'Equipped' : 'Wear'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: { color: '#1e293b', fontSize: 18, fontWeight: '800' },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  storeLinkText: { color: '#7c4dff', fontSize: 12, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  tabBtnActive: { backgroundColor: '#7c4dff' },
  tabText: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#ffffff', fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ede9fe',
    gap: 12,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  itemCat: { color: '#64748b', fontSize: 12 },
  equipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(124,77,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
  },
  equipBtnActive: {
    backgroundColor: '#7c4dff',
    borderColor: '#7c4dff',
  },
  equipBtnText: { color: '#7c4dff', fontSize: 12, fontWeight: '700' },
  equipBtnTextActive: { color: '#ffffff' },
});

export default BackpackPanel;
