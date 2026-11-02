import React, { memo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

export const ComingSoonModal = memo(function ComingSoonModal({ feature, onClose }) {
  if (!feature) return null;

  return (
    <Modal visible={Boolean(feature)} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            colors={['#1e0a3c', '#2d1b4e']}
            style={StyleSheet.absoluteFill}
            borderRadius={22}
          />
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.title}>{feature}</Text>
          <Text style={styles.desc}>
            This exciting feature is currently under active development and will be released in the next update!
          </Text>
          <TouchableOpacity style={styles.okBtn} onPress={onClose} activeOpacity={0.85}>
            <LinearGradient
              colors={['#7c4dff', '#ff4ea3']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.okGrad}
            >
              <Text style={styles.okTxt}>Got it!</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.4)',
  },
  emoji: {
    fontSize: 44,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: ms(18),
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: ms(13),
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  okBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  okGrad: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  okTxt: {
    color: 'white',
    fontSize: ms(14),
    fontWeight: '700',
  },
});

export default ComingSoonModal;
