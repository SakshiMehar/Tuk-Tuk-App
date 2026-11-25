import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { HONOR_LEVELS, HONOR_PRIVILEGES } from '../../../constants/honorLevels';

interface HonorLevelModalProps {
  onClose?: () => void;
}

const LevelRow = ({ item, isExpanded, onToggle }: any) => {
  return (
    <View style={styles.levelCardWrapper}>
      <View style={styles.timelineDot} />

      <View style={[styles.levelCard, { backgroundColor: item.bg }]}>
        <View style={styles.levelCardTop}>
          <Image source={{ uri: item.image }} style={styles.levelIcon} resizeMode="contain" />
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{item.name}</Text>
            <Text style={styles.levelValueText}>
              Month value: <Text style={styles.levelValueHighlight}>{item.monthValue.toLocaleString()}</Text>
            </Text>
            <Text style={styles.levelSubText}>
              Unlock honor perks at
              <Text style={styles.levelValueHighlightOrange}> {item.requiredNext.toLocaleString()} </Text>
              XP value.
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.privilegesContainer}>
            {HONOR_PRIVILEGES.map((priv) => {
              const isUnlocked = item.privilegeIds.includes(priv.id);
              if (!isUnlocked) return null;
              return (
                <View key={priv.id} style={styles.privilegeItem}>
                  <View style={styles.privilegeIconWrap}>
                    <Ionicons name={priv.icon} size={24} color="#d97706" />
                  </View>
                  <Text style={styles.privilegeLabel} numberOfLines={1}>
                    {priv.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.toggleBtn} onPress={onToggle} activeOpacity={0.7}>
          <Text style={styles.toggleBtnText}>
            {isExpanded ? 'Collapse' : 'Check level privileges'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#4b5563"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const HonorLevelModal: React.FC<HonorLevelModalProps> = () => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (levelId: number) => {
    setExpandedId((prev) => (prev === levelId ? null : levelId));
  };

  const renderHeader = () => (
    <>
      <View style={styles.bannerContainer}>
        <LinearGradient
          colors={['#4b5563', '#1f2937', '#000000']}
          style={styles.bannerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.bannerNowBadge}>
            <Text style={styles.bannerNowText}>Now</Text>
          </View>
          <Text style={styles.bannerLevelText}>H.0</Text>
          <Text style={styles.bannerProgressText}>1/54,000</Text>

          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '1%' }]} />
          </View>

          <Text style={styles.bannerValidText}>Valid until end of month</Text>
        </LinearGradient>
      </View>

      <Text style={styles.sectionTitle}>Progress this month</Text>
    </>
  );

  return (
    <View style={styles.mainWrapper}>
      <FlatList
        data={HONOR_LEVELS}
        keyExtractor={(item) => item.level.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
        ListHeaderComponent={renderHeader}
        renderItem={({ item, index }) => (
          <View style={styles.listContainer}>
            <View
              style={[
                styles.timelineTrack,
                index === 0 && { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
                index === HONOR_LEVELS.length - 1 && {
                  bottom: 16,
                  borderBottomLeftRadius: 4,
                  borderBottomRightRadius: 4,
                },
              ]}
            />
            <LevelRow
              item={item}
              isExpanded={expandedId === item.level}
              onToggle={() => toggleExpand(item.level)}
            />
          </View>
        )}
        ListFooterComponent={<View style={{ height: 40 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  bannerContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#9ca3af',
  },
  bannerGradient: {
    padding: 20,
    paddingTop: 30,
    position: 'relative',
  },
  bannerNowBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#fcd34d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomRightRadius: 12,
  },
  bannerNowText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 12,
  },
  bannerLevelText: {
    fontSize: 40,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#fff',
    marginBottom: 4,
  },
  bannerProgressText: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  bannerValidText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  listContainer: {
    position: 'relative',
    paddingLeft: 20,
  },
  timelineTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: '#e5e7eb',
  },
  levelCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  timelineDot: {
    position: 'absolute',
    left: -12,
    bottom: -15,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    borderLeftColor: '#d1d5db',
  },
  levelCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  levelCardTop: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  levelIcon: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  levelValueText: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  levelValueHighlight: {
    color: '#4b5563',
  },
  levelValueHighlightOrange: {
    color: '#d97706',
  },
  levelSubText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  privilegesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  privilegeItem: {
    alignItems: 'center',
    width: '21%',
    marginBottom: 8,
  },
  privilegeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.2)',
  },
  privilegeLabel: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  toggleBtnText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '500',
  },
});

export default HonorLevelModal;
