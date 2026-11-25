import { getUser, updateUser } from '../store/authStore';
import {
  DEFAULT_USER_LEVEL,
  normalizeUserLevel,
  resolveLocalLevelBadge,
} from '../utils/levelBadge';

export const syncUserLevelForSession = async () => {
  const user = await getUser();
  const level = normalizeUserLevel(user?.level, DEFAULT_USER_LEVEL);
  const badgeSource = resolveLocalLevelBadge(level);

  return {
    level,
    badgeSource,
    xp: { totalXp: (level - 1) * 1000 + 500 },
  };
};

export default {
  syncUserLevelForSession,
};
