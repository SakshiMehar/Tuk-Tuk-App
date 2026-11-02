import React, { memo } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { LinearGradient } from '@shared/components';

export const PostFAB = memo(function PostFAB({ onPress }) {
  const insets = useSafeAreaInsets();
  const bottomPos = Math.max(insets.bottom, 10) + 70;

  return (
    <TouchableOpacity
      style={[styles.fab, { bottom: bottomPos }]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.outerHalo}>
        <LinearGradient
          colors={['#A855F7', '#7C3AED', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    zIndex: 100,
    elevation: 12,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
  },
  outerHalo: {
    padding: 1,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  gradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
});

export default PostFAB;
