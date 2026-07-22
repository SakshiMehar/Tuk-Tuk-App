import API from "./axios";

/** GET /api/app/gamification/me — current user's gamification profile: level, total XP,
 *  current/next level XP thresholds, daily XP cap, room time, gifts sent, equipped
 *  badge/frame, and inventory. Auth is attached automatically by the axios interceptor. */
export const getGamificationMe = async () => {
  const response = await API.get("/api/app/gamification/me");
  console.log("[gamificationApi] GET /api/app/gamification/me -> RAW", JSON.stringify(response.data, null, 2));
  return response.data;
};
