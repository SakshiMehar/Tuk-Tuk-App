import {
  getUserSettings as apiGetUserProfile,
  patchUserSettings as apiPatchUserProfile,
} from "../api/userSettingsApi";

const UI_TO_API = {
  name: "nickname",
  about: "aboutMe",
  movies: "favoriteMoviesAndTvShows",
  language: "language",
};

const API_FIELDS_OMITTED_IN_RESPONSE = new Set(["birthday", "language"]);

const API_PROFILE_KEYS = new Set([
  "gender",
  "nickname",
  "birthday",
  "interests",
  "education",
  "school",
  "occupation",
  "aboutMe",
  "sports",
  "music",
  "favoriteMoviesAndTvShows",
  "books",
  "traveledPlaces",
  "language",
  "spokenLanguage",
  "profilePicUrl",
  "country",
  "countryCode",
  "countryName",
]);

const hasValue = (value) =>
  value !== null && value !== undefined && String(value).trim().length > 0;

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const normalizeBirthday = (value) => {
  if (!hasValue(value)) return value;
  const trimmed = String(value).trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
};

const unwrapProfile = (data) =>
  data?.profile ?? data?.settings ?? data?.data ?? data ?? {};

export const parseUserProfile = (data) => {
  const raw = unwrapProfile(data);

  return {
    id: raw.id ?? null,
    displayName: raw.name ?? "",
    profilePicUrl: raw.profilePicUrl ?? null,
    name: raw.nickname ?? "",
    gender: raw.gender ?? "",
    country: firstText(raw.country, raw.countryName) ?? "",
    countryCode: raw.countryCode ?? "",
    countryName: firstText(raw.countryName, raw.country) ?? "",
    birthday: hasValue(raw.birthday) ? String(raw.birthday) : "",
    interests: raw.interests ?? "",
    education: raw.education ?? "",
    school: raw.school ?? "",
    occupation: raw.occupation ?? "",
    language: hasValue(raw.language)
      ? String(raw.language)
      : hasValue(raw.spokenLanguage)
        ? String(raw.spokenLanguage)
        : "",
    about: raw.aboutMe ?? "",
    sports: raw.sports ?? "",
    music: raw.music ?? "",
    movies: raw.favoriteMoviesAndTvShows ?? "",
    books: raw.books ?? "",
    traveledPlaces: raw.traveledPlaces ?? "",
  };
};

export const buildProfilePatchPayload = (updates = {}) => {
  const payload = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined) return;

    const apiKey = UI_TO_API[key] ?? key;
    if (!API_PROFILE_KEYS.has(apiKey)) return;

    const normalizedValue =
      apiKey === "birthday" && typeof value === "string"
        ? normalizeBirthday(value)
        : typeof value === "string"
          ? value.trim()
          : value;
    payload[apiKey] = normalizedValue;
  });

  if (updates.language !== undefined) {
    const languageValue =
      typeof updates.language === "string"
        ? updates.language.trim()
        : updates.language;
    payload.language = languageValue;
    payload.spokenLanguage = languageValue;
  }

  if (updates.country !== undefined && !payload.countryName) {
    const countryName =
      typeof updates.country === "string" ? updates.country.trim() : updates.country;
    if (countryName) payload.countryName = countryName;
  }
  if (updates.countryName !== undefined && !payload.country) {
    const country =
      typeof updates.countryName === "string"
        ? updates.countryName.trim()
        : updates.countryName;
    if (country) payload.country = country;
  }

  return payload;
};

export const mergeProfileState = (previous = {}, apiParsed = {}, localUpdates = {}) => {
  const merged = {
    ...previous,
    ...apiParsed,
    ...localUpdates,
  };

  API_FIELDS_OMITTED_IN_RESPONSE.forEach((key) => {
    const apiValue = apiParsed[key];
    const localValue = localUpdates[key];
    const previousValue = previous[key];

    if (hasValue(localValue)) {
      merged[key] = localValue;
      return;
    }

    if (!hasValue(apiValue) && hasValue(previousValue)) {
      merged[key] = previousValue;
    }
  });

  return merged;
};

export const loadUserProfile = async () => {
  const data = await apiGetUserProfile();
  const parsed = parseUserProfile(data);
  
  return parsed;
};

export const updateUserProfile = async (updates = {}) => {
  const payload = buildProfilePatchPayload(updates);
  if (!Object.keys(payload).length) {
    
    return null;
  }

  const data = await apiPatchUserProfile(payload);
  const parsed = parseUserProfile(data);
  
  return parsed;
};
