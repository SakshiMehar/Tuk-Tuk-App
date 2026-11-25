export const VIP_XP_THRESHOLD = 1000;

export const VIP_TIER1_FALLBACK_ASSETS = {
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipProfileFrame1.png',
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipEntryFrame1.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/VipChatFrame1.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip1/viplogo1.png',
};

export const VIP_TIER2_ASSETS = {
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipProfileFrame2.png',
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipEntryFrame2.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/VipChatFrame2.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip2/viplogo2.png',
};

export const VIP_TIER3_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipEntryFrame3.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/viplogo3.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipProfileFrame3.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip3/VipChatFrame3.png',
};

export const VIP_TIER4_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipEntryFrame4.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/viplogo4.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipProfileFrame4.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip4/VipChatFrame4.png',
};

export const VIP_TIER5_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipEntryFrame5.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/viplogo5.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipProfileFrame5.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip5/VipChatFrame5.png',
};

export const VIP_TIER6_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipEntryFrame6.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/viplogo6.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipProfileFrame6.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip6/VipChatFrame6.png',
};

export const VIP_TIER7_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipEntryFrame7.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/viplogo7.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipProfileFrame7.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip7/VipChatFrame7.png',
};

export const VIP_TIER8_ASSETS = {
  entryFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipEntryFrame8.png',
  logo: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/Viplogo8.png',
  profileFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipProfileFrame8.png',
  chatFrame: 'https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/vip-frame/vip8/VipChatFrame8.png',
};

export const VIP_TIER_THRESHOLDS = [
  { tier: 1, exp: VIP_XP_THRESHOLD, assets: VIP_TIER1_FALLBACK_ASSETS },
  { tier: 2, exp: 3000, assets: VIP_TIER2_ASSETS },
  { tier: 3, exp: 8000, assets: VIP_TIER3_ASSETS },
  { tier: 4, exp: 20000, assets: VIP_TIER4_ASSETS },
  { tier: 5, exp: 50000, assets: VIP_TIER5_ASSETS },
  { tier: 6, exp: 120000, assets: VIP_TIER6_ASSETS },
  { tier: 7, exp: 300000, assets: VIP_TIER7_ASSETS },
  { tier: 8, exp: 700000, assets: VIP_TIER8_ASSETS },
];

export const resolveVipTierFromAssetUrl = (url: string | null | undefined): number | null => {
  const match = typeof url === 'string' ? url.match(/\/vip-frame\/vip(\d+)\//i) : null;
  return match ? Number(match[1]) : null;
};

export const resolveVipTierForXp = (xp: number) => {
  let current: (typeof VIP_TIER_THRESHOLDS)[number] | null = null;
  for (const entry of VIP_TIER_THRESHOLDS) {
    if (xp >= entry.exp) current = entry;
    else break;
  }
  return current;
};

export const VIP_PROFILE_FRAME_LAYOUT = {
  frameScale: 1.2,
  frameResizeMode: 'contain' as const,
  frameOffsetX: 0,
  frameOffsetY: 0,
  frameBleed: 0,
  avatarBoost: 0.92,
  avatarOffsetY: 0,
  innerRingRatio: 0.82,
};
