import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Home, Megaphone, Plus, Upload, X } from 'lucide-react-native';
import { partyApi } from '../src/features/party/api/partyApi';
import { getUser } from '../src/store/authStore';
import { getAppUserId } from '../src/utils/sessionUser';

const THEME = {
  bg: '#0f0720',
  bgTop: '#241242',
  card: '#470f31',
  cardAlt: '#22133f',
  border: 'rgba(167,139,250,0.24)',
  borderStrong: 'rgba(167,139,250,0.45)',
  purple: '#7c4dff',
  purpleDeep: '#6a2fe0',
  purpleLight: '#a78bfa',
  pink: '#ff3f93',
  pinkDeep: '#e0298a',
  gold: '#ffd479',
  text: '#ffffff',
  textMuted: 'rgba(220,208,255,0.55)',
  textSubtle: 'rgba(220,208,255,0.78)',
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(167,139,250,0.28)',
  danger: '#ff5c8a',
};

const DEFAULT_ROOM_PHOTOS = [
  'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
];

export interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onEntered?: (roomId: string, room?: any) => void;
  onCreateRoom?: (roomData: any) => Promise<void> | void;
}

export default function CreateRoomModal({
  visible,
  onClose,
  onEntered,
  onCreateRoom,
}: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string>(DEFAULT_ROOM_PHOTOS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [validationType, setValidationType] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setRoomName('');
    setAnnouncement('');
    setSelectedPhoto(DEFAULT_ROOM_PHOTOS[0]);
    setValidationType(null);
  }, []);

  const loadModalData = useCallback(async () => {
    try {
      const [resolvedUserId, user] = await Promise.all([
        getAppUserId().catch(() => null),
        getUser().catch(() => null),
      ]);
      setRoomName(
        user?.name?.trim() ||
          user?.username?.trim() ||
          (resolvedUserId ? `Room ${resolvedUserId}` : 'My Voice Party')
      );
      setAnnouncement('Welcome to our voice party! Come chat and vibe with us 🎶');
    } catch {
      setRoomName('My Voice Party');
    }
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      loadModalData();
    }
  }, [visible, resetForm, loadModalData]);

  const handleCreate = async () => {
    const trimmedName = roomName.trim();
    const trimmedAnnouncement = announcement.trim();

    if (!trimmedName) {
      setValidationType('roomName');
      return;
    }
    if (!trimmedAnnouncement) {
      setValidationType('announcement');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: trimmedName,
        title: trimmedName,
        announcement: trimmedAnnouncement,
        body: trimmedAnnouncement,
        imageUrl: selectedPhoto,
        coverImage: selectedPhoto,
        roomType: 'Party',
        category: 'recommend',
      };

      if (onCreateRoom) {
        await onCreateRoom(payload);
        onClose();
        return;
      }

      let res: any;
      try {
        res = await partyApi.createRoom(payload);
      } catch (err: any) {
        console.warn('[CreateRoomModal] createRoom api error:', err);
      }

      const newRoomId = String(res?.roomId || res?.id || res?.data?.roomId || `room_${Date.now()}`);
      const createdRoom = {
        id: newRoomId,
        roomId: newRoomId,
        name: trimmedName,
        title: trimmedName,
        thumbnail: selectedPhoto,
        imageUrl: selectedPhoto,
        announcement: trimmedAnnouncement,
      };

      onClose();
      onEntered?.(newRoomId, createdRoom);
    } catch (err: any) {
      Alert.alert('Could not create room', err?.message || 'Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.sheetWrap}
        >
          <View style={styles.sheet}>
            <View style={styles.grabber} />

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Create Party Room</Text>
                <Text style={styles.subtitle}>Set up your voice stage and invite friends</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <X size={18} color={THEME.purpleLight} />
              </TouchableOpacity>
            </View>

            {/* Cover Photo Selection */}
            <View style={styles.photoSection}>
              <Image source={{ uri: selectedPhoto }} style={styles.coverPreview} resizeMode="cover" />
              <View style={styles.photoPickerRow}>
                {DEFAULT_ROOM_PHOTOS.map((uri, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPhoto(uri)}
                    style={[
                      styles.photoOption,
                      selectedPhoto === uri && styles.photoOptionSelected,
                    ]}
                  >
                    <Image source={{ uri }} style={styles.photoOptionImage} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.photoHint}>Choose a theme cover for your room</Text>
            </View>

            <View style={styles.divider} />

            {/* Room Name */}
            <Text style={styles.fieldLabel}>ROOM NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Give your room a fun name..."
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={roomName}
              onChangeText={setRoomName}
              maxLength={40}
            />

            {/* Announcement */}
            <View style={styles.announcementLabelRow}>
              <Megaphone size={13} color={THEME.purpleLight} />
              <Text style={styles.fieldLabel}>ANNOUNCEMENT</Text>
            </View>
            <TextInput
              style={[styles.input, styles.announcementInput]}
              placeholder="What's this party about?"
              placeholderTextColor="rgba(255,255,255,0.35)"
              value={announcement}
              onChangeText={setAnnouncement}
              multiline
              maxLength={120}
            />

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.createBtnWrap}
                onPress={handleCreate}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[THEME.pinkDeep, THEME.purpleDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createBtn}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.createText}>Go Live Now 🎉</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Validation alert modal */}
      {validationType && (
        <Modal visible transparent animationType="fade">
          <View style={styles.popupOverlay}>
            <View style={styles.photoRequiredCard}>
              <Text style={styles.popupTitle}>Notice</Text>
              <Text style={styles.popupMessage}>
                {validationType === 'roomName'
                  ? 'Please enter a name for your room.'
                  : 'Please enter an announcement for your room.'}
              </Text>
              <TouchableOpacity
                style={styles.popupUploadBtn}
                onPress={() => setValidationType(null)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[THEME.pinkDeep, THEME.purpleDeep]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.popupUploadGradient}
                >
                  <Text style={styles.popupUploadText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 4, 35, 0.7)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '85%',
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    backgroundColor: THEME.card,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 24,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(167,139,250,0.35)',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,77,255,0.16)',
    borderWidth: 1,
    borderColor: THEME.border,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  coverPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: THEME.pink,
    marginBottom: 10,
  },
  photoPickerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  photoOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  photoOptionSelected: {
    borderColor: THEME.pink,
  },
  photoOptionImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  photoHint: {
    color: THEME.textMuted,
    fontSize: 11,
  },
  divider: {
    height: 1,
    backgroundColor: THEME.border,
    marginBottom: 14,
  },
  fieldLabel: {
    color: THEME.textSubtle,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: THEME.inputBg,
    borderWidth: 1,
    borderColor: THEME.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: THEME.text,
    fontSize: 14,
    marginBottom: 12,
  },
  announcementLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  announcementInput: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelText: {
    color: THEME.purpleLight,
    fontSize: 14,
    fontWeight: '700',
  },
  createBtnWrap: {
    flex: 1.6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  createBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,0,14,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  photoRequiredCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: THEME.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 24,
    alignItems: 'center',
  },
  popupTitle: {
    color: THEME.text,
    fontSize: 17,
    fontWeight: '800',
  },
  popupMessage: {
    color: THEME.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
  },
  popupUploadBtn: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  popupUploadGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupUploadText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
