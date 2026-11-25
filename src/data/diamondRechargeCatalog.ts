export const formatInr = (amount: number | string): string =>
  `₹${Number(amount).toLocaleString('en-IN')}`;

export const formatDiamonds = (amount: number | string): string =>
  `${Number(amount).toLocaleString('en-IN')} Diamonds`;

export default { formatInr, formatDiamonds };
