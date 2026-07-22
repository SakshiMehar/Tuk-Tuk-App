import {
  getInviteFriendsMe,
  getInviteFriendsConfig,
  getInviteFriendsActivity,
  getInviteFriendsRecord,
  shareInviteFriends,
  withdrawInviteFriendsDiamonds,
  redeemInviteFriendsCode,
} from "../api/inviteFriendsApi";

const normalizeSummary = (data) => {
  const task = data?.limitedTimeTaskProgress ?? data?.limitedTask;
  return {
    inviteCode: String(data?.inviteCode ?? data?.code ?? ""),
    inviteLink: data?.applicationDownloadLink ?? data?.inviteLink ?? data?.link ?? null,
    successfulInvitations: Number(
      data?.successfulInvitationCount ?? data?.successfulInvitations ?? data?.invitationCount ?? 0
    ),
    rewardsReceived: Number(data?.rewardsReceived ?? data?.totalRewardDiamonds ?? 0),
    unclaimedEarnings: Number(data?.unclaimedEarnings ?? data?.unclaimedDiamonds ?? 0),
    limitedTask: task
      ? {
          id: task.id ?? task.taskType ?? "share-invite",
          label: task.label ?? task.title ?? "",
          progressCount: Number(task.progressCount ?? task.progress ?? 0),
          targetCount: Number(task.targetCount ?? task.target ?? 1),
          durationLabel: task.durationLabel ?? null,
          completed: Boolean(task.completed),
        }
      : null,
  };
};

const normalizeMilestone = (m) => ({
  id: m?.key ?? m?.id ?? `${m?.rewardDiamonds ?? 0}-${m?.description ?? ""}`,
  amount: Number(m?.rewardDiamonds ?? m?.amount ?? m?.diamonds ?? m?.reward ?? 0),
  description: m?.description ?? m?.title ?? m?.label ?? m?.text ?? "",
});

const milestonesFromTier = (tier) => {
  const list = tier?.milestones ?? tier?.milestoneList ?? tier?.rewards ?? tier?.steps ?? [];
  return Array.isArray(list) ? list.map(normalizeMilestone) : [];
};

const normalizeTier = (tier, index = 0) => {
  const milestones = milestonesFromTier(tier);
  // The real payload doesn't send a pre-summed total — the tier's "44,500💎 every
  // month" style total is just its milestones added together.
  const totalReward = Number(
    tier?.totalReward ?? tier?.totalRewardDiamonds ?? tier?.totalDiamonds ?? tier?.total ??
    milestones.reduce((sum, m) => sum + m.amount, 0)
  );
  return {
    id: tier?.key ?? tier?.id ?? tier?.tierId ?? `tier-${index}`,
    title: tier?.title ?? tier?.label ?? tier?.name ?? tier?.tierName ?? "",
    totalReward,
    milestones,
  };
};

const normalizeRule = (rule, index = 0) => ({
  id: rule?.id ?? `rule-${index}`,
  text: rule?.text ?? rule?.title ?? "",
  detail: rule?.detail ?? rule?.description ?? "",
});

// The /config payload may arrive wrapped (`{ data: {...} }`, `{ result: {...} }`, etc.)
// and the tier ladder may be keyed as `tiers`, `rewardTierLadder`, `rewardTiers`,
// `tierLadder`, or `cards` — unwrap defensively rather than assuming one exact shape.
const unwrapConfigRoot = (data) => data?.data ?? data?.result ?? data?.config ?? data ?? {};

const tiersFromConfigRoot = (root) => {
  const list =
    root?.tiers ?? root?.rewardTierLadder ?? root?.rewardTiers ?? root?.tierLadder ?? root?.cards ?? [];
  return Array.isArray(list) ? list : [];
};

const normalizeConfig = (data) => {
  const root = unwrapConfigRoot(data);
  return {
    rules: Array.isArray(root?.rules) ? root.rules.map(normalizeRule) : [],
    tiers: tiersFromConfigRoot(root).map(normalizeTier),
  };
};

const normalizeActivityItem = (item, index = 0) => ({
  id: item?.id ?? `activity-${index}`,
  maskedName: item?.maskedName ?? item?.name ?? "",
  diamonds: Number(item?.diamonds ?? item?.rewardDiamonds ?? 0),
});

const normalizeRecordEntry = (entry, index = 0) => ({
  id: entry?.id ?? `record-${index}`,
  name: entry?.name ?? entry?.username ?? "",
  avatarUrl: entry?.avatarUrl ?? entry?.profileImageUrl ?? null,
  diamonds: Number(entry?.diamonds ?? entry?.rewardDiamonds ?? 0),
  status: entry?.status ?? null,
  createdAt: entry?.createdAt ?? entry?.timestamp ?? null,
});

/** GET invite-friends summary — invite code, personal stats, limited-time task. */
export const loadInviteFriendsSummary = async () => {
  const data = await getInviteFriendsMe();
  return normalizeSummary(data);
};

/** GET invite-friends config — rules copy + reward tier ladder. */
export const loadInviteFriendsConfig = async () => {
  const data = await getInviteFriendsConfig();
  return normalizeConfig(data);
};

/** GET invite-friends activity — public ticker feed. */
export const loadInviteFriendsActivity = async () => {
  const data = await getInviteFriendsActivity();
  const items = Array.isArray(data) ? data : data?.items ?? [];
  return items.map(normalizeActivityItem);
};

/** GET invite-friends record — invited friends / rewards / unclaimed list for the given tab. */
export const loadInviteFriendsRecord = async (tab = "friends", page = 0, size = 20) => {
  const data = await getInviteFriendsRecord(tab, page, size);
  const items = Array.isArray(data) ? data : data?.items ?? [];
  return {
    items: items.map(normalizeRecordEntry),
    hasMore: Boolean(data?.hasMore ?? items.length >= size),
  };
};

/** POST invite-friends share — logs a share action, returns updated limited-time task progress. */
export const shareInviteFriendsActivity = async () => {
  const data = await shareInviteFriends();
  return normalizeSummary(data);
};

/** POST invite-friends withdraw — moves unclaimed earnings into the wallet diamond balance. */
export const withdrawInviteFriendsEarnings = async () => {
  const data = await withdrawInviteFriendsDiamonds();
  return normalizeSummary(data);
};

/** POST invite-friends redeem — applies an invite code entered at login, right after the
 *  new JWT is issued. */
export const redeemInviteCode = async (inviteCode) => {
  const data = await redeemInviteFriendsCode(inviteCode);
  return data;
};
