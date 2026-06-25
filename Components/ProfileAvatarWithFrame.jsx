import { View, Text, Image, StyleSheet } from "react-native";
import { resolveNewUserFrameSource } from "../src/utils/newUserFrame";
import { NEW_USER_FRAME_LAYOUT } from "../src/constants/newUserFrameLayout";

export default function ProfileAvatarWithFrame({
  user,
  avatarSource,
  frameSource,
  size = 72,
  frameScale,
  frameResizeMode,
  frameOffsetX,
  frameOffsetY,
  frameBleed,
  avatarBoost,
  avatarOffsetY,
  avatarStyle,
  frameStyle,
  wrapperStyle,
  placeholderInitial,
  placeholderStyle,
  initialStyle,
  imageComponent: ImageComponent = Image,
}) {
  const resolvedFrame = frameSource ?? resolveNewUserFrameSource(user);
  const layout = NEW_USER_FRAME_LAYOUT;
  const resolvedFrameScale = frameScale ?? layout.frameScale;
  const resolvedFrameResizeMode = frameResizeMode ?? layout.frameResizeMode;
  const resolvedFrameOffsetX = frameOffsetX ?? layout.frameOffsetX;
  const resolvedFrameOffsetY = frameOffsetY ?? layout.frameOffsetY;
  const resolvedFrameBleed = frameBleed ?? layout.frameBleed;
  const resolvedAvatarBoost = avatarBoost ?? layout.avatarBoost ?? 1;
  const resolvedAvatarOffsetY = avatarOffsetY ?? layout.avatarOffsetY ?? 0;

  const baseSize = size;
  const avatarSize = resolvedFrame
    ? Math.round(baseSize * resolvedAvatarBoost)
    : baseSize;
  const frameSize = Math.round(baseSize * resolvedFrameScale);
  const bleed = Math.max(0, resolvedFrameBleed);
  const frameImageSize = frameSize + bleed * 2;
  const useExpandedFrame =
    resolvedFrameResizeMode === "cover" ||
    bleed > 0 ||
    resolvedFrameOffsetX !== 0 ||
    resolvedFrameOffsetY !== 0;

  const avatarImageStyle = resolvedFrame
    ? [avatarStyle, { borderWidth: 0, borderColor: "transparent" }]
    : avatarStyle;

  const avatarNode = avatarSource ? (
    <ImageComponent
      source={avatarSource}
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: resolvedFrame ? 0 : avatarSize / 2,
        },
        avatarImageStyle,
      ]}
    />
  ) : (
    <View
      style={[
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(124,77,255,0.35)",
        },
        resolvedFrame
          ? [placeholderStyle, { borderWidth: 0, borderColor: "transparent" }]
          : placeholderStyle,
      ]}
    >
      <Text
        style={[
          { color: "white", fontSize: Math.max(14, avatarSize * 0.34), fontWeight: "800" },
          initialStyle,
        ]}
      >
        {placeholderInitial ?? "?"}
      </Text>
    </View>
  );

  const avatarContent = resolvedFrame ? (
    <View
      style={{
        width: avatarSize,
        height: avatarSize,
        borderRadius: avatarSize / 2,
        overflow: "hidden",
        zIndex: 1,
        marginTop: resolvedAvatarOffsetY,
      }}
    >
      {avatarNode}
    </View>
  ) : (
    avatarNode
  );

  if (!resolvedFrame) {
    return <View style={wrapperStyle}>{avatarContent}</View>;
  }

  return (
    <View
      style={[
        {
          width: frameSize,
          height: frameSize,
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
        },
        wrapperStyle,
      ]}
    >
      {avatarContent}
      <Image
        source={resolvedFrame}
        style={[
          useExpandedFrame
            ? {
                position: "absolute",
                width: frameImageSize,
                height: frameImageSize,
                left: -bleed + resolvedFrameOffsetX,
                top: -bleed + resolvedFrameOffsetY,
                zIndex: 2,
              }
            : {
                ...StyleSheet.absoluteFillObject,
                width: frameSize,
                height: frameSize,
                zIndex: 2,
              },
          frameStyle,
        ]}
        resizeMode={resolvedFrameResizeMode}
        pointerEvents="none"
      />
    </View>
  );
}
