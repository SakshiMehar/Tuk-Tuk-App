import { resolveVipTierForXp, VIP_TIER_THRESHOLDS } from '../constants/vip';

export interface VipAssets {
  unlocked: boolean;
  profileFrame: string | null;
  entryFrame: string | null;
  chatFrame: string | null;
  logo: string | null;
}

export const loadMyVipAssets = async (xp: number = 0): Promise<VipAssets> => {
  const tier = resolveVipTierForXp(xp);
  if (!tier) {
    return {
      unlocked: false,
      profileFrame: null,
      entryFrame: null,
      chatFrame: null,
      logo: null,
    };
  }

  return {
    unlocked: true,
    profileFrame: tier.assets.profileFrame,
    entryFrame: tier.assets.entryFrame,
    chatFrame: tier.assets.chatFrame,
    logo: tier.assets.logo,
  };
};

export default {
  loadMyVipAssets,
};
