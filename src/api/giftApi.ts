import API from './axios';

/** GET /api/app/gifts/gift-receive — gifts received by the current user */
export const getGiftsReceived = async () => {
  try {
    const response = await API.get('/api/app/gifts/gift-receive');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    return [];
  }
};

/** GET /api/app/gifts/gift-send — gifts sent by the current user */
export const getGiftsSent = async () => {
  try {
    const response = await API.get('/api/app/gifts/gift-send');
    return response.data?.data ?? response.data ?? [];
  } catch (error) {
    return [];
  }
};

export default {
  getGiftsReceived,
  getGiftsSent,
};
