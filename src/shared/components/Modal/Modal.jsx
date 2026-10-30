import React from 'react';
import {
  Modal as RNModal,
  View,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { colors, radii } from '@shared/theme';

export function Modal({
  visible,
  onClose,
  children,
  position = 'center', // 'center' | 'bottom'
  animationType = 'fade',
}) {
  if (!visible) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.backdrop, position === 'bottom' ? styles.bottomBackdrop : styles.centerBackdrop]}>
          <TouchableWithoutFeedback>
            <View style={[styles.content, position === 'bottom' ? styles.bottomContent : styles.centerContent]}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay.dark,
  },
  centerBackdrop: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  bottomBackdrop: {
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background.modal,
    overflow: 'hidden',
  },
  centerContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: radii.xl,
    padding: 20,
  },
  bottomContent: {
    width: '100%',
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    padding: 24,
  },
});

export default Modal;
