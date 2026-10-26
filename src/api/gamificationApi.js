import API from "./axios";

/** GET /api/app/gamification/me — current user's gamification profile: level, total XP,
 *  current/next level XP thresholds, daily XP cap, room time, gifts sent, equipped
 *  badge/frame, and inventory. Auth is attached automatically by the axios interceptor. */
export const getGamificationMe = async () => {
  const response = await API.get("/api/app/gamification/me");
  return response.data;
};

/** GET /api/app/gamification/me/level — dedicated current-level lookup (lighter
 *  payload than the full /me profile). Auth is attached automatically by the
 *  axios interceptor. */
export const getGamificationMeLevel = async () => {
  const response = await API.get("/api/app/gamification/me/level");
  return response.data;
};
