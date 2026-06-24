import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@gift_backpack";

const normalizeGift = (gift, qty = 1) => ({
  id: gift.id,
  name: gift.name ?? "Gift",
  price: Number(gift.price ?? 0),
  emoji: gift.emoji ?? "🎁",
  qty: Math.max(1, Number(qty) || 1),
});

export const loadBackpackGifts = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistBackpack = async (items) => {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
};

export const addGiftToBackpack = async (gift, qty = 1) => {
  const items = await loadBackpackGifts();
  const entry = normalizeGift(gift, qty);
  const index = items.findIndex((item) => String(item.id) === String(entry.id));

  if (index >= 0) {
    items[index] = {
      ...items[index],
      ...entry,
      qty: Number(items[index].qty ?? 0) + entry.qty,
    };
  } else {
    items.push(entry);
  }

  return persistBackpack(items);
};

export const removeGiftFromBackpack = async (giftId, qty = 1) => {
  const items = await loadBackpackGifts();
  const index = items.findIndex((item) => String(item.id) === String(giftId));
  if (index < 0) return items;

  const nextQty = Number(items[index].qty ?? 0) - Math.max(1, Number(qty) || 1);
  if (nextQty <= 0) {
    items.splice(index, 1);
  } else {
    items[index] = { ...items[index], qty: nextQty };
  }

  return persistBackpack(items);
};
