import { getDiamondStockManager } from "../api/rechargeApi";

const firstValue = (...values) =>
  values.find((value) => value !== undefined && value !== null) ?? null;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const listFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  const root = data?.data ?? data ?? {};
  if (Array.isArray(root)) return root;
  return (
    root.stocks ??
    root.stockList ??
    root.packages ??
    root.diamondStocks ??
    root.content ??
    root.items ??
    []
  );
};

const normalizeStockEntry = (raw, index) => ({
  id: String(firstValue(raw?.id, raw?.stockId, raw?.packageId, `stock-${index}`)),
  diamonds: toNumber(
    firstValue(raw?.diamonds, raw?.diamondAmount, raw?.diamondQuantity, raw?.quantity)
  ),
  inr: toNumber(
    firstValue(raw?.inr, raw?.priceInr, raw?.price, raw?.amount, raw?.inrAmount)
  ),
});

/** Loads the purchasable diamond package list from the backend, sorted low to high. */
export const loadDiamondStockPackages = async () => {
  const data = await getDiamondStockManager();
  const list = listFromResponse(data);
  return list
    .map(normalizeStockEntry)
    .filter((pkg) => pkg.diamonds > 0 && pkg.inr > 0)
    .sort((a, b) => a.inr - b.inr);
};
