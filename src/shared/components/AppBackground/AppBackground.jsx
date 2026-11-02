import React from 'react';
import { StyleSheet, View } from 'react-native';

export function AppBackground() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={styles.base} />
      <View style={styles.orbPink} />
      <View style={styles.orbPurple} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  orbPink: {
    position: 'absolute',
    width: 320,
    height: 320,
    top: -100,
    left: -100,
    borderRadius: 160,
    backgroundColor: 'rgba(253, 230, 242, 0.65)',
  },
  orbPurple: {
    position: 'absolute',
    width: 380,
    height: 380,
    bottom: -140,
    right: -140,
    borderRadius: 190,
    backgroundColor: 'rgba(243, 232, 255, 0.6)',
  },
});

export default AppBackground;
