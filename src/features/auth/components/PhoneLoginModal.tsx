import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { X, ArrowLeft, Phone, ShieldCheck, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { s, vs, ms } from '@shared/utils/responsive';
import { sendPhoneOtp, verifyPhoneOtpAndLogin } from '@/services/firebasePhoneService';

interface PhoneLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
];

export function PhoneLoginModal({ visible, onClose, onSuccess }: PhoneLoginModalProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryList, setShowCountryList] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [isDevMode, setIsDevMode] = useState(false);

  const otpInputs = useRef<any[]>([]);

  // Reset state on open
  useEffect(() => {
    if (visible) {
      setStep('phone');
      setPhone('');
      setName('');
      setOtp(['', '', '', '', '', '']);
      setError('');
      setResendTimer(30);
      setIsDevMode(false);
    }
  }, [visible]);

  // Resend countdown
  useEffect(() => {
    let interval: any;
    if (step === 'otp' && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async () => {
    Keyboard.dismiss();
    setError('');
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${cleanPhone}`;
    setLoading(true);

    try {
      const result = await sendPhoneOtp(fullPhoneNumber);
      setIsDevMode(!!result?.isDevMode);
      setStep('otp');
      setResendTimer(30);
      setTimeout(() => {
        otpInputs.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    setError('');
    const sanitized = val.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = sanitized ? sanitized[sanitized.length - 1] : '';
    setOtp(newOtp);

    // Auto focus next
    if (sanitized && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    Keyboard.dismiss();
    setError('');
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the code');
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneOtpAndLogin(code, name.trim() || undefined);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Incorrect verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    const fullPhoneNumber = `${selectedCountry.code}${phone.trim().replace(/\D/g, '')}`;
    try {
      await sendPhoneOtp(fullPhoneNumber);
      setResendTimer(30);
      setOtp(['', '', '', '', '', '']);
      otpInputs.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardContainer}
          >
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.modalHeader}>
                {step === 'otp' ? (
                  <TouchableOpacity
                    onPress={() => {
                      setStep('phone');
                      setError('');
                    }}
                    style={styles.backBtn}
                  >
                    <ArrowLeft size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 36 }} />
                )}

                <Text style={styles.modalHeaderTitle}>
                  {step === 'phone' ? 'Phone Sign In' : 'Enter Verification Code'}
                </Text>

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={20} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>

              {/* ── STEP 1: ENTER PHONE ── */}
              {step === 'phone' && (
                <View style={styles.body}>
                  <View style={styles.iconCircle}>
                    <Phone size={28} color="#FF2A85" />
                  </View>

                  <Text style={styles.title}>Enter Mobile Number</Text>
                  <Text style={styles.subtitle}>
                    We will send a 6-digit one-time code to verify your account
                  </Text>

                  {/* Phone Input Row */}
                  <View style={styles.phoneInputRow}>
                    <TouchableOpacity
                      style={styles.countryPickerBtn}
                      activeOpacity={0.8}
                      onPress={() => setShowCountryList(!showCountryList)}
                    >
                      <Text style={styles.flagText}>{selectedCountry.flag}</Text>
                      <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                    </TouchableOpacity>

                    <TextInput
                      style={styles.phoneInput}
                      placeholder="98765 43210"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      keyboardType="phone-pad"
                      maxLength={12}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t);
                        setError('');
                      }}
                      autoFocus
                    />
                  </View>

                  {/* Quick Country Dropdown */}
                  {showCountryList && (
                    <View style={styles.countryDropdown}>
                      {COUNTRY_CODES.map((c) => (
                        <TouchableOpacity
                          key={c.code}
                          style={styles.countryItem}
                          onPress={() => {
                            setSelectedCountry(c);
                            setShowCountryList(false);
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>{c.flag}</Text>
                          <Text style={styles.countryName}>{c.name}</Text>
                          <Text style={styles.countryCodeBadge}>{c.code}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Optional Name */}
                  <TextInput
                    style={styles.nameInput}
                    placeholder="Your Name (optional)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={name}
                    onChangeText={setName}
                  />

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FF2A85', '#9333EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Get OTP Code</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}

              {/* ── STEP 2: ENTER OTP ── */}
              {step === 'otp' && (
                <View style={styles.body}>
                  <View style={styles.iconCircle}>
                    <ShieldCheck size={28} color="#22C55E" />
                  </View>

                  <Text style={styles.title}>Verification Code</Text>
                  <Text style={styles.subtitle}>
                    Sent to {selectedCountry.code} {phone.trim()}
                  </Text>
                  {isDevMode && (
                    <Text
                      style={{
                        color: '#F59E0B',
                        fontSize: ms(11.5),
                        textAlign: 'center',
                        marginBottom: vs(12),
                        fontWeight: '600',
                      }}
                    >
                      💡 Demo/Test: Enter 6 digits (e.g. 123456)
                    </Text>
                  )}

                  {/* 6 Digit OTP Input Boxes */}
                  <View style={styles.otpBoxesRow}>
                    {otp.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={(ref) => {
                          otpInputs.current[idx] = ref;
                        }}
                        style={[
                          styles.otpBox,
                          digit ? styles.otpBoxFilled : null,
                          error ? styles.otpBoxError : null,
                        ]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, idx)}
                        onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  {/* Resend Row */}
                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <Text style={styles.timerText}>
                        Resend code in <Text style={{ color: '#FF2A85', fontWeight: '700' }}>{resendTimer}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResendOtp}
                        style={styles.resendBtn}
                        activeOpacity={0.8}
                      >
                        <RefreshCw size={13} color="#FF2A85" />
                        <Text style={styles.resendBtnText}>Resend Code</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Verify & Login Button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#FF2A85', '#9333EA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" size="small" />
                      ) : (
                        <Text style={styles.submitBtnText}>Verify & Login</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(16),
  },
  keyboardContainer: {
    width: '100%',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#16132F',
    borderRadius: s(24),
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingTop: vs(14),
    paddingBottom: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
  },
  modalHeaderTitle: {
    color: 'white',
    fontSize: ms(15),
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  backBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: s(20),
    paddingVertical: vs(20),
    alignItems: 'center',
  },
  iconCircle: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: 'rgba(255, 42, 133, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 42, 133, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
  },
  title: {
    color: 'white',
    fontSize: ms(18),
    fontWeight: '800',
    marginBottom: vs(6),
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: ms(12.5),
    textAlign: 'center',
    lineHeight: ms(18),
    marginBottom: vs(18),
    paddingHorizontal: s(10),
  },
  phoneInputRow: {
    flexDirection: 'row',
    width: '100%',
    height: vs(50),
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginBottom: vs(12),
  },
  countryPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.15)',
    gap: s(5),
  },
  flagText: {
    fontSize: ms(16),
  },
  countryCodeText: {
    color: 'white',
    fontSize: ms(14),
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    color: 'white',
    fontSize: ms(15),
    fontWeight: '600',
    paddingHorizontal: s(14),
  },
  countryDropdown: {
    width: '100%',
    backgroundColor: '#1E1A3D',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: vs(12),
    paddingVertical: vs(4),
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
    paddingHorizontal: s(14),
    gap: s(10),
  },
  countryName: {
    color: 'white',
    fontSize: ms(13),
    flex: 1,
  },
  countryCodeBadge: {
    color: '#FF2A85',
    fontSize: ms(13),
    fontWeight: '700',
  },
  nameInput: {
    width: '100%',
    height: vs(46),
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    fontSize: ms(13.5),
    paddingHorizontal: s(14),
    marginBottom: vs(14),
  },
  errorText: {
    color: '#FF4D6D',
    fontSize: ms(12),
    fontWeight: '600',
    marginBottom: vs(12),
    textAlign: 'center',
  },
  submitBtn: {
    width: '100%',
    height: vs(50),
    borderRadius: s(14),
    overflow: 'hidden',
    shadowColor: '#FF2A85',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontSize: ms(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // OTP Styles
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(8),
    marginBottom: vs(18),
  },
  otpBox: {
    width: s(42),
    height: vs(48),
    borderRadius: s(10),
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    color: 'white',
    fontSize: ms(20),
    fontWeight: '900',
    textAlign: 'center',
  },
  otpBoxFilled: {
    borderColor: '#FF2A85',
    backgroundColor: 'rgba(255, 42, 133, 0.08)',
  },
  otpBoxError: {
    borderColor: '#FF4D6D',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(18),
  },
  timerText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: ms(13),
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  resendBtnText: {
    color: '#FF2A85',
    fontSize: ms(13),
    fontWeight: '700',
  },
});

export default PhoneLoginModal;
