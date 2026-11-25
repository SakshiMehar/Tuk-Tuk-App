import { getSavedUsers, removeUserFromServer } from '../api/userApi';

export const fetchSavedUsersFromServer = async (): Promise<any[]> => {
  try {
    const data = await getSavedUsers();
    const list = Array.isArray(data) ? data : data?.users ?? data?.content ?? [];
    return list.map((user: any) => ({
      userId: String(user.userId ?? user.id ?? ''),
      name: user.name ?? user.displayName ?? 'User',
      avatarUrl: user.avatarUrl ?? user.avatar ?? user.profilePicUrl ?? null,
      vipProfileFrameUrl: user.vipProfileFrameUrl ?? null,
      occupation: user.occupation ?? null,
      isOnline: Boolean(user.isOnline ?? user.online),
    }));
  } catch {
    return [];
  }
};

export const removeFavoriteUser = async (userId: string | number) => {
  return removeUserFromServer(userId);
};

export default {
  fetchSavedUsersFromServer,
  removeFavoriteUser,
};
