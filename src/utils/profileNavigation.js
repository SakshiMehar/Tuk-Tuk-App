import { getUser } from "../store/authStore";

export const buildUserProfileParams = (user) => {
  const params = { userId: String(user?.userId ?? user?.id ?? "") };
  const name = user?.name ?? user?.displayName;
  if (name) params.name = String(name);
  const avatar =
    user?.avatar ??
    user?.avatarUrl ??
    user?.profilePicUrl ??
    user?.profileImageUrl ??
    user?.profileImage;
  if (avatar) params.avatar = String(avatar);
  return params;
};

/** Opens the tapped user's profile — redirects to the signed-in user's own
 *  Mine tab instead of the read-only screen when they tap their own picture. */
export const openUserProfile = async (router, user) => {
  const userId = String(user?.userId ?? user?.id ?? "");
  if (!userId) return false;

  const me = await getUser();
  const myId = String(me?.userId ?? me?.id ?? "");
  if (myId && myId === userId) {
    router.push("/(tabs)/profile");
    return true;
  }

  router.push({
    pathname: "/user-profile",
    params: buildUserProfileParams({ ...user, userId }),
  });
  return true;
};
