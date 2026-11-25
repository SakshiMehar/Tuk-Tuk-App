import API, { authRequestConfig } from './axios';

export const getFamilies = async () => {
  const response = await API.get('/api/v1/families', await authRequestConfig());
  return response.data;
};

export const getFamilyDetail = async (familyGroupId: string | number) => {
  const response = await API.get(`/api/v1/families/${familyGroupId}`, await authRequestConfig());
  return response.data;
};

export const joinFamily = async (familyGroupId: string | number) => {
  const response = await API.post(`/api/v1/families/${familyGroupId}/join`, {}, await authRequestConfig());
  return response.data;
};

export const createFamily = async (body: any) => {
  const response = await API.post('/api/v1/families', body, await authRequestConfig());
  return response.data;
};

export default {
  getFamilies,
  getFamilyDetail,
  joinFamily,
  createFamily,
};
