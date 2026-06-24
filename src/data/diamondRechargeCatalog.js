/** Offline diamond recharge catalog — all payments in INR. */
export const DIAMOND_RECHARGE_PACKAGES = [
  { id: "inr-100", inr: 100, diamonds: 6000 },
  { id: "inr-470", inr: 470, diamonds: 50000 },
  { id: "inr-940", inr: 940, diamonds: 80000 },
  { id: "inr-2800", inr: 2800, diamonds: 200000 },
  { id: "inr-9400", inr: 9400, diamonds: 1000000 },
  { id: "inr-18600", inr: 18600, diamonds: 1500000 },
  { id: "inr-50000", inr: 50000, diamonds: 5000000 },
];

export const formatInr = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

export const formatDiamonds = (amount) =>
  `${Number(amount).toLocaleString("en-IN")} Diamonds`;
