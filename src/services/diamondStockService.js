import { getDiamondStockManager } from "../api/rechargeApi";
import { DIAMOND_PACKAGE_TIERS } from "../data/diamondPackageTiers";

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
    root.packages ??
    root.diamondPackages ??
    root.packageList ??
    root.stocks ??
    root.stockList ??
    root.diamondStocks ??
    root.content ??
    root.items ??
    []
  );
};

const normalizeStockEntry = (raw, index) => {
  const diamonds = toNumber(
    firstValue(raw?.diamonds, raw?.diamondAmount, raw?.diamondQuantity, raw?.quantity)
  );
  const inr = toNumber(
    firstValue(raw?.inr, raw?.priceInr, raw?.price, raw?.amount, raw?.inrAmount)
  );
  const exp = raw?.exp != null ? toNumber(raw.exp) : Math.round(diamonds * 0.04);
  return {
    id: String(firstValue(raw?.id, raw?.stockId, raw?.packageId, `stock-${index}`)),
    name: raw?.name || raw?.packageName || raw?.title || `Plan ${index + 1}`,
    diamonds,
    inr,
    exp,
    popular: Boolean(raw?.popular || raw?.isPopular || raw?.badge === "Popular"),
    badge: raw?.badge || (raw?.popular ? "Popular" : null),
  };
};

/** Loads the purchasable diamond package list from the backend, sorted low to high, falling back to DIAMOND_PACKAGE_TIERS. */
export const loadDiamondStockPackages = async () => {
  try {
    const data = await getDiamondStockManager().catch(() => null);
    const list = listFromResponse(data);
    const valid = list
      .map(normalizeStockEntry)
      .filter((pkg) => pkg.diamonds > 0 && pkg.inr > 0)
      .sort((a, b) => a.inr - b.inr);

    if (valid.length > 0) {
      return valid;
    }
  } catch (_err) {
    // fallback to catalog tiers
  }

  return DIAMOND_PACKAGE_TIERS.map((tier) => ({
    ...tier,
    popular: Boolean(tier.popular),
    badge: tier.popular ? "Popular" : null,
  }));
};
