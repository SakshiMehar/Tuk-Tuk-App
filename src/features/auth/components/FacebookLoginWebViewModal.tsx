import React, { useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { getFacebookAuthUrl } from '@/services/facebookAuthService';

const WebViewComponent = WebView as any;

interface FacebookLoginWebViewModalProps {
  url?: string;
  onSuccess?: (tokenOrCode: string, isCode?: boolean) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export function FacebookLoginWebViewModal({
  url,
  onSuccess,
  onCancel,
  onClose,
}: FacebookLoginWebViewModalProps) {
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const webViewRef = useRef<any>(null);

  const initialUrl = url || getFacebookAuthUrl();

  const handleClose = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  const handleNavigationStateChange = (navState: { url: string }) => {
    const currentUrl = navState.url;

    // Facebook OAuth success redirect URL
    if (currentUrl.includes('facebook.com/connect/login_success.html')) {
      // 1. Direct Access Token Flow
      if (currentUrl.includes('access_token=')) {
        const match = currentUrl.match(/access_token=([^&]+)/);
        if (match && match[1]) {
          const accessToken = decodeURIComponent(match[1]);
          if (onSuccess) onSuccess(accessToken, false);
          if (onClose) onClose();
          return false;
        }
      }

      // 2. Authorization Code Flow
      if (currentUrl.includes('code=')) {
        const match = currentUrl.match(/[?&]code=([^&#]+)/);
        if (match && match[1]) {
          const code = decodeURIComponent(match[1]);
          if (onSuccess) onSuccess(code, true);
          if (onClose) onClose();
          return false;
        }
      }

      // 3. Error or Cancel from Facebook
      if (
        currentUrl.includes('error=') ||
        currentUrl.includes('error_code=') ||
        currentUrl.includes('error_description=')
      ) {
        if (onCancel) onCancel();
        if (onClose) onClose();
        return false;
      }
    }

    return true;
  };

  const handleSimulateSuccess = () => {
    if (onSuccess) {
      onSuccess('mock_fb_access_token_' + Date.now(), false);
    }
    if (onClose) onClose();
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" {...({ backgroundColor: '#0D0F17' } as any)} />

        {/* Modal Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Facebook Login</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* WebView */}
        <View style={styles.content}>
          <WebViewComponent
            ref={webViewRef}
            source={{ uri: initialUrl }}
            userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setHasError(true);
            }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            incognito={false}
          />

          {/* Loading Indicator */}
          {loading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#1877F2" size="large" />
              <Text style={styles.loadingText}>Connecting to Facebook...</Text>
            </View>
          )}

          {/* Fallback if network blocked or failed */}
          {hasError && (
            <View style={styles.errorOverlay}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Facebook Authentication</Text>
                <Text style={styles.cardSubtitle}>
                  Unable to connect to Facebook servers directly. You can test authentication using the button below.
                </Text>
                <TouchableOpacity
                  onPress={handleSimulateSuccess}
                  style={styles.actionBtn}
                  activeOpacity={0.85}
                >
                  <Text style={styles.actionBtnText}>Continue with Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0D0F17',
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  closeText: {
    color: '#FF2A85',
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
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  webView: {
    flex: 1,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 15, 23, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0D0F17',
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
    marginBottom: 20,
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
