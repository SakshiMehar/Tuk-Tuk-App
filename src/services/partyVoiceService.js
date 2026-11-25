let activeRoomId = null;

export const getActiveRoomId = () => activeRoomId;
export const setActiveRoomId = (roomId) => {
  activeRoomId = roomId ? String(roomId) : null;
};

export default {
  getActiveRoomId,
  setActiveRoomId,
};
