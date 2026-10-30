import { apiClient } from '@shared/network/apiClient';
import { ENDPOINTS } from '@shared/network/endpoints';

export const authApi = {
  sendOtp: (phone) => {
    return apiClient.post(ENDPOINTS.AUTH.SEND_OTP, { phone });
  },

  verifyOtp: (phone, otp) => {
    return apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, { phone, otp });
  },

  logout: () => {
    return apiClient.post(ENDPOINTS.AUTH.LOGOUT, {});
  },
};

export default authApi;
