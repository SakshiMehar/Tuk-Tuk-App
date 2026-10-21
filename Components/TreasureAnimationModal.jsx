import { Image as ExpoImage } from 'expo-image';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, Text } from 'react-native';

// We use the local treasure box opening GIF.
const CHEST_OPEN_GIF = require('../assets/Gift/tresurebox_new.gif');

export default function TreasureAnimationModal({ visible, onAnimationComplete }) {
  const [countdown, setCountdown] = useState(10);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    if (visible) {
      setCountdown(10);
      setShowGif(false);
      
      let currentCount = 10;
      const interval = setInterval(() => {
        currentCount -= 1;
        if (currentCount > 0) {
          setCountdown(currentCount);
        } else {
          clearInterval(interval);
          setShowGif(true);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  useEffect(() => {
    if (showGif) {
      // The GIF will play for a few seconds. We auto-close the animation and trigger the rewards modal.
      const timer = setTimeout(() => {
        onAnimationComplete?.();
      }, 1200); // 1.2 seconds for the animation to play
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showGif]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onAnimationComplete}
    >
      <View style={styles.container}>
        <View style={styles.overlay} />

        {!showGif ? (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownText}>
              {String(Math.floor(countdown / 3600)).padStart(2, '0')} : {String(Math.floor((countdown % 3600) / 60)).padStart(2, '0')} : {String(countdown % 60).padStart(2, '0')}
            </Text>
          </View>
        ) : (
          <View style={styles.animationContainer}>
            <ExpoImage
              source={CHEST_OPEN_GIF}
              style={styles.gifImage}
              contentFit="contain"
            />
          </View>
        )}
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
  countdownContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
});
