/** Local profile avatars — add new files under assets/Avatar and register here. */
export const avatarMap = {
  avatar1: require("../../assets/Avatar/avatar1.webp"),
  avatar2: require("../../assets/Avatar/avatar2.webp"),
  avatar3: require("../../assets/Avatar/avatar3.webp"),
  avatar4: require("../../assets/Avatar/avatar4.webp"),
  avatar5: require("../../assets/Avatar/avatar5.webp"),
  maleprofile_01: require("../../assets/Avatar/Maleprofile_01.webp"),
  maleprofile_02: require("../../assets/Avatar/Maleprofile_02.webp"),
  maleprofile_03: require("../../assets/Avatar/Maleprofile_03.webp"),
  maleprofile_04: require("../../assets/Avatar/Maleprofile_04.webp"),
  maleprofile_05: require("../../assets/Avatar/Maleprofile_05.webp"),
  maleprofile_06: require("../../assets/Avatar/Maleprofile_06.webp"),
  maleprofile_07: require("../../assets/Avatar/Maleprofile_07.webp"),
  maleprofile_08: require("../../assets/Avatar/Maleprofile_08.webp"),
  maleprofile_09: require("../../assets/Avatar/Maleprofile_09.webp"),
  maleprofile_10: require("../../assets/Avatar/Maleprofile_10.webp"),
  maleprofile_11: require("../../assets/Avatar/Maleprofile_11.webp"),
  maleprofile_12: require("../../assets/Avatar/Maleprofile_12.webp"),
  maleprofile_13: require("../../assets/Avatar/Maleprofile_13.webp"),
  maleprofile_14: require("../../assets/Avatar/Maleprofile_14.webp"),
  maleprofile_15: require("../../assets/Avatar/Maleprofile_15.webp"),
  maleprofile_16: require("../../assets/Avatar/Maleprofile_16.webp"),
  profile_01: require("../../assets/Avatar/profile_01.webp"),
  profile_02: require("../../assets/Avatar/profile_02.webp"),
  profile_03: require("../../assets/Avatar/profile_03.webp"),
  profile_04: require("../../assets/Avatar/profile_04.webp"),
  profile_05: require("../../assets/Avatar/profile_05.webp"),
  profile_06: require("../../assets/Avatar/profile_06.webp"),
  profile_07: require("../../assets/Avatar/profile_07.webp"),
  profile_08: require("../../assets/Avatar/profile_08.webp"),
  profile_09: require("../../assets/Avatar/profile_09.webp"),
  profile_10: require("../../assets/Avatar/profile_10.webp"),
  profile_11: require("../../assets/Avatar/profile_11.webp"),
  profile_12: require("../../assets/Avatar/profile_12.webp"),
  profile_13: require("../../assets/Avatar/profile_13.webp"),
  profile_14: require("../../assets/Avatar/profile_14.webp"),
  profile_15: require("../../assets/Avatar/profile_15.webp"),
  profile_16: require("../../assets/Avatar/profile_16.webp"),
  profile_17: require("../../assets/Avatar/profile_17.webp"),
  profile_18: require("../../assets/Avatar/profile_18.webp"),
  profile_19: require("../../assets/Avatar/profile_19.webp"),
  profile_20: require("../../assets/Avatar/profile_20.webp"),
};

export const avatarOptions = Object.keys(avatarMap);

export const getAvatarSource = (avatarId) =>
  avatarMap[avatarId] ?? avatarMap.avatar1;

export const DEFAULT_AVATAR_ID = "avatar1";
