/** Static named diamond package tiers shown on the Wallet recharge screen.
 *  `exp` is the bonus VIP EXP earned on that recharge (counts toward the
 *  VIP_XP_THRESHOLD gate — see src/constants/vip.js). */
export const DIAMOND_PACKAGE_TIERS = [
  { id: "starter", name: "Starter", diamonds: 100, inr: 99, exp: 6 },
  { id: "basic", name: "Basic", diamonds: 250, inr: 199, exp: 12 },
  { id: "silver", name: "Silver", diamonds: 500, inr: 399, exp: 24 },
  { id: "gold", name: "Gold", diamonds: 1000, inr: 799, exp: 48, popular: true },
  { id: "platinum", name: "Platinum", diamonds: 2500, inr: 1899, exp: 114 },
  { id: "diamond-plus", name: "Diamond Plus", diamonds: 5000, inr: 3699, exp: 222 },
  { id: "premium", name: "Premium", diamonds: 10000, inr: 7199, exp: 432 },
  { id: "vip", name: "VIP", diamonds: 25000, inr: 17499, exp: 1050 },
  { id: "royal", name: "Royal", diamonds: 50000, inr: 34999, exp: 2100 },
  { id: "ultimate", name: "Ultimate", diamonds: 100000, inr: 69999, exp: 4200 },
];
