import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface ClearChatCacheModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ClearChatCacheModal: React.FC<ClearChatCacheModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [clearing, setClearing] = useState(false);
  const [cacheSize, setCacheSize] = useState('18.4 MB');

  const handleClear = async () => {
    if (clearing) return;
    setClearing(true);
    try {
      // Simulate cache clearing
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 800));
      setCacheSize('0 KB');
      Alert.alert('Cache Cleared', 'Chat cache has been cleared successfully.');
      onSuccess?.();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to clear chat cache.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            colors={['#1e0a3c', '#2d1b4e', '#1a0a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.content}
          >
            {/* Header Icon */}
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubbles-outline" size={32} color="#a78bfa" />
            </View>

            <Text style={styles.title}>Clear Chat Cache</Text>
            <Text style={styles.subtitle}>
              Free up device space by clearing temporary voice messages, stickers, and cached images.
            </Text>

            {/* Cache Breakdown */}
            <View style={styles.statsCard}>
              <View style={styles.statsRow}>
                <Text style={styles.statsLabel}>Total Cache Size</Text>
                <Text style={styles.statsValue}>{cacheSize}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.itemRow}>
                <Ionicons name="mic-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.itemLabel}>Voice Notes & Audio</Text>
                <Text style={styles.itemVal}>{cacheSize === '0 KB' ? '0 KB' : '11.2 MB'}</Text>
              </View>
              <View style={styles.itemRow}>
                <Ionicons name="images-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.itemLabel}>Cached Media & Images</Text>
                <Text style={styles.itemVal}>{cacheSize === '0 KB' ? '0 KB' : '5.8 MB'}</Text>
              </View>
              <View style={styles.itemRow}>
                <Ionicons name="happy-outline" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={styles.itemLabel}>Stickers & Emojis</Text>
                <Text style={styles.itemVal}>{cacheSize === '0 KB' ? '0 KB' : '1.4 MB'}</Text>
              </View>
            </View>

            <Text style={styles.noticeText}>
              Note: Your chat messages and conversation history will not be deleted.
            </Text>

            {/* Clear Button */}
            <TouchableOpacity
              style={[styles.clearBtn, clearing && { opacity: 0.7 }]}
              onPress={handleClear}
              activeOpacity={0.85}
              disabled={clearing}
            >
              <LinearGradient
                colors={['#7c4dff', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.clearGrad}
              >
                {clearing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={18} color="white" />
                    <Text style={styles.clearText}>Clear Now</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.8}
              disabled={clearing}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.3)',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124,77,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  statsCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  statsLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  statsValue: {
    color: '#a78bfa',
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  itemLabel: {
    flex: 1,
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  itemVal: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  noticeText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  clearBtn: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 10,
  },
  clearGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  clearText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  cancelText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ClearChatCacheModal;
