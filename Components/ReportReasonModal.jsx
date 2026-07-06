import { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const QUICK_REASONS = [
  "Spam",
  "Harassment or bullying",
  "Nudity or sexual content",
  "Hate speech",
  "Violence or dangerous content",
  "False information",
  "Impersonation",
];

const MIN_REASON_LENGTH = 3;
const MAX_REASON_LENGTH = 500;

/**
 * Reusable "Report" reason modal — requires the user to write a reason
 * before a report is submitted.
 *
 * Usage:
 *   const [reportTarget, setReportTarget] = useState(null);
 *   <ReportReasonModal
 *     visible={reportTarget !== null}
 *     targetLabel={reportTarget?.name}
 *     onClose={() => setReportTarget(null)}
 *     onSubmit={(reason) => reportUser(reportTarget.id, reason)}
 *   />
 */
export default function ReportReasonModal({
  visible,
  title = "Report",
  targetLabel = "this",
  onClose,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const trimmed = reason.trim();
  const canSubmit = trimmed.length >= MIN_REASON_LENGTH && !submitting;

  const reset = () => {
    setReason("");
    setSubmitting(false);
    setError("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose?.();
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (trimmed.length < MIN_REASON_LENGTH) {
        setError("Please write a reason for your report.");
      }
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit?.(trimmed);
      reset();
    } catch (e) {
      setSubmitting(false);
      setError(e?.message || "Could not submit report. Please try again.");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <LinearGradient
            colors={["#1e0a3c", "#16082a", "#0d0618"]}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["#7c4dff", "#ff4ea3"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.topGlow}
          />
          <View style={styles.handle} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            Please tell us why you're reporting {targetLabel}. Your report is confidential.
          </Text>

          <View style={styles.chipsWrap}>
            {QUICK_REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, reason === r && styles.chipActive]}
                onPress={() => { setReason(r); setError(""); }}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Write your reason here..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={reason}
            onChangeText={(t) => { setReason(t); if (error) setError(""); }}
            multiline
            maxLength={MAX_REASON_LENGTH}
            editable={!submitting}
          />
          <Text style={styles.counter}>{reason.length}/{MAX_REASON_LENGTH}</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.8}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtnWrap, !canSubmit && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              <LinearGradient
                colors={["#ff6b35", "#ff3f72"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.submitBtn}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Report</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    borderBottomWidth: 0,
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 14,
  },
  title: {
    color: "white",
    fontSize: 19,
    fontWeight: "800",
  },
  subtitle: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "rgba(124,77,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  chipActive: {
    backgroundColor: "rgba(124,77,255,0.35)",
    borderColor: "#a78bfa",
  },
  chipText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12.5,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "white",
  },
  input: {
    minHeight: 90,
    maxHeight: 140,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
    color: "white",
    fontSize: 14,
    padding: 14,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    marginTop: 4,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12.5,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  cancelText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
    fontWeight: "700",
  },
  submitBtnWrap: {
    flex: 1.4,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtn: {
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
