import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const MAX_POST_PHOTOS = 10;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const PostCreateSheet = memo(({ visible, onClose, onPost }) => {
  const [caption, setCaption] = useState("");
  // Photos and video are mutually exclusive (same convention most social
  // apps use) — photos support picking/attaching several at once, video
  // stays a single attachment.
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [confirmed, setConfirmed] = useState(false); // true after user taps "Attach"
  const [loading, setLoading] = useState(false);
  const captionRef = useRef(null);
  const scrollRef = useRef(null);

  const mediaType = video ? "video" : photos.length > 0 ? "photo" : null;
  const hasMedia = photos.length > 0 || Boolean(video?.uri);

  useEffect(() => {
    if (!visible) {
      setCaption("");
      setPhotos([]);
      setVideo(null);
      setConfirmed(false);
    }
  }, [visible]);

  const addPhotos = useCallback((assets) => {
    setPhotos((prev) => {
      const existingUris = new Set(prev.map((a) => a.uri));
      const fresh = assets.filter((a) => a?.uri && !existingUris.has(a.uri));
      return [...prev, ...fresh].slice(0, MAX_POST_PHOTOS);
    });
    setVideo(null);
  }, []);

  const pickMedia = useCallback(
    async (type) => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Gallery access is required to attach a photo or video.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === "photo" ? ["images"] : ["videos"],
        allowsEditing: false,
        allowsMultipleSelection: type === "photo",
        selectionLimit: type === "photo" ? MAX_POST_PHOTOS : 1,
        quality: 0.85,
        videoMaxDuration: 60,
      });
      if (result.canceled || !result.assets?.length) return;
      if (type === "photo") {
        addPhotos(result.assets);
      } else {
        setVideo(result.assets[0]);
        setPhotos([]);
      }
      setConfirmed(true);
    },
    [addPhotos],
  );

  const openCamera = useCallback(
    async (type) => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Camera access is required to take a photo or video.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === "photo" ? ["images"] : ["videos"],
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled || !result.assets?.[0]) return;
      if (type === "photo") {
        addPhotos([result.assets[0]]);
      } else {
        setVideo(result.assets[0]);
        setPhotos([]);
      }
      setConfirmed(true);
    },
    [addPhotos],
  );

  const removePhotoAt = useCallback((index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // "Done" just confirms the media selection and reveals the caption input.
  // The actual API call happens in handlePost when the user taps "Post".
  const handleConfirmMedia = useCallback(() => {
    if (!hasMedia) return;
    setConfirmed(true);
  }, [hasMedia]);

  // Re-launch picker with crop enabled on the existing single photo. Only
  // offered when exactly one photo is attached — cropping several photos
  // one-by-one is out of scope here.
  const handleCrop = useCallback(async () => {
    if (photos.length !== 1) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true, // native crop UI
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.[0]) {
      setPhotos([result.assets[0]]);
      setConfirmed(true);
    }
  }, [photos]);

  const handlePost = useCallback(async () => {
    if (!caption.trim() && !hasMedia) return;
    setLoading(true);
    try {
      await onPost({ caption, photos, video, mediaType });
      onClose();
    } catch (e) {
      Alert.alert(
        "Post failed",
        e?.message || "Could not create your post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [caption, photos, video, mediaType, hasMedia, onPost, onClose]);

  const canPost = caption.trim().length > 0 || hasMedia;
  const showComposer = !hasMedia || confirmed;

  const renderPhotosItem = ({ item, index }) => {
    return (
      <View key={index} style={[postCreateStyles.photoItem]}>
        <Image
          source={{ uri: item.uri }}
          style={postCreateStyles.confirmedThumbImg1}
          contentFit="cover"
        />
        <TouchableOpacity
          style={postCreateStyles.removeBtnSmall}
          onPress={() => removePhotoAt(index)}
        >
          <Text style={postCreateStyles.removeTxt}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={postCreateStyles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
        <View
          style={{
            width: "100%",
            justifyContent: "flex-end",
            paddingBottom: 45,
            flexGrow: 1,
          }}
        >
          <View style={postCreateStyles.sheet}>
            <LinearGradient
              colors={["#1e0a3c", "#16082a", "#0d0618"]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["#7c4dff", "#ff4ea3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={postCreateStyles.topGlow}
            />
            <View style={postCreateStyles.handle} />

            {/* ── HEADER ── */}
            <View style={postCreateStyles.header}>
              <Text style={postCreateStyles.title}>Create Post</Text>
              <TouchableOpacity
                onPress={onClose}
                style={postCreateStyles.closeBtn}
              >
                <Text style={postCreateStyles.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 48 }}
            >
              {/* ── STEP 1: media picker (hidden after confirmed) ── */}
              <View style={postCreateStyles.mediaRow}>
                <TouchableOpacity
                  style={postCreateStyles.mediaCard}
                  onPress={() => pickMedia("photo")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(124,77,255,0.25)", "rgba(124,77,255,0.08)"]}
                    style={postCreateStyles.mediaCardGrad}
                  >
                    <Text style={postCreateStyles.mediaCardEmoji}>🖼️</Text>
                    <Text style={postCreateStyles.mediaCardLabel}>Gallery</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={postCreateStyles.mediaCard}
                  onPress={() => openCamera("photo")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(255,78,163,0.25)", "rgba(255,78,163,0.08)"]}
                    style={postCreateStyles.mediaCardGrad}
                  >
                    <Text style={postCreateStyles.mediaCardEmoji}>📷</Text>
                    <Text style={postCreateStyles.mediaCardLabel}>Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={postCreateStyles.mediaCard}
                  onPress={() => pickMedia("video")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(255,107,53,0.25)", "rgba(255,107,53,0.08)"]}
                    style={postCreateStyles.mediaCardGrad}
                  >
                    <Text style={postCreateStyles.mediaCardEmoji}>🎬</Text>
                    <Text style={postCreateStyles.mediaCardLabel}>Video</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  style={postCreateStyles.mediaCard}
                  onPress={() => openCamera("video")}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["rgba(0,180,216,0.25)", "rgba(0,180,216,0.08)"]}
                    style={postCreateStyles.mediaCardGrad}
                  >
                    <Text style={postCreateStyles.mediaCardEmoji}>🎥</Text>
                    <Text style={postCreateStyles.mediaCardLabel}>Record</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
              {!confirmed && (
                <>
                  {/* ── FULL PREVIEW + BOTTOM ACTION BUTTONS ── */}
                  {hasMedia && (
                    <View style={postCreateStyles.confirmBlock}>
                      {video ? (
                        <View style={postCreateStyles.previewWrapper}>
                          <Image
                            source={{ uri: video.uri }}
                            style={postCreateStyles.preview}
                            contentFit="cover"
                          />
                          <View style={postCreateStyles.videoOverlay}>
                            <Text style={postCreateStyles.videoPlayIcon}>
                              ▶
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={postCreateStyles.removeBtn}
                            onPress={() => setVideo(null)}
                          >
                            <Text style={postCreateStyles.removeTxt}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={
                            postCreateStyles.photoStripContent
                          }
                          style={postCreateStyles.photoStrip}
                        >
                          {photos.map((photo, index) => (
                            <View
                              key={photo.uri}
                              style={postCreateStyles.photoStripItem}
                            >
                              <Image
                                source={{ uri: photo.uri }}
                                style={postCreateStyles.photoStripImg}
                                contentFit="cover"
                              />
                              <TouchableOpacity
                                style={postCreateStyles.removeBtnSmall}
                                onPress={() => removePhotoAt(index)}
                              >
                                <Text style={postCreateStyles.removeTxt}>
                                  ✕
                                </Text>
                              </TouchableOpacity>
                            </View>
                          ))}
                          {photos.length < MAX_POST_PHOTOS && (
                            <TouchableOpacity
                              style={postCreateStyles.photoStripAdd}
                              activeOpacity={0.8}
                              onPress={() => pickMedia("photo")}
                            >
                              <Text style={postCreateStyles.photoStripAddTxt}>
                                ＋
                              </Text>
                            </TouchableOpacity>
                          )}
                        </ScrollView>
                      )}
                      {photos.length > 1 && (
                        <Text style={postCreateStyles.photoCountTxt}>
                          {photos.length}/{MAX_POST_PHOTOS} photos selected
                        </Text>
                      )}

                      {/* ── BOTTOM ACTION BUTTONS: Crop · Rotate · Flip · Done ── */}
                      <View style={postCreateStyles.previewActions}>
                        {photos.length === 1 && (
                          <TouchableOpacity
                            style={postCreateStyles.previewActionBtn}
                            onPress={handleCrop}
                            activeOpacity={0.8}
                          >
                            <Text style={postCreateStyles.previewActionEmoji}>
                              ✂️
                            </Text>
                            <Text style={postCreateStyles.previewActionLabel}>
                              Crop
                            </Text>
                          </TouchableOpacity>
                        )}

                        {!video && (
                          <>
                            <TouchableOpacity
                              style={postCreateStyles.previewActionBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={postCreateStyles.previewActionEmoji}>
                                🔄
                              </Text>
                              <Text style={postCreateStyles.previewActionLabel}>
                                Rotate
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={postCreateStyles.previewActionBtn}
                              activeOpacity={0.8}
                            >
                              <Text style={postCreateStyles.previewActionEmoji}>
                                ↔️
                              </Text>
                              <Text style={postCreateStyles.previewActionLabel}>
                                Flip
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}

                        <TouchableOpacity
                          onPress={handleConfirmMedia}
                          disabled={loading}
                          activeOpacity={0.85}
                          style={postCreateStyles.previewDoneBtn}
                        >
                          <LinearGradient
                            colors={["#7c4dff", "#a855f7"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={postCreateStyles.previewDoneGrad}
                          >
                            {loading ? (
                              <ActivityIndicator color="white" size="small" />
                            ) : (
                              <Text style={postCreateStyles.previewDoneTxt}>
                                ✓ Done
                              </Text>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}

              {/* ── STEP 2: confirmed — show thumbnail(s) + caption + post ── */}
              {confirmed && hasMedia && (
                <View style={postCreateStyles.confirmedCard}>
                  {video && (
                    <View style={postCreateStyles.confirmedThumbBox}>
                      <Image
                        source={{ uri: video ? video.uri : photos[0].uri }}
                        style={postCreateStyles.confirmedThumbImg}
                        contentFit="cover"
                      />
                      <View style={postCreateStyles.thumbVideoOverlay}>
                        <Text style={postCreateStyles.thumbVideoIcon}>▶</Text>
                      </View>
                    </View>
                  )}
                  {!video && (
                    <View style={postCreateStyles.photoStrip}>
                      <FlatList
                        data={photos}
                        extraData={photos}
                        numColumns={4}
                        style={{
                          marginTop: 10,
                        }}
                        renderItem={renderPhotosItem}
                      />
                    </View>
                  )}
                  <Text style={postCreateStyles.confirmedLabel}>
                    {video
                      ? "🎬 Video attached"
                      : `📷 ${photos.length} photo${photos.length > 1 ? "s" : ""} attached`}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setConfirmed(false);
                    }}
                  >
                    <Text style={postCreateStyles.changeMediaTxt}>Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── CAPTION + POST (text-only, or after media is confirmed) ── */}
              {showComposer && (
                <View style={postCreateStyles.inputWrapper}>
                  <TextInput
                    ref={captionRef}
                    style={postCreateStyles.captionInput}
                    placeholder="What's on your mind?"
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={500}
                  />
                  <Text style={postCreateStyles.charCount}>
                    {caption.length}/500
                  </Text>
                </View>
              )}
            </ScrollView>
            {showComposer && (
              <TouchableOpacity
                onPress={handlePost}
                disabled={!canPost || loading}
                activeOpacity={0.85}
                style={postCreateStyles.postBtnOuter}
              >
                <LinearGradient
                  colors={
                    canPost ? ["#7c4dff", "#ff4ea3"] : ["#2a2a3e", "#2a2a3e"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={postCreateStyles.postBtnGrad}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={postCreateStyles.postBtnTxt}>✦ Post</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
});

PostCreateSheet.displayName = "PostCreateSheet";

const postCreateStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    width: "100%",
    justifyContent: "flex-end",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingHorizontal: 18,
    height: SCREEN_HEIGHT * 0.88,
  },
  topGlow: { height: 2, width: "100%" },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: { color: "rgba(255,255,255,0.7)", fontSize: 14 },

  // Media picker row
  mediaRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
  mediaCard: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaCardGrad: { paddingVertical: 14, alignItems: "center", gap: 6 },
  mediaCardEmoji: { fontSize: 24 },
  mediaCardLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "600",
  },

  // Full preview (step 1)
  confirmBlock: { marginBottom: 4 },
  previewWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  preview: { width: "100%", height: "100%", backgroundColor: "#1a0a2e" },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  videoPlayIcon: { fontSize: 36, color: "white" },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtnSmall: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ff0000ff",
    alignItems: "center",
    justifyContent: "center",
  },
  removeTxt: { color: "white", fontSize: 12 },

  // Multi-photo strip (step 1)
  photoStrip: { marginBottom: 4, flex: 1 },
  photoStripContent: { gap: 10, paddingRight: 4, justifyContent: "center" },
  photoStripItem: {
    width: 96,
    height: 96,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  photoItem: {
    width: SCREEN_WIDTH / 5.5,
    height: SCREEN_WIDTH / 5.5,
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  photoStripImg: { width: "100%", height: "100%", backgroundColor: "#1a0a2e" },
  photoStripAdd: {
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(167,139,250,0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,77,255,0.08)",
  },
  photoStripAddTxt: { color: "#b388ff", fontSize: 26, fontWeight: "300" },
  photoCountTxt: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 4,
  },

  // Bottom action bar on preview (Rotate · Flip · Done)
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
    gap: 10,
  },
  previewActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    gap: 4,
  },
  previewActionEmoji: { fontSize: 20 },
  previewActionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  previewDoneBtn: { flex: 2, borderRadius: 16, overflow: "hidden" },
  previewDoneGrad: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  previewDoneTxt: { color: "white", fontSize: 15, fontWeight: "800" },

  // Keep changeMediaTxt for the confirmed step
  changeMediaBtn: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  changeMediaTxt: { color: "#b388ff", fontSize: 13 },

  // Confirmed media card (step 2) — centered preview + attractive glow card
  confirmedCard: {
    alignItems: "center",
    borderRadius: 22,
    overflow: "hidden",
    paddingBottom: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  confirmedThumbBox: {
    width: 148,
    height: 148,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    marginVertical: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmedThumbImg: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a0a2e",
  },
  confirmedThumbImg1: {
    width: SCREEN_WIDTH / 5.5,
    height: SCREEN_WIDTH / 5.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  thumbVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  thumbVideoIcon: { fontSize: 34, color: "white" },
  thumbTick: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(13,6,24,0.9)",
  },
  thumbTickTxt: { color: "white", fontSize: 12, fontWeight: "700" },
  thumbCountBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  thumbCountTxt: { color: "white", fontSize: 11, fontWeight: "700" },
  confirmedLabel: {
    color: "#c4b5fd",
    fontSize: 13.5,
    fontWeight: "700",
    marginBottom: 4,
  },

  // Caption input
  inputWrapper: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14,
    paddingBottom: 10,
    marginBottom: 15,
    minHeight: 150,
  },
  captionInput: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 20,
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    textAlign: "right",
    marginTop: 4,
  },

  // Post button
  postBtnOuter: { borderRadius: 26, overflow: "hidden", marginBottom: 20 },
  postBtnGrad: { height: 52, alignItems: "center", justifyContent: "center" },
  postBtnTxt: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default PostCreateSheet;
