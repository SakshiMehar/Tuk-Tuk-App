import { useRef } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";

export default function FacebookLoginWebViewModal({
  authUrl,
  redirectUri,
  onSuccess,
  onCancel,
  onClose,
}) {
  const finishedRef = useRef(false);

  const finishOnce = (action) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    action();
    onClose?.();
  };

  const finish = (url) => {
    finishOnce(() => onSuccess?.(url));
  };

  const handleClose = () => {
    finishOnce(() => onCancel?.());
  };

  const tryCompleteFromUrl = (url) => {
    if (!url || !redirectUri) return false;
    if (url.startsWith(redirectUri)) {
      finish(url);
      return true;
    }
    return false;
  };

  const handleNavigation = (request) => {
    if (tryCompleteFromUrl(request?.url)) return false;
    return true;
  };

  return (
    <Modal visible animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>Sign in with Facebook</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: authUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#1877F2" />
            </View>
          )}
          onShouldStartLoadWithRequest={handleNavigation}
          onNavigationStateChange={
            Platform.OS === "android"
              ? (navState) => {
                  tryCompleteFromUrl(navState?.url);
                }
              : undefined
          }
          setSupportMultipleWindows={false}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#111" },
  closeBtn: { padding: 4 },
  closeText: { fontSize: 15, color: "#1877F2", fontWeight: "600" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
});
