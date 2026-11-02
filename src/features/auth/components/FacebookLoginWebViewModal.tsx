import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
interface FacebookLoginWebViewModalProps {
  url?: string;
  onSuccess?: (token: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function FacebookLoginWebViewModal({
  url: _url,
  onSuccess,
  onCancel,
  onClose,
}: FacebookLoginWebViewModalProps) {
  const handleClose = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleSimulateSuccess = () => {
    if (onSuccess) {
      onSuccess('mock_fb_access_token_' + Date.now());
    }
    if (onClose) onClose();
  };

  return (
    <Modal visible={true} animationType="slide" transparent={false} onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Facebook Login</Text>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sign in with Facebook</Text>
            <Text style={styles.cardSubtitle}>
              Connecting to secure Facebook authentication service...
            </Text>

            <TouchableOpacity
              onPress={handleSimulateSuccess}
              style={styles.actionBtn}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>Continue as Facebook User</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F17',
  },
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeText: {
    color: '#EC4899',
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#1877F2',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default FacebookLoginWebViewModal;
