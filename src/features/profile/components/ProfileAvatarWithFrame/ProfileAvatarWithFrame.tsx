import React, { useState, useEffect } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { VIP_PROFILE_FRAME_LAYOUT } from '../../../../constants/vip';
import { useUserOnlineOrLiveStatus } from '../../../../utils/liveStatus';

export interface ProfileAvatarWithFrameProps {
  user?: any;
  avatarSource?: any;
  frameSource?: any;
  size?: number;
  isLive?: boolean;
  isOnline?: boolean;
  showLiveBadge?: boolean;
  liveBadgeSize?: 'small' | 'medium' | 'large' | number;
  liveBadgeStyle?: StyleProp<ViewStyle>;
  frameScale?: number;
  frameResizeMode?: 'contain' | 'cover' | 'stretch';
  frameOffsetX?: number;
  frameOffsetY?: number;
  frameBleed?: number;
  avatarBoost?: number;
  avatarOffsetY?: number;
  avatarStyle?: StyleProp<ImageStyle>;
  frameStyle?: StyleProp<ImageStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  placeholderInitial?: string;
  placeholderStyle?: StyleProp<ViewStyle>;
  initialStyle?: StyleProp<ViewStyle>;
  innerRingRatio?: number;
}

export const ProfileAvatarWithFrame: React.FC<ProfileAvatarWithFrameProps> = ({
  user,
  avatarSource,
  frameSource,
  size = 72,
  isLive,
  isOnline,
  showLiveBadge,
  frameScale,
  frameResizeMode = 'contain',
  frameOffsetX = 0,
  frameOffsetY = 0,
  avatarBoost,
  avatarOffsetY = 0,
  avatarStyle,
  frameStyle,
  wrapperStyle,
  placeholderInitial = '?',
  placeholderStyle,
  initialStyle,
}) => {
  const resolvedIsLive = useUserOnlineOrLiveStatus(user, isLive ?? showLiveBadge, isOnline);
  const resolvedFrame = frameSource;
  const frameImageSource =
    typeof resolvedFrame === 'string' ? { uri: resolvedFrame } : resolvedFrame;

  const resolvedFrameScale = frameScale ?? (resolvedFrame ? VIP_PROFILE_FRAME_LAYOUT.frameScale : 1);
  const resolvedAvatarBoost = avatarBoost ?? (resolvedFrame ? VIP_PROFILE_FRAME_LAYOUT.avatarBoost : 1.0);

  const baseSize = size;
  const avatarSize = resolvedFrame ? Math.round(baseSize * resolvedAvatarBoost) : baseSize;
  const frameSize = Math.round(baseSize * resolvedFrameScale);

  const avatarNode = avatarSource ? (
    <Image
      source={avatarSource}
      style={[
        avatarStyle,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
      ]}
      resizeMode="cover"
    />
  ) : (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(124,77,255,0.35)',
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        placeholderStyle,
      ]}
    >
      <Text
        style={[
          { color: 'white', fontSize: Math.max(14, avatarSize * 0.34), fontWeight: '800' },
          initialStyle,
        ]}
      >
        {placeholderInitial}
      </Text>
    </View>
  );

  const liveDotNode = resolvedIsLive ? (
    <View
      style={[
        styles.liveDot,
        {
          position: 'absolute',
          bottom: 2,
          right: 2,
          zIndex: 15,
        },
      ]}
      pointerEvents="none"
    />
  ) : null;

  const avatarContent = (
    <View
      style={{
        width: avatarSize,
        height: avatarSize,
        position: 'relative',
        zIndex: 1,
        marginTop: resolvedFrame ? avatarOffsetY : 0,
      }}
    >
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          overflow: 'hidden',
        }}
      >
        {avatarNode}
      </View>
      {liveDotNode}
    </View>
  );

  if (!resolvedFrame) {
    return (
      <View style={[styles.centerWrap, wrapperStyle]}>
        {avatarContent}
      </View>
    );
  }

  return (
    <View
      style={[
        {
          width: frameSize,
          height: frameSize,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        },
        wrapperStyle,
      ]}
    >
      {avatarContent}
      <Image
        source={frameImageSource}
        style={[
          {
            position: 'absolute',
            width: frameSize,
            height: frameSize,
            left: frameOffsetX,
            top: frameOffsetY,
            zIndex: 2,
          },
          frameStyle,
        ]}
        resizeMode={frameResizeMode}
        pointerEvents="none"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 4,
  },
  liveInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
});

export default ProfileAvatarWithFrame;
