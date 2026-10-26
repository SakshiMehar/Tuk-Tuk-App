import { DeviceEventEmitter } from "react-native";
import { useEffect, useState } from "react";
import { getMyCountry, patchMyCountry, patchMyProfile } from "../api/profileApi";
import {
  findCountryByIsoCode,
  findCountryByName,
  isoCodeFromFlag,
} from "../data/countryOptions";
import { getUser, updateUser } from "../store/authStore";
import { loadMyProfile } from "./meProfileService";
import { loadUserProfile, updateUserProfile } from "./userProfileService";

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const ISO_CODE_RE = /^[A-Z]{2}$/;

/** Only trust a countryCode value if it's actually an ISO alpha-2 code —
 *  several older call sites pass the dial code (e.g. "+91") under this same
 *  field name, so anything that isn't 2 letters is discarded and re-derived
 *  from the country name's flag emoji instead. */
const resolveIsoCode = (countryName, maybeIsoCode) => {
  const candidate = maybeIsoCode ? String(maybeIsoCode).trim().toUpperCase() : null;
  if (candidate && ISO_CODE_RE.test(candidate)) return candidate;
  return isoCodeFromFlag(findCountryByName(countryName)?.flag);
};

/** Resolve a flag emoji for any user-like object holding country fields
 *  (session user, GET /me/country response, event payload, ...). */
export const resolveCountryFlag = (user) => {
  if (!user) return null;
  const byCode = findCountryByIsoCode(user.countryCode);
  if (byCode) return byCode.flag;
  const name = firstText(user.countryName, user.country);
  const byName = name ? findCountryByName(name) : null;
  return byName?.flag ?? null;
};

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

/** GET /api/app/users/me/country — the source of truth for the signed-in
 *  user's country. Caches the result onto the local session user (so every
 *  screen reading getUser() picks it up) and returns a ready-to-render flag. */
export const fetchMyCountry = async () => {
  const data = await getMyCountry();
  const countryName = firstText(data?.countryName, data?.country, data?.data?.countryName, data?.data?.country);
  const rawCountryCode = firstText(data?.countryCode, data?.data?.countryCode);
  if (!countryName && !rawCountryCode) return null;

  const countryCode = resolveIsoCode(countryName, rawCountryCode);
  const flag = resolveCountryFlag({ countryName, countryCode });

  await updateUser({ country: countryName, countryName, countryCode });

  return { countryName, countryCode, flag };
};

/** Persist the signed-in user's country via PATCH /api/app/users/me/country
 *  (Authorization: Bearer <token> is attached automatically, same as every
 *  other authed call in this app — see authRequestConfig / the axios request
 *  interceptor). Also mirrors onto the older settings/me-profile endpoints so
 *  screens still reading those keep working, and broadcasts the change so
 *  every flag shown for "me" (Party tab, Profile, voice room) updates live. */
export const syncUserCountryToServer = async ({ country, countryCode } = {}) => {
  const countryName = String(country ?? "").trim();
  if (!countryName) return null;

  const isoCode = resolveIsoCode(countryName, countryCode);

  await patchMyCountry({ countryName, countryCode: isoCode });

  await updateUser({ country: countryName, countryName, countryCode: isoCode });

  await Promise.allSettled([
    updateUserProfile({ country: countryName, countryName, countryCode: isoCode }),
    patchMyProfile({ country: countryName, countryName, countryCode: isoCode }),
  ]);

  DeviceEventEmitter.emit("userCountryUpdated", { countryName, countryCode: isoCode });

  return { countryName, countryCode: isoCode };
};

/** Live country-flag hook for the current signed-in user. Seeds instantly
 *  from the cached session user, refreshes from GET /me/country in the
 *  background, and updates immediately whenever the country changes
 *  anywhere in the app (the "Who are you?" picker, Account screen, ...). */
export const useMyCountryFlag = () => {
  const [flag, setFlag] = useState(null);

  useEffect(() => {
    let cancelled = false;

    getUser()
      .then((user) => {
        if (cancelled) return;
        const cachedFlag = resolveCountryFlag(user);
        if (cachedFlag) setFlag(cachedFlag);
      })
      .catch(() => {});

    fetchMyCountry()
      .then((result) => {
        if (!cancelled && result?.flag) setFlag(result.flag);
      })
      .catch(() => {});

    const sub = DeviceEventEmitter.addListener(
      "userCountryUpdated",
      (payload = {}) => {
        if (cancelled) return;
        const nextFlag = resolveCountryFlag(payload);
        if (nextFlag) setFlag(nextFlag);
      },
    );

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  return flag;
};
