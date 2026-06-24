import { getUser } from "../store/authStore";
import { patchMyProfile } from "../api/profileApi";
import { loadMyProfile } from "./meProfileService";
import { loadUserProfile, updateUserProfile } from "./userProfileService";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

/** Resolve the user's country name from local session, settings, or me/profile. */
export const resolveUserCountryName = async () => {
  const user = await getUser();
  const fromSession = firstText(user?.country, user?.countryName);
  if (fromSession) return fromSession;

  try {
    const settingsProfile = await loadUserProfile();
    const fromSettings = firstText(settingsProfile?.country, settingsProfile?.countryName);
    if (fromSettings) return fromSettings;
  } catch {
    // fall through
  }

  try {
    const meProfile = await loadMyProfile();
    const fromMe = firstText(meProfile?.country, meProfile?.countryName);
    if (fromMe) return fromMe;
  } catch {
    // fall through
  }

  return null;
};

/** Persist country on both settings and me/profile so recharge APIs can read it. */
export const syncUserCountryToServer = async ({ country, countryCode } = {}) => {
  const countryName = String(country ?? "").trim();
  if (!countryName) return;

  const payload = {
    country: countryName,
    countryName,
    ...(countryCode ? { countryCode: String(countryCode).trim() } : {}),
  };

  await Promise.allSettled([
    updateUserProfile(payload),
    patchMyProfile(payload),
  ]);
};
