import React, { memo, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from '@shared/components';
import { ms } from '@shared/utils/responsive';

const REASONS = [
  'Inappropriate Content',
  'Harassment or Hate Speech',
  'Spam or Scamming',
  'Fake Profile or Impersonation',
  'Other Issues',
];

export const ReportReasonModal = memo(function ReportReasonModal({
  visible,
  targetLabel,
  onClose,
  onSubmit,
}) {
  const [selected, setSelected] = useState(REASONS[0]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card}>
          <LinearGradient
            colors={['#1e0a3c', '#2d1b4e']}
            style={StyleSheet.absoluteFill}
            borderRadius={22}
          />
          <Text style={styles.title}>Report User</Text>
          <Text style={styles.sub}>
            Why are you reporting {targetLabel || 'this user'}?
          </Text>

          <View style={styles.reasonsList}>
            {REASONS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.reasonRow, selected === r && styles.reasonRowSelected]}
                onPress={() => setSelected(r)}
              >
                <Text style={[styles.reasonTxt, selected === r && styles.reasonTxtSelected]}>
                  {r}
                </Text>
                {selected === r && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={() => onSubmit && onSubmit(selected)}
            >
              <LinearGradient
                colors={['#EF4444', '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGrad}
              >
                <Text style={styles.submitTxt}>Submit Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(124,77,255,0.4)',
  },
  title: {
    color: '#FFFFFF',
    fontSize: ms(17),
    fontWeight: '800',
    marginBottom: 4,
  },
  sub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: ms(12),
    marginBottom: 16,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 20,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  reasonRowSelected: {
    backgroundColor: 'rgba(124,77,255,0.25)',
  },
  reasonTxt: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: ms(13),
  },
  reasonTxtSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  check: {
    color: '#EC4899',
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelTxt: {
    color: 'white',
    fontSize: ms(13),
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  submitGrad: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitTxt: {
    color: 'white',
    fontSize: ms(13),
    fontWeight: '700',
  },
});

export default ReportReasonModal;
