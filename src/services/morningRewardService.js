import API from "../api/axios";

/**
 * Fetch morning login reward status from the backend.
 *
 * Expected API response:
 * {
 *   "eligible": boolean,
 *   "alreadyClaimed": boolean,
 *   "rewardWindowOpen": boolean,
 *   "minDiamonds": number,
 *   "maxDiamonds": number,
 *   "rewardDate": string,
 *   "message": string
 * }
 */
export const getMorningRewardStatus = async () => {
  try {
    const res = await API.get("/api/morning-login-reward/status");
    return res?.data ?? null;
  } catch (err) {
    console.warn("[MorningReward] status check error:", err?.response?.data || err?.message || err);
    throw err;
  }
};

/**
 * Claim the morning login reward.
 *
 * Expected API response:
 * {
 *   "success": boolean,
 *   "message": string,
 *   "diamondsAwarded": number,
 *   "rewardDate": string,
 *   "alreadyClaimed": boolean,
 *   "eligible": boolean
 * }
 */
export const claimMorningReward = async () => {
  try {
    const res = await API.post("/api/morning-login-reward/claim");
    return res?.data ?? null;
  } catch (err) {
    console.warn("[MorningReward] claim error:", err?.response?.data || err?.message || err);
    throw err;
  }
};

export default {
  getMorningRewardStatus,
  claimMorningReward,
};
