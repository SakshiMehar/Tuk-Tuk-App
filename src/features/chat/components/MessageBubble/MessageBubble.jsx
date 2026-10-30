import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing, radii } from '@shared/theme';

export const MessageBubble = memo(function MessageBubble({ message, isMe = false }) {
  return (
    <View style={[styles.container, isMe ? styles.myContainer : styles.otherContainer]}>
      <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.text, isMe ? styles.myText : styles.otherText]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.time}>{message.time || '12:00'}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '75%',
  },
  myContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  myBubble: {
    backgroundColor: colors.brand.primary,
    borderBottomRightRadius: radii.xs,
  },
  otherBubble: {
    backgroundColor: colors.background.tertiary,
    borderBottomLeftRadius: radii.xs,
  },
  text: {
    fontSize: typography.sizes.md,
  },
  myText: {
    color: colors.text.primary,
  },
  otherText: {
    color: colors.text.primary,
  },
  time: {
    color: colors.text.muted,
    fontSize: 10,
    marginTop: 2,
    marginHorizontal: 4,
  },
});

export default MessageBubble;
