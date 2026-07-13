import {
  createFamily as createFamilyApi,
  getFamilies as getFamiliesApi,
  getFamilyDetail as getFamilyDetailApi,
  joinFamily as joinFamilyApi,
  addFamilyMembers as addFamilyMembersApi,
  getFamilyMessages as getFamilyMessagesApi,
  markFamilyRead as markFamilyReadApi,
} from "../api/familyApi";
import { wsService } from "./websocket";
import { getAppUserId } from "../utils/sessionUser";

const getCurrentUserIdSafe = async () => {
  try {
    return await getAppUserId();
  } catch {
    return null;
  }
};

const firstText = (...values) =>
  values.find((value) => typeof value === "string" && value.trim().length > 0) ?? null;

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value, key) => {
  const target = key && value?.[key] !== undefined ? value[key] : value;
  if (Array.isArray(target)) return target;
  return target?.content ?? target?.data ?? target?.items ?? [];
};

// A family member entry, used for the mention picker in FamilyChatModal.
const normalizeFamilyMember = (member, index = 0) => ({
  userId: firstValue(member?.userId, member?.id, member?.memberId, `member-${index}`),
  name: firstText(member?.name, member?.username, member?.displayName) ?? "Member",
  avatarUrl: firstText(member?.avatarUrl, member?.avatar, member?.profilePicUrl) ?? null,
  role: firstText(member?.role, member?.memberRole) ?? null,
});

// The family detail endpoint is the only place a member roster could come
// from — try every plausible key the backend might use. If none of these are
// arrays, there's no roster in the response (ask backend to add one) and
// this returns [].
const extractRoster = (family) => {
  const candidates = [family?.members, family?.memberList, family?.memberDetails, family?.users, family?.participants];
  const raw = candidates.find((c) => Array.isArray(c));
  return raw ? raw.map(normalizeFamilyMember) : [];
};

// Shape a raw family-group record from the backend into what FamilyContent renders.
// `owner`/`member` follow relationshipService's bare-adjective convention (following/blocked),
// falling back to comparing ownerId against the current user when the backend omits the flag.
const normalizeFamilyGroup = (family, index = 0, currentUserId = null) => {
  const ownerId = firstValue(family?.ownerId, family?.creatorId, family?.ownerUserId, family?.createdBy);
  const rawOwnerFlag = firstValue(family?.owner, family?.isOwner, family?.isCreator);
  const rawMemberFlag = firstValue(family?.member, family?.isMember, family?.joined, family?.isJoined);

  const owner =
    rawOwnerFlag != null
      ? Boolean(rawOwnerFlag)
      : Boolean(ownerId != null && currentUserId != null && String(ownerId) === String(currentUserId));
  const member = rawMemberFlag != null ? Boolean(rawMemberFlag) : owner;

  const roster = extractRoster(family);
  // `family.members` is a count on the list endpoint but the roster array itself
  // on the detail endpoint — only use it as a count when it isn't an array.
  const membersCount = firstValue(
    family?.memberCount,
    family?.totalMembers,
    Array.isArray(family?.members) ? null : family?.members,
    roster.length || null,
    0
  );

  return {
    id: firstValue(family?.id, family?.familyGroupId, family?._id, `family-${index}`),
    name: firstText(family?.name, family?.familyName) ?? "Family",
    announcement: firstText(family?.description, family?.announcement) ?? "",
    icon: firstText(family?.iconUrl, family?.icon, family?.coverUrl) ?? null,
    members: membersCount,
    level: firstValue(family?.level, family?.lv, 0),
    tag: firstText(family?.tag, family?.badge) ?? null,
    ownerId,
    owner,
    member,
    roster,
  };
};

const normalizeFamilyMessage = (message, index = 0) => ({
  id: firstValue(message?.id, message?.messageId, `family-msg-${index}`),
  senderId: firstValue(message?.senderId, message?.userId),
  senderName: firstText(message?.senderName, message?.userName),
  message: firstText(message?.message, message?.content, message?.text) ?? "",
  createdAt: firstText(message?.createdAt, message?.timestamp),
});

/** GET /api/v1/families — returns the two lists the Family screen tabs render. */
export const loadFamilyLists = async () => {
  const [data, currentUserId] = await Promise.all([getFamiliesApi(), getCurrentUserIdSafe()]);
  const existingFamilies = listFrom(data, "existingFamilies").map((f, i) =>
    normalizeFamilyGroup(f, i, currentUserId)
  );
  const newFamilies = listFrom(data, "newFamilies").map((f, i) =>
    normalizeFamilyGroup(f, i, currentUserId)
  );
  return { existingFamilies, newFamilies };
};

/**
 * POST /api/v1/families — create a family group and return it normalized for the UI.
 *
 * `coverUri` from the gallery picker is a local `file://` path. The backend
 * rejects multipart on this endpoint and `iconUrl` must be an already-hosted
 * URL, so a local file is NOT sent — there's no upload endpoint yet to turn
 * it into one. It only gets forwarded here once it's already http(s) (e.g.
 * if a future picker lets the user pick from an already-hosted gallery).
 */
export const createFamilyGroup = async ({ name, announcement, coverUri }) => {
  const iconUrl = /^https?:\/\//i.test(coverUri ?? "") ? coverUri : null;
  if (coverUri && !iconUrl) {
    console.warn(
      "[FamilyContent] Cover photo is a local file — not sent to POST /api/v1/families " +
      "(no upload endpoint exists yet; backend only accepts an already-hosted iconUrl)."
    );
  }

  const [data, currentUserId] = await Promise.all([
    createFamilyApi({ name, description: announcement, iconUrl }),
    getCurrentUserIdSafe(),
  ]);
  return normalizeFamilyGroup(data, 0, currentUserId);
};

/** GET /api/v1/families/{familyGroupId} */
export const loadFamilyDetail = async (familyGroupId) => {
  const [data, currentUserId] = await Promise.all([
    getFamilyDetailApi(familyGroupId),
    getCurrentUserIdSafe(),
  ]);
  return normalizeFamilyGroup(data, 0, currentUserId);
};

/** POST /api/v1/families/{familyGroupId}/join */
export const joinFamilyGroup = async (familyGroupId) => joinFamilyApi(familyGroupId);

/** POST /api/v1/families/{familyGroupId}/members */
export const addMembersToFamilyGroup = async (familyGroupId, userIds) =>
  addFamilyMembersApi(familyGroupId, userIds);

/** GET /api/v1/families/{familyGroupId}/messages */
export const loadFamilyMessages = async (familyGroupId) => {
  const data = await getFamilyMessagesApi(familyGroupId);
  const list = listFrom(data, "messages");
  return list.map(normalizeFamilyMessage);
};

/** POST /api/v1/families/{familyGroupId}/read */
export const markFamilyMessagesRead = async (familyGroupId) => markFamilyReadApi(familyGroupId);

/**
 * Connect the websocket, join the family topic, and load chat history —
 * mirrors partyService's enterRoomSession/exitRoomSession pairing.
 */
export const enterFamilyChatSession = async (familyGroupId) => {
  const messages = await loadFamilyMessages(familyGroupId);
  await wsService.connect();
  wsService.joinFamily(String(familyGroupId));
  return messages;
};

export const exitFamilyChatSession = (familyGroupId) => {
  if (!familyGroupId) return;
  wsService.leaveFamily(String(familyGroupId));
};
