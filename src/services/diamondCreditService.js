import { getMyDiamondCreditRequests } from "../api/userApi";

const firstNumber = (...values) => {
  for (const value of values) {
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return null;
};

const listFrom = (data) => {
  if (Array.isArray(data)) return data;
  const root = data?.data ?? data ?? {};
  if (Array.isArray(root)) return root;
  return root.content ?? root.requests ?? root.items ?? root.credits ?? [];
};

export const parseDiamondBalance = (data) => {
  const root = data?.data ?? data ?? {};

  const direct = firstNumber(
    root.diamonds,
    root.diamondBalance,
    root.balance,
    root.totalDiamonds,
    root.availableDiamonds,
    root.creditBalance,
    root.amount,
    root.totalAmount,
    data?.diamonds,
    data?.balance
  );
  if (direct != null) return direct;

  const list = listFrom(data);
  if (list.length > 0) {
    const total = list.reduce((sum, item) => {
      const amount = firstNumber(
        item?.diamonds,
        item?.diamondAmount,
        item?.amount,
        item?.creditAmount,
        item?.quantity,
        item?.credits
      );
      return sum + (amount ?? 0);
    }, 0);
    if (total > 0) return total;
  }

  return 0;
};

export const loadMyDiamondCredits = async () => {
  console.log("[diamondCreditService] loading diamond credits...");
  const data = await getMyDiamondCreditRequests();
  const diamonds = parseDiamondBalance(data);
  console.log("[diamondCreditService] parsed diamond balance:", diamonds);
  return { diamonds, raw: data };
};
