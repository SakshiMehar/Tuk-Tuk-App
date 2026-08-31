import {
  buyGift as apiBuyGift,
  getPartyGiftCatalog,
  getGiftInventory,
  sendGiftInRoom,
} from "../api/giftApi";
import { sendRoomGift } from "../api/partyApi";

const giftKeys = (gift) =>
  [gift?.giftCode, gift?.id, gift?.code, gift?.giftId, gift?.databaseId]
    .filter((value) => value !== undefined && value !== null && String(value).length > 0)
    .map((value) => String(value));

/** True when two gift rows refer to the same catalog item. */
export const giftsMatch = (a, b) => {
  if (!a || !b) return false;
  const aKeys = new Set(giftKeys(a));
  return giftKeys(b).some((key) => aKeys.has(key));
};

export const findInventoryGift = (inventory, gift) =>
  inventory.find((item) => giftsMatch(item, gift)) ?? null;

export const adjustInventoryQty = (inventory, gift, delta) => {
  if (!gift || !Number.isFinite(delta) || delta === 0) return inventory;

  const existing = findInventoryGift(inventory, gift);
  if (!existing && delta < 0) return inventory;

  if (!existing) {
    const added = normalizeInventoryGift({
      ...gift,
      quantity: Math.max(0, delta),
    });
    return added.qty > 0 ? [...inventory, added] : inventory;
  }

  return inventory.flatMap((item) => {
    if (!giftsMatch(item, gift)) return [item];
    const nextQty = Math.max(0, Number(item.qty ?? 0) + delta);
    return nextQty > 0 ? [{ ...item, qty: nextQty }] : [];
  });
};

/** Prefer server inventory; keep optimistic rows the server has not caught up yet. */
export const reconcileInventory = (
  serverItems,
  optimisticItems,
  { preferLowerQty = false } = {}
) => {
  const merged = [...serverItems];

  optimisticItems.forEach((opt) => {
    if (!opt?.qty || opt.qty <= 0) return;
    const srv = findInventoryGift(merged, opt);
    if (!srv) {
      merged.push(opt);
      return;
    }
    if (preferLowerQty && Number(opt.qty) < Number(srv.qty)) {
      const idx = merged.findIndex((item) => giftsMatch(item, opt));
      if (idx >= 0) merged[idx] = { ...merged[idx], qty: opt.qty };
    }
  });

  return merged.filter((item) => Number(item.qty) > 0);
};

export const parseBuyResultInventory = (result, gift, boughtQty = 1) => {
  const row = result?.inventory ?? result?.item ?? result?.gift ?? null;
  if (row) return normalizeInventoryGift(row);

  const qty = Number(result?.quantity ?? result?.qty ?? result?.inventoryQty);
  if (Number.isFinite(qty) && qty > 0) {
    return normalizeInventoryGift({ ...gift, quantity: qty });
  }

  if (result?.success || result?.giftCode || result?.giftId) {
    return normalizeInventoryGift({
      ...gift,
      quantity: Math.max(1, Number(boughtQty) || 1),
    });
  }

  return null;
};

const PARTY_CATALOG_KEYS = [
  "random",
  "gift",
  "activity",
  "pk",
  "special",
  "vip",
  "relationship",
];

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/** Map API catalog row → UI gift card shape */
export const normalizeCatalogGift = (item) => {
  const giftCode = String(item?.id ?? item?.giftCode ?? item?.code ?? "");
  const databaseId = Number(item?.databaseId);
  return {
    id: giftCode,
    giftCode,
    databaseId: Number.isFinite(databaseId) && databaseId > 0 ? databaseId : null,
    name: item?.name ?? "Gift",
    price: Number(item?.price ?? 0),
    emoji: item?.emoji ?? "🎁",
    imageUrl: item?.imageUrl ?? null,
    videoUrl: item?.videoUrl ?? null,
    hot: Boolean(item?.hot),
    isNew: Boolean(item?.isNew ?? item?.new),
    vipLocked: Boolean(item?.vipLocked),
    category: item?.category ?? null,
    subCategory: item?.subCategory ?? null,
  };
};

/** Map API inventory row → backpack item */
export const normalizeInventoryGift = (item) => {
  const nested = item?.gift && typeof item.gift === "object" ? item.gift : item;
  const catalog = normalizeCatalogGift(nested);
  const giftCode = String(
    item?.giftCode ??
      item?.code ??
      nested?.giftCode ??
      nested?.code ??
      catalog.giftCode ??
      item?.giftId ??
      nested?.giftId ??
      item?.id ??
      ""
  );
  return {
    ...catalog,
    id: giftCode,
    giftCode,
    qty: Math.max(
      0,
      Number(
        item?.quantity ??
          item?.qty ??
          item?.count ??
          item?.amount ??
          item?.remaining ??
          nested?.quantity ??
          nested?.qty ??
          0
      )
    ),
  };
};

const emptyPartyCatalog = () => ({
  random: [],
  gift: [],
  activity: [],
  activityByEvent: {},
  relationship: [],
  pk: [],
  special: [],
  vip: [],
});

/** Parse GET /api/app/gifts/party/catalog into tab buckets */
export const parsePartyGiftCatalog = (data) => {
  const catalog = emptyPartyCatalog();
  if (!data || typeof data !== "object") return catalog;

  PARTY_CATALOG_KEYS.forEach((key) => {
    const items = asList(data[key]).map(normalizeCatalogGift);
    if (key === "activity") {
      catalog.activity = items;
      catalog.activityByEvent = groupActivityGifts(items);
      return;
    }
    catalog[key] = items;
  });

  return catalog;
};

/** GET /api/app/gifts/party/catalog — recommended party room catalog */
export const loadPartyGiftCatalog = async () => {
  const data = await getPartyGiftCatalog();
  return parsePartyGiftCatalog(data);
};

export const loadGiftInventory = async () => {
  const data = await getGiftInventory();
  const rows = asList(data);
  if (!rows.length && data && typeof data === "object") {
    return Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .map(normalizeInventoryGift)
      .filter((item) => item.qty > 0);
  }
  return rows.map(normalizeInventoryGift).filter((item) => item.qty > 0);
};

export const buyGiftToBackpack = async ({ giftCode, quantity = 1 }) => {
  const data = await apiBuyGift({ giftCode, quantity });
  return data;
};

/** Normalize send/WS animation payload for the gift popup */
export const normalizeGiftAnimation = (payload, fallbackGift) => ({
  name: payload?.giftName ?? payload?.name ?? fallbackGift?.name ?? "Gift",
  emoji: payload?.emoji ?? fallbackGift?.emoji ?? "🎁",
  imageUrl: payload?.imageUrl ?? fallbackGift?.imageUrl ?? null,
  videoUrl: payload?.videoUrl ?? fallbackGift?.videoUrl ?? null,
  senderName: payload?.senderName ?? payload?.sender ?? null,
  quantity: Math.max(1, Number(payload?.quantity ?? 1)),
});

/** Party room gift send — backpack uses /api/app/gifts/room/send, diamonds use sendRoomGift */
export const sendPartyRoomGift = async ({
  roomId,
  gift,
  receiverId,
  quantity = 1,
  senderName = "User",
  animation,
  backpackQty = 0,
  forceDiamondPay = false,
}) => {
  const giftCode = String(gift?.giftCode ?? gift?.id ?? gift?.code ?? "");
  const qty = Math.max(1, Number(quantity) || 1);
  const receiver = Number(receiverId);
  const unitPrice = Math.max(0, Number(gift?.price ?? 0));
  const ownedQty = Math.max(0, Number(backpackQty) || 0);
  const hasBackpackStock = ownedQty >= qty;

  if (!roomId) throw new Error("Room is not ready.");
  if (!giftCode) throw new Error("Gift is missing.");
  if (!receiver) throw new Error("Choose who receives this gift.");

  if (hasBackpackStock && !forceDiamondPay) {
    return sendGiftInRoom({
      roomId: String(roomId),
      receiverId: receiver,
      giftCode,
      quantity: qty,
    });
  }

  const body = {
    receiverId: receiver,
    giftCode,
    quantity: qty,
    senderName: String(senderName),
    diamondValue: unitPrice * qty,
  };

  if (animation) {
    body.animation = String(animation);
  }

  return sendRoomGift(String(roomId), body);
};

/** Group activity catalog by subCategory for event tabs */
export const groupActivityGifts = (items) => {
  const grouped = {};
  items.forEach((gift) => {
    const key = gift.subCategory ?? "Activity";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(gift);
  });
  return grouped;
};

export const GIFT_CATALOG_CATEGORIES = {
  random: "random",
  gift: "gift",
  activity: "activity",
  relationship: "relationship",
  pk: "pk",
  special: "special",
  vip: "vip",
};
