import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80',
];

export const PostCreateModal = memo(function PostCreateModal({
  visible,
  onClose,
  onSubmit,
}) {
  const [caption, setCaption] = useState('');
  const [photos, setPhotos] = useState([]);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setCaption('');
      setPhotos([]);
      setVideo(null);
    }
  }, [visible]);

  const handlePickSamplePhoto = useCallback(() => {
    const nextPhoto = SAMPLE_IMAGES[photos.length % SAMPLE_IMAGES.length];
    setPhotos((prev) => [...prev, { uri: nextPhoto }]);
  }, [photos.length]);

  const handlePickSampleVideo = useCallback(() => {
    setVideo({
      uri: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    });
    setPhotos([]);
  }, []);

  const handleRemovePhoto = useCallback((idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handlePost = useCallback(async () => {
    if (!caption.trim() && photos.length === 0 && !video) return;
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({
          caption,
          photos,
          video,
          mediaType: video ? 'video' : photos.length > 0 ? 'photo' : null,
        });
      }
      onClose();
    } finally {
      setLoading(false);
    }
  }, [caption, photos, video, onSubmit, onClose]);

  const canPost = caption.trim().length > 0 || photos.length > 0 || !!video;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.sheet}>
          <LinearGradient
            colors={['#1e0a3c', '#16082a', '#0d0618']}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={['#7c4dff', '#ff4ea3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlow}
          />

          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Post</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* Quick Media Attachment Buttons */}
            <View style={styles.mediaRow}>
              <TouchableOpacity
                style={styles.mediaCard}
                onPress={handlePickSamplePhoto}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(124,77,255,0.25)', 'rgba(124,77,255,0.08)']}
                  style={styles.mediaCardGrad}
                >
                  <Text style={styles.mediaCardEmoji}>🖼️</Text>
                  <Text style={styles.mediaCardLabel}>Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaCard}
                onPress={handlePickSamplePhoto}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,78,163,0.25)', 'rgba(255,78,163,0.08)']}
                  style={styles.mediaCardGrad}
                >
                  <Text style={styles.mediaCardEmoji}>📷</Text>
                  <Text style={styles.mediaCardLabel}>Camera</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaCard}
                onPress={handlePickSampleVideo}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['rgba(255,107,53,0.25)', 'rgba(255,107,53,0.08)']}
                  style={styles.mediaCardGrad}
                >
                  <Text style={styles.mediaCardEmoji}>🎬</Text>
                  <Text style={styles.mediaCardLabel}>Video</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Confirmed Media Thumbnails */}
            {photos.length > 0 && (
              <View style={styles.photosStrip}>
                {photos.map((item, idx) => (
                  <View key={item.uri + idx} style={styles.photoThumbWrap}>
                    <Image source={{ uri: item.uri }} style={styles.photoThumb} />
                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => handleRemovePhoto(idx)}
                    >
                      <Text style={styles.removeTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Caption Input */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.captionInput}
                placeholder="What's on your mind? Share with the community…"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>{caption.length}/500</Text>
            </View>
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handlePost}
            disabled={!canPost || loading}
            activeOpacity={0.85}
            style={styles.postBtnOuter}
          >
            <LinearGradient
              colors={canPost ? ['#7c4dff', '#ff4ea3'] : ['#2a2a3e', '#2a2a3e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.postBtnGrad}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.postBtnTxt}>✦ Post</Text>
              )}
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    width: '100%',
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  topGlow: {
    height: 2,
    width: '100%',
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: ms(18),
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  mediaCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mediaCardGrad: {
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  mediaCardEmoji: {
    fontSize: 22,
  },
  mediaCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  photosStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  photoThumbWrap: {
    width: (SCREEN_WIDTH - 66) / 3,
    height: (SCREEN_WIDTH - 66) / 3,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTxt: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
  inputWrapper: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 120,
    marginBottom: 16,
  },
  captionInput: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    minHeight: 85,
    textAlignVertical: 'top',
  },
  charCount: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'right',
  },
  postBtnOuter: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  postBtnGrad: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnTxt: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default PostCreateModal;
