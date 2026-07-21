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
  id: m?.id ?? `${m?.amount ?? 0}-${m?.description ?? ""}`,
  amount: Number(m?.amount ?? m?.rewardDiamonds ?? 0),
  description: m?.description ?? m?.label ?? "",
});

const normalizeTier = (tier, index = 0) => ({
  id: tier?.id ?? `tier-${index}`,
  title: tier?.title ?? tier?.label ?? "",
  totalReward: Number(tier?.totalReward ?? tier?.totalRewardDiamonds ?? 0),
  milestones: Array.isArray(tier?.milestones) ? tier.milestones.map(normalizeMilestone) : [],
});

const normalizeRule = (rule, index = 0) => ({
  id: rule?.id ?? `rule-${index}`,
  text: rule?.text ?? rule?.title ?? "",
  detail: rule?.detail ?? rule?.description ?? "",
});

const normalizeConfig = (data) => ({
  rules: Array.isArray(data?.rules) ? data.rules.map(normalizeRule) : [],
  tiers: Array.isArray(data?.tiers) ? data.tiers.map(normalizeTier) : [],
});

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
