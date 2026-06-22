import { getWalletMe, getWalletTransactions } from "../api/walletApi";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const listFrom = (value) => {
  if (Array.isArray(value)) return value;
  return value?.content ?? value?.data ?? value?.items ?? value?.transactions ?? [];
};

const formatTxnDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (isToday) return "Today";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const normalizeTransaction = (txn) => {
  const diamondsDelta = Number(
    firstValue(
      txn?.diamondsDelta,
      txn?.diamondDelta,
      txn?.diamondsAmount,
      txn?.diamondAmount,
      txn?.diamonds
    ) ?? 0
  );
  const coinsDelta = Number(
    firstValue(txn?.coinsDelta, txn?.coinsAmount, txn?.coinAmount, txn?.coins) ?? 0
  );
  const genericAmount = Number(firstValue(txn?.amount, txn?.value) ?? 0);
  const currency = String(
    firstValue(txn?.currency, txn?.assetType, txn?.type) ?? ""
  ).toLowerCase();

  let amountText = "";
  let color = "#cbd5e1";

  if (diamondsDelta !== 0) {
    amountText = `${diamondsDelta > 0 ? "+" : ""}${diamondsDelta}💎`;
    color = diamondsDelta > 0 ? "#4ade80" : "#f87171";
  } else if (coinsDelta !== 0) {
    amountText = `${coinsDelta > 0 ? "+" : ""}${coinsDelta}🪙`;
    color = coinsDelta > 0 ? "#4ade80" : "#f87171";
  } else if (genericAmount !== 0) {
    const suffix = currency.includes("coin") ? "🪙" : "💎";
    amountText = `${genericAmount > 0 ? "+" : ""}${genericAmount}${suffix}`;
    color = genericAmount > 0 ? "#4ade80" : "#f87171";
  } else {
    amountText = "0";
  }

  return {
    id: firstValue(txn?.id, txn?.transactionId, txn?._id) ?? `${txn?.createdAt ?? "txn"}-${amountText}`,
    label:
      firstValue(
        txn?.description,
        txn?.label,
        txn?.title,
        txn?.reason,
        txn?.transactionType,
        txn?.type
      ) ?? "Transaction",
    amount: amountText,
    date: formatTxnDate(firstValue(txn?.createdAt, txn?.timestamp, txn?.date)),
    color,
  };
};

export const parseWalletBalance = (data) => ({
  diamonds: Number(firstValue(data?.diamondsBalance, data?.diamonds, data?.diamondBalance) ?? 0),
  coins: Number(firstValue(data?.coinsBalance, data?.coins, data?.coinBalance) ?? 0),
  updatedAt: firstValue(data?.updatedAt, data?.lastUpdated) ?? null,
});

export const loadWalletData = async ({ page = 0, size = 20 } = {}) => {
  const [balanceData, transactionsData] = await Promise.all([
    getWalletMe(),
    getWalletTransactions(page, size),
  ]);

  const balance = parseWalletBalance(balanceData);
  const transactions = listFrom(transactionsData).map(normalizeTransaction);

  

  return {
    balance,
    transactions,
    hasMore: transactionsData?.last === false || transactionsData?.hasMore === true,
    totalElements: transactionsData?.totalElements ?? transactions.length,
  };
};
