import { Image as ExpoImage } from 'expo-image';
import { useEffect } from 'react';
import { Modal, StyleSheet, View } from 'react-native';

// We use the local treasure box opening GIF.
const CHEST_OPEN_GIF = require('../assets/Gift/tresurebox_new.gif');

export default function TreasureAnimationModal({ visible, onAnimationComplete }) {
  useEffect(() => {
    if (visible) {
      // The GIF will play for a few seconds. We auto-close the animation and trigger the rewards modal.
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 1500); // 1.5 seconds for the animation to play
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAnimationComplete}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />

        <View style={styles.animationContainer}>
          <ExpoImage
            source={CHEST_OPEN_GIF}
            style={styles.gifImage}
            contentFit="contain"
          // We use Expo Image which supports GIFs efficiently
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  animationContainer: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
});
