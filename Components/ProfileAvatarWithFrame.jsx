import { View, Text, Image, StyleSheet } from "react-native";
import { resolveNewUserFrameSource } from "../src/utils/newUserFrame";
import { NEW_USER_FRAME_LAYOUT } from "../src/constants/newUserFrameLayout";
import { useState, useCallback, useEffect, useRef } from "react";

// Auto-fit: photo stays at full `size` (avatarBoost = 1.0).
// frameScale is calculated so the frame's inner circle wraps exactly around the photo.
// Formula: frameScale = 1 / openingFraction
//   where openingFraction = what fraction of the rendered frame the inner circle occupies.
function estimateFrameScale(naturalWidth, naturalHeight) {
  if (!naturalWidth || !naturalHeight) return 1.55;
  const aspect = naturalWidth / naturalHeight;
  let openingFraction;
  if (aspect > 1.15) {
    openingFraction = 0.57; // wide frame — side decorations
  } else if (aspect < 0.75) {
    openingFraction = 0.52; // portrait frame — crown + banner
  } else {
    openingFraction = 0.65; // square-ish ring
  }
  return 1 / openingFraction;
}

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
  const frameImageSource =
    typeof resolvedFrame === "string" ? { uri: resolvedFrame } : resolvedFrame;
  const layout = NEW_USER_FRAME_LAYOUT;
  // For decoration frames (avatarBoost not passed), frameScale is auto-measured
  // from the image so the frame wraps around the photo. For VIP/new-user frames
  // the caller passes explicit frameScale, which wins.
  const [autoFrameScale, setAutoFrameScale] = useState(null);
  const prefetchedRef = useRef(null);

  // Pre-fetch dimensions via Image.getSize for remote URLs so the correct
  // frameScale is known before the image renders — eliminates the flash of
  // an oversized frame while waiting for onLoad.
  useEffect(() => {
    if (avatarBoost != null) return; // explicit avatarBoost = VIP/new-user, skip
    const uri =
      typeof resolvedFrame === "string"
        ? resolvedFrame
        : resolvedFrame?.uri ?? null;
    if (!uri || prefetchedRef.current === uri) return;
    prefetchedRef.current = uri;
    Image.getSize(
      uri,
      (w, h) => setAutoFrameScale(estimateFrameScale(w, h)),
      () => setAutoFrameScale(1.55)
    );
  }, [resolvedFrame, avatarBoost]);

  const handleFrameLoad = useCallback(
    (e) => {
      // Only auto-fit when the caller hasn't pinned a specific avatarBoost
      // (decoration frames). Photo stays at full size; frame grows around it.
      if (avatarBoost != null) return;
      const { width, height } = e.nativeEvent?.source ?? {};
      if (width && height) {
        setAutoFrameScale(estimateFrameScale(width, height));
      }
    },
    [avatarBoost]
  );

  // Decoration frames: photo = full size (boost 1.0), frame auto-scales around it.
  // VIP / new-user frames: use explicit props from the caller.
  const resolvedAvatarBoost = avatarBoost ?? 1.0;
  const resolvedFrameScale = frameScale ?? (avatarBoost == null ? (autoFrameScale ?? 1.55) : layout.frameScale);
  const resolvedFrameResizeMode = frameResizeMode ?? layout.frameResizeMode;
  const resolvedFrameOffsetX = frameOffsetX ?? layout.frameOffsetX;
  const resolvedFrameOffsetY = frameOffsetY ?? layout.frameOffsetY;
  const resolvedFrameBleed = frameBleed ?? layout.frameBleed;
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
        avatarImageStyle,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: resolvedFrame ? 0 : avatarSize / 2,
        },
      ]}
    />
  ) : (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(124,77,255,0.35)",
        },
        resolvedFrame
          ? [placeholderStyle, { borderWidth: 0, borderColor: "transparent" }]
          : placeholderStyle,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
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
        source={frameImageSource}
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
        onLoad={handleFrameLoad}
        pointerEvents="none"
      />
    </View>
  );
}
