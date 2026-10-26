import API, { authRequestConfig } from "./axios";

export const startCall = async (receiverId) => {
    const response = await API.post("/api/app/calls", { receiverId }, await authRequestConfig());
    return response.data;
};

export const acceptCall = async (callId) => {
    const response = await API.post(`/api/app/calls/${callId}/accept`, {}, await authRequestConfig());
    return response.data;
};

export const rejectCall = async (callId) => {
    const response = await API.post(`/api/app/calls/${callId}/reject`, {}, await authRequestConfig());
    return response.data;
};

export const getAgoraToken = async (callId) => {
    const response = await API.post(`/api/app/calls/${callId}/agora-token`, {}, await authRequestConfig());
    return response.data;
};

export const endCall = async (callId) => {
    const response = await API.post(`/api/app/calls/${callId}/end`, {}, await authRequestConfig());
    return response.data;
};

export const getCallHistory = async () => {
    const response = await API.get("/api/app/calls/history", await authRequestConfig());
    return response.data;
};
