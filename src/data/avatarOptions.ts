const AVATAR_BASE_URL = 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/Avatar';

export const avatarMap: Record<string, { uri: string }> = {
  newuserpic: { uri: `${AVATAR_BASE_URL}/newuserPic.png` },
  avatar1: { uri: `${AVATAR_BASE_URL}/avatar1.webp` },
  avatar2: { uri: `${AVATAR_BASE_URL}/avatar2.webp` },
  avatar3: { uri: `${AVATAR_BASE_URL}/avatar3.webp` },
  avatar4: { uri: `${AVATAR_BASE_URL}/avatar4.webp` },
  avatar5: { uri: `${AVATAR_BASE_URL}/avatar5.webp` },
  maleprofile_01: { uri: `${AVATAR_BASE_URL}/Maleprofile_01.webp` },
  maleprofile_02: { uri: `${AVATAR_BASE_URL}/Maleprofile_02.webp` },
  maleprofile_03: { uri: `${AVATAR_BASE_URL}/Maleprofile_03.webp` },
  maleprofile_04: { uri: `${AVATAR_BASE_URL}/Maleprofile_04.webp` },
  maleprofile_05: { uri: `${AVATAR_BASE_URL}/Maleprofile_05.webp` },
  maleprofile_06: { uri: `${AVATAR_BASE_URL}/Maleprofile_06.webp` },
  maleprofile_07: { uri: `${AVATAR_BASE_URL}/Maleprofile_07.webp` },
  maleprofile_08: { uri: `${AVATAR_BASE_URL}/Maleprofile_08.webp` },
  maleprofile_09: { uri: `${AVATAR_BASE_URL}/Maleprofile_09.webp` },
  maleprofile_10: { uri: `${AVATAR_BASE_URL}/Maleprofile_10.webp` },
  maleprofile_11: { uri: `${AVATAR_BASE_URL}/Maleprofile_11.webp` },
  maleprofile_12: { uri: `${AVATAR_BASE_URL}/Maleprofile_12.webp` },
  maleprofile_13: { uri: `${AVATAR_BASE_URL}/Maleprofile_13.webp` },
  maleprofile_14: { uri: `${AVATAR_BASE_URL}/Maleprofile_14.webp` },
  maleprofile_15: { uri: `${AVATAR_BASE_URL}/Maleprofile_15.webp` },
  maleprofile_16: { uri: `${AVATAR_BASE_URL}/Maleprofile_16.webp` },
  profile_01: { uri: `${AVATAR_BASE_URL}/profile_01.webp` },
  profile_02: { uri: `${AVATAR_BASE_URL}/profile_02.webp` },
  profile_03: { uri: `${AVATAR_BASE_URL}/profile_03.webp` },
  profile_04: { uri: `${AVATAR_BASE_URL}/profile_04.webp` },
  profile_05: { uri: `${AVATAR_BASE_URL}/profile_05.webp` },
  profile_06: { uri: `${AVATAR_BASE_URL}/profile_06.webp` },
  profile_07: { uri: `${AVATAR_BASE_URL}/profile_07.webp` },
  profile_08: { uri: `${AVATAR_BASE_URL}/profile_08.webp` },
  profile_09: { uri: `${AVATAR_BASE_URL}/profile_09.webp` },
  profile_10: { uri: `${AVATAR_BASE_URL}/profile_10.webp` },
  profile_11: { uri: `${AVATAR_BASE_URL}/profile_11.webp` },
  profile_12: { uri: `${AVATAR_BASE_URL}/profile_12.webp` },
  profile_13: { uri: `${AVATAR_BASE_URL}/profile_13.webp` },
  profile_14: { uri: `${AVATAR_BASE_URL}/profile_14.webp` },
  profile_15: { uri: `${AVATAR_BASE_URL}/profile_15.webp` },
  profile_16: { uri: `${AVATAR_BASE_URL}/profile_16.webp` },
  profile_17: { uri: `${AVATAR_BASE_URL}/profile_17.webp` },
  profile_18: { uri: `${AVATAR_BASE_URL}/profile_18.webp` },
  profile_19: { uri: `${AVATAR_BASE_URL}/profile_19.webp` },
  profile_20: { uri: `${AVATAR_BASE_URL}/profile_20.webp` },
};

export const avatarOptions = Object.keys(avatarMap);

const GENERIC_IDS = ['newuserpic', 'avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5'];
const MALE_IDS = [...GENERIC_IDS, ...Object.keys(avatarMap).filter((id) => id.startsWith('maleprofile_'))];
const FEMALE_IDS = [...GENERIC_IDS, ...Object.keys(avatarMap).filter((id) => id.startsWith('profile_'))];

export const getAvatarOptionsForGender = (gender?: string | null): string[] => {
  const g = (gender ?? '').toLowerCase();
  if (g === 'male') return MALE_IDS;
  if (g === 'female') return FEMALE_IDS;
  return avatarOptions;
};

export const isBundledAvatarId = (value: any): boolean =>
  typeof value === 'string' && Boolean(avatarMap[value]);

const avatarIdFromUri = (uri: any): string | null => {
  if (typeof uri !== 'string' || !uri) return null;
  const match = Object.entries(avatarMap).find(([, src]) => src.uri === uri);
  return match ? match[0] : null;
};

export const resolveBundledAvatarId = (...values: any[]): string | null => {
  for (const value of values) {
    if (isBundledAvatarId(value)) return value;
    const idFromUrl = avatarIdFromUri(value);
    if (idFromUrl) return idFromUrl;
  }
  return null;
};

export const getAvatarSource = (avatarId?: string | null) =>
  avatarMap[avatarId ?? ''] ?? avatarMap.avatar1;

export const DEFAULT_AVATAR_ID = 'newuserpic';

export default {
  avatarMap,
  avatarOptions,
  getAvatarOptionsForGender,
  isBundledAvatarId,
  resolveBundledAvatarId,
  getAvatarSource,
  DEFAULT_AVATAR_ID,
};
