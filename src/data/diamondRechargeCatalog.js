export const formatInr = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN")}`;

export const formatDiamonds = (amount) =>
  `${Number(amount).toLocaleString("en-IN")} Diamonds`;
