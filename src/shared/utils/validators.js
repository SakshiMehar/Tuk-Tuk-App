/**
 * Input validators
 */

export function isValidPhoneNumber(phone) {
  if (!phone) return false;
  // Clean non-digits
  const digits = String(phone).replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function isValidOtp(otp, expectedLength = 6) {
  if (!otp) return false;
  const digits = String(otp).trim();
  return /^\d+$/.test(digits) && digits.length === expectedLength;
}
