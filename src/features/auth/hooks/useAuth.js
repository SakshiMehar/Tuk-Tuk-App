import { useState, useCallback } from 'react';
import { useAuthStore } from '@store/auth/authStore';
import { authApi } from '../api/authApi';
import { logger } from '@shared/utils/logger';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setAuth = useAuthStore((s) => s.setAuth);
  const logoutStore = useAuthStore((s) => s.logout);

  const sendOtp = useCallback(async (phone) => {
    try {
      setLoading(true);
      setError(null);
      // Real API: await authApi.sendOtp(phone);
      return true;
    } catch (err) {
      logger.error('useAuth', 'Failed to send OTP', err);
      setError(err.message || 'Failed to send OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (phone, otp) => {
    try {
      setLoading(true);
      setError(null);
      // Real API: const res = await authApi.verifyOtp(phone, otp);
      const mockUser = {
        id: 'usr_' + Date.now(),
        name: 'Tuk-Tuk Star',
        phone,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        diamonds: 500,
        level: 1,
        isVip: false,
      };
      const mockToken = 'mock_jwt_token_' + Date.now();
      await setAuth(mockUser, mockToken);
      return true;
    } catch (err) {
      logger.error('useAuth', 'Failed to verify OTP', err);
      setError(err.message || 'Invalid OTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, [setAuth]);

  return { loading, error, sendOtp, verifyOtp, logout: logoutStore };
}

export default useAuth;
