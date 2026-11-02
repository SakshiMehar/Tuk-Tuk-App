import React, { memo, useState, useCallback, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';
import { homeApi } from '../api/homeApi';
import { ms } from '@shared/utils/responsive';

export const SearchModal = memo(function SearchModal({
  visible,
  onClose,
  onSelectUser,
  onSelectFeature,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debounceRef = useRef(null);

  const quickExplore = ['Voice Party', 'Aanya', 'Singing', 'Kabir', 'Gaming'];
  const trendingTags = ['#VoicePartyCarnival', '#LateNightVibes', '#TukTukStar', '#GamingZone'];

  const handleQueryChange = useCallback((text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const users = await homeApi.searchPeople(text.trim());
        setResults(users || []);
      } catch {
        // ignore
      }
    }, 300);
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.searchPanel}>
          <LinearGradient
            colors={['#1e0a3c', '#2d1b4e']}
            style={StyleSheet.absoluteFill}
            borderRadius={24}
          />

          {/* Header */}
          <View style={styles.searchHeader}>
            <Text style={styles.searchPanelTitle}>Search</Text>
            <TouchableOpacity onPress={onClose} style={styles.searchCloseBtn}>
              <Text style={styles.searchCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Input Row */}
          <View style={styles.searchInputRow}>
            <Text style={styles.searchInputIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search people, parties, games…"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={query}
              onChangeText={handleQueryChange}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleQueryChange('')}>
                <Text style={styles.searchClearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Results */}
            {results.length > 0 ? (
              <View style={styles.resultsContainer}>
                <Text style={styles.sectionLabel}>People</Text>
                {results.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={styles.resultItem}
                    activeOpacity={0.75}
                    onPress={() => onSelectUser && onSelectUser(u)}
                  >
                    <Image source={{ uri: u.avatar }} style={styles.userAvatar} />
                    <View style={styles.userMeta}>
                      <View style={styles.nameRow}>
                        <Text style={styles.userName}>{u.name}</Text>
                        {u.vip && <Text style={styles.vipTag}>👑 VIP</Text>}
                      </View>
                      <Text style={styles.userStatus}>
                        {u.isOnline ? '🟢 Online' : 'Tap to view profile'}
                      </Text>
                    </View>
                    <ChevronRight size={18} color="rgba(255,255,255,0.4)" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : query.length === 0 ? (
              <>
                {/* Quick explore */}
                <View style={styles.suggestSection}>
                  <Text style={styles.sectionLabel}>Quick explore</Text>
                  <View style={styles.chipsRow}>
                    {quickExplore.map((tag) => (
                      <TouchableOpacity
                        key={tag}
                        style={styles.chip}
                        onPress={() => handleQueryChange(tag)}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['#3d1a6e', '#5b2d8e']}
                          style={styles.chipGrad}
                        >
                          <Text style={styles.chipText}>{tag}</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Trending */}
                <View style={styles.suggestSection}>
                  <Text style={styles.sectionLabel}>Trending now 🔥</Text>
                  {trendingTags.map((tag) => (
                    <View key={tag} style={styles.trendingRow}>
                      <View style={styles.trendingDot} />
                      <Text style={styles.trendingTag}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.noResultsBox}>
                <Text style={styles.noResultsEmoji}>🔍</Text>
                <Text style={styles.noResultsTitle}>No results found</Text>
                <Text style={styles.noResultsSub}>
                  Try searching for keywords like Voice Party, Aanya, or Kabir
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  searchPanel: {
    backgroundColor: '#1e0a3c',
    borderRadius: 24,
    padding: 18,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchPanelTitle: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontWeight: '800',
  },
  searchCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCloseTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  searchInputIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: ms(14),
  },
  searchClearBtn: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    padding: 4,
  },
  resultsContainer: {
    gap: 12,
  },
  sectionLabel: {
    color: '#B388FF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 10,
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E1B4B',
  },
  userMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: ms(14),
    fontWeight: '700',
  },
  vipTag: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  userStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: ms(11.5),
    marginTop: 2,
  },
  suggestSection: {
    marginBottom: 20,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  chipGrad: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    color: '#E0CCFF',
    fontSize: ms(12),
    fontWeight: '600',
  },
  trendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  trendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EC4899',
  },
  trendingTag: {
    color: '#F1F5F9',
    fontSize: ms(13.5),
    fontWeight: '600',
  },
  noResultsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  noResultsEmoji: {
    fontSize: 36,
  },
  noResultsTitle: {
    color: '#FFFFFF',
    fontSize: ms(16),
    fontWeight: '700',
  },
  noResultsSub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: ms(12),
    textAlign: 'center',
  },
});

export default SearchModal;
