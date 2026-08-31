/**
 * Generates backend-docs/media-upload-checklist.csv and party-gift-catalog.json
 * Run: node scripts/generate-backend-media-docs.js
 */

const fs = require("fs");
const path = require("path");

const API_BASE = "https://api.tuktuk.live";
const MEDIA_PREFIX = "/api/public/media/";

const publicUrl = (storagePath) => `${API_BASE}${MEDIA_PREFIX}${storagePath}`;
const giftImage = (id) => `assets/gifts/party/${id}.png`;

const gifts = [
  // random
  ...["r1", "r2", "r3", "r4", "r5"].map((id, i) => ({
    id,
    name: "Random Gift",
    price: [1777, 3077, 4777, 7777, 27777][i],
    category: "random",
    subCategory: null,
    tab: "random",
    emoji: "🔮",
    hot: false,
    isNew: false,
    vipLocked: false,
  })),
  // standard gift
  { id: "1", name: "Cricket Gift", price: 3077, category: "gift", subCategory: null, tab: "gift", emoji: "🎁", hot: true, isNew: false, vipLocked: false },
  { id: "2", name: "Glory Chest", price: 7777, category: "gift", subCategory: null, tab: "gift", emoji: "📦", hot: false, isNew: false, vipLocked: false },
  { id: "3", name: "Champion Cup", price: 60777, category: "gift", subCategory: null, tab: "gift", emoji: "🏆", hot: false, isNew: false, vipLocked: false },
  { id: "4", name: "Carnival", price: 357777, category: "gift", subCategory: null, tab: "gift", emoji: "🎪", hot: false, isNew: false, vipLocked: false },
  { id: "5", name: "Glory Crown", price: 137777, category: "gift", subCategory: null, tab: "gift", emoji: "👑", hot: false, isNew: false, vipLocked: false },
  { id: "6", name: "Shared Trophy", price: 10777, category: "gift", subCategory: null, tab: "gift", emoji: "🥇", hot: false, isNew: false, vipLocked: false },
  { id: "7", name: "Stadium Fire", price: 1777, category: "gift", subCategory: null, tab: "gift", emoji: "🔥", hot: false, isNew: false, vipLocked: false },
  { id: "8", name: "Serenade", price: 87777, category: "gift", subCategory: null, tab: "gift", emoji: "🎆", hot: false, isNew: false, vipLocked: false },
  // Flamenco Fantasy
  { id: "af1", name: "Confession", price: 9, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "💐", hot: false, isNew: false, vipLocked: false },
  { id: "af2", name: "Crimson Bloom", price: 39, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "🌺", hot: false, isNew: false, vipLocked: false },
  { id: "af3", name: "Heart Choker", price: 17, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "💝", hot: false, isNew: false, vipLocked: false },
  { id: "af4", name: "Grand Yacht", price: 1077777, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "🛥️", hot: false, isNew: false, vipLocked: false },
  { id: "af5", name: "Vermilion Silk", price: 70777, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "🎀", hot: false, isNew: false, vipLocked: false },
  { id: "af6", name: "Jade Grace", price: 8777, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "💚", hot: false, isNew: false, vipLocked: false },
  { id: "af7", name: "Scarlet Elegance", price: 3577, category: "activity", subCategory: "Flamenco Fantasy", tab: "activity", emoji: "🥀", hot: false, isNew: false, vipLocked: false },
  // Ethereal Ring
  { id: "ae1", name: "Crystal Ring", price: 777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "💍", hot: false, isNew: false, vipLocked: false },
  { id: "ae2", name: "Moonstone", price: 4777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "🌙", hot: false, isNew: false, vipLocked: false },
  { id: "ae3", name: "Stardust", price: 9777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "⭐", hot: false, isNew: false, vipLocked: false },
  { id: "ae4", name: "Aurora", price: 27777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "🌈", hot: false, isNew: false, vipLocked: false },
  { id: "ae5", name: "Nebula", price: 57777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "🔮", hot: false, isNew: false, vipLocked: false },
  { id: "ae6", name: "Celestial", price: 107777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "✨", hot: false, isNew: false, vipLocked: false },
  { id: "ae7", name: "Cosmic Ring", price: 357777, category: "activity", subCategory: "Ethereal Ring", tab: "activity", emoji: "💫", hot: false, isNew: false, vipLocked: false },
  // TukTuk Carnival
  { id: "ac1", name: "Confetti", price: 99, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🎊", hot: false, isNew: false, vipLocked: false },
  { id: "ac2", name: "Carnival Box", price: 999, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🎪", hot: false, isNew: false, vipLocked: false },
  { id: "ac3", name: "Lucky Drum", price: 3077, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🥁", hot: false, isNew: false, vipLocked: false },
  { id: "ac4", name: "Firecracker", price: 7777, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🎆", hot: false, isNew: false, vipLocked: false },
  { id: "ac5", name: "Gold Elephant", price: 37777, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🐘", hot: false, isNew: false, vipLocked: false },
  { id: "ac6", name: "Royal Float", price: 77777, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "👑", hot: false, isNew: false, vipLocked: false },
  { id: "ac7", name: "Festival Crown", price: 207777, category: "activity", subCategory: "TukTuk Carnival", tab: "activity", emoji: "🎭", hot: false, isNew: false, vipLocked: false },
  // PK
  { id: "pk1", name: "PK Hammer", price: 1777, category: "pk", subCategory: null, tab: "pk", emoji: "🔨", hot: true, isNew: false, vipLocked: false },
  { id: "pk2", name: "Battle Shield", price: 3077, category: "pk", subCategory: null, tab: "pk", emoji: "🛡️", hot: false, isNew: false, vipLocked: false },
  { id: "pk3", name: "Victory Flame", price: 7777, category: "pk", subCategory: null, tab: "pk", emoji: "🔥", hot: false, isNew: false, vipLocked: false },
  { id: "pk4", name: "Arena Crown", price: 17777, category: "pk", subCategory: null, tab: "pk", emoji: "👑", hot: false, isNew: false, vipLocked: false },
  { id: "pk5", name: "Power Surge", price: 37777, category: "pk", subCategory: null, tab: "pk", emoji: "⚡", hot: true, isNew: false, vipLocked: false },
  { id: "pk6", name: "Champion Star", price: 57777, category: "pk", subCategory: null, tab: "pk", emoji: "⭐", hot: false, isNew: false, vipLocked: false },
  { id: "pk7", name: "PK Champion", price: 107777, category: "pk", subCategory: null, tab: "pk", emoji: "🏆", hot: false, isNew: false, vipLocked: false },
  { id: "pk8", name: "Legend Boost", price: 207777, category: "pk", subCategory: null, tab: "pk", emoji: "💫", hot: false, isNew: false, vipLocked: false },
  // Special
  { id: "sp1", name: "Star Flower", price: 199, category: "special", subCategory: null, tab: "special", emoji: "🌸", hot: false, isNew: true, vipLocked: false },
  { id: "sp2", name: "Love Spark", price: 499, category: "special", subCategory: null, tab: "special", emoji: "💖", hot: false, isNew: true, vipLocked: false },
  { id: "sp3", name: "Magic Lantern", price: 1499, category: "special", subCategory: null, tab: "special", emoji: "🏮", hot: false, isNew: false, vipLocked: false },
  { id: "sp4", name: "Dragon Scale", price: 3999, category: "special", subCategory: null, tab: "special", emoji: "🐉", hot: false, isNew: false, vipLocked: false },
  { id: "sp5", name: "Phoenix Flame", price: 9999, category: "special", subCategory: null, tab: "special", emoji: "🔥", hot: false, isNew: false, vipLocked: false },
  { id: "sp6", name: "Sakura Storm", price: 19999, category: "special", subCategory: null, tab: "special", emoji: "🌸", hot: false, isNew: false, vipLocked: false },
  { id: "sp7", name: "Golden Torii", price: 49999, category: "special", subCategory: null, tab: "special", emoji: "⛩️", hot: false, isNew: false, vipLocked: false },
  { id: "sp8", name: "TukTuk Special", price: 99999, category: "special", subCategory: null, tab: "special", emoji: "🛺", hot: false, isNew: true, vipLocked: false },
  { id: "sp9", name: "Diamond Lotus", price: 199999, category: "special", subCategory: null, tab: "special", emoji: "💠", hot: false, isNew: false, vipLocked: false },
  { id: "sp10", name: "Emperor Gift", price: 499999, category: "special", subCategory: null, tab: "special", emoji: "🏯", hot: false, isNew: false, vipLocked: false },
  { id: "sp11", name: "Celestial Fox", price: 777777, category: "special", subCategory: null, tab: "special", emoji: "🦊", hot: false, isNew: false, vipLocked: false },
  { id: "sp12", name: "Cosmic Gem", price: 1077777, category: "special", subCategory: null, tab: "special", emoji: "💎", hot: false, isNew: false, vipLocked: false },
  // VIP
  { id: "vip1", name: "VIP Throne", price: 9999, category: "vip", subCategory: null, tab: "vip", emoji: "🪑", hot: false, isNew: false, vipLocked: true },
  { id: "vip2", name: "Gold Armor", price: 19999, category: "vip", subCategory: null, tab: "vip", emoji: "🛡️", hot: false, isNew: false, vipLocked: true },
  { id: "vip3", name: "Royal Sword", price: 49999, category: "vip", subCategory: null, tab: "vip", emoji: "⚔️", hot: false, isNew: false, vipLocked: true },
  { id: "vip4", name: "Divine Halo", price: 99999, category: "vip", subCategory: null, tab: "vip", emoji: "😇", hot: false, isNew: false, vipLocked: true },
  { id: "vip5", name: "Titan's Fist", price: 199999, category: "vip", subCategory: null, tab: "vip", emoji: "✊", hot: false, isNew: false, vipLocked: true },
  { id: "vip6", name: "Sacred Lotus", price: 399999, category: "vip", subCategory: null, tab: "vip", emoji: "🪷", hot: false, isNew: false, vipLocked: true },
  { id: "vip7", name: "Galaxy Ship", price: 777777, category: "vip", subCategory: null, tab: "vip", emoji: "🚀", hot: false, isNew: false, vipLocked: true },
  { id: "vip8", name: "God's Eye", price: 1077777, category: "vip", subCategory: null, tab: "vip", emoji: "👁️", hot: false, isNew: false, vipLocked: true },
];

const relationship = [1, 2, 3, 4, 5, 6].map((n) => ({
  id: `iv${n}`,
  name: `Moment ${n}`,
  price: null,
  category: "relationship",
  subCategory: null,
  tab: "relationship",
  emoji: "🎬",
  hot: false,
  isNew: false,
  vipLocked: false,
  videoNumber: n,
}));

const toCatalogItem = (g) => {
  const imgStorage = giftImage(g.id);
  const item = {
    id: g.id,
    name: g.name,
    price: g.price,
    category: g.category,
    subCategory: g.subCategory,
    emoji: g.emoji,
    imageUrl: publicUrl(imgStorage),
    videoUrl: null,
    hot: g.hot,
    isNew: g.isNew,
    vipLocked: g.vipLocked,
    _backend: {
      imageStoragePath: imgStorage,
      imagePublicUrl: publicUrl(imgStorage),
    },
  };
  return item;
};

const toRelationshipItem = (r) => {
  const thumbStorage = `assets/videos/relationship/iv${r.videoNumber}.jpg`;
  const videoStorage = `assets/videos/relationship/v${r.videoNumber}.mp4`;
  return {
    id: r.id,
    name: r.name,
    price: null,
    category: "relationship",
    subCategory: null,
    emoji: r.emoji,
    imageUrl: publicUrl(thumbStorage),
    videoUrl: publicUrl(videoStorage),
    hot: false,
    isNew: false,
    vipLocked: false,
    _backend: {
      thumbnailStoragePath: thumbStorage,
      thumbnailPublicUrl: publicUrl(thumbStorage),
      videoStoragePath: videoStorage,
      videoPublicUrl: publicUrl(videoStorage),
      appSourceVideoFile: `Tuk-Tuk/assets/videos/v${r.videoNumber}.mp4`,
    },
  };
};

const catalog = {
  random: gifts.filter((g) => g.tab === "random").map(toCatalogItem),
  gift: gifts.filter((g) => g.tab === "gift").map(toCatalogItem),
  activity: gifts.filter((g) => g.tab === "activity").map(toCatalogItem),
  pk: gifts.filter((g) => g.tab === "pk").map(toCatalogItem),
  special: gifts.filter((g) => g.tab === "special").map(toCatalogItem),
  vip: gifts.filter((g) => g.tab === "vip").map(toCatalogItem),
  relationship: relationship.map(toRelationshipItem),
};

const outDir = path.join(__dirname, "..", "backend-docs");
fs.mkdirSync(outDir, { recursive: true });

// JSON
const jsonPayload = {
  _meta: {
    description: "Party gift catalog for Tuk-Tuk app — seed DB or use as API response template",
    apiBaseUrl: API_BASE,
    mediaPublicRoute: "GET {apiBaseUrl}/api/public/media/{storagePath}",
    catalogEndpoint: "GET /api/app/gifts/party/catalog",
    totalGiftImages: 58,
    totalRelationshipThumbnails: 6,
    totalRelationshipVideos: 6,
    totalMediaFiles: 70,
  },
  catalog,
};

fs.writeFileSync(
  path.join(outDir, "party-gift-catalog.json"),
  JSON.stringify(jsonPayload, null, 2),
  "utf8"
);

// CSV — one row per media file
const csvEscape = (v) => {
  const s = v == null ? "" : String(v);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
};

const csvRows = [
  [
    "row_type",
    "gift_id",
    "gift_name",
    "price_diamonds",
    "app_tab",
    "category",
    "sub_category",
    "emoji",
    "media_type",
    "file_format",
    "storage_path",
    "public_url",
    "app_local_source",
    "hot",
    "is_new",
    "vip_locked",
  ].join(","),
];

gifts.forEach((g) => {
  const storage = giftImage(g.id);
  csvRows.push(
    [
      "gift",
      g.id,
      g.name,
      g.price,
      g.tab,
      g.category,
      g.subCategory ?? "",
      g.emoji,
      "gift_icon",
      "png",
      storage,
      publicUrl(storage),
      "",
      g.hot,
      g.isNew,
      g.vipLocked,
    ].map(csvEscape).join(",")
  );
});

relationship.forEach((r) => {
  const thumb = `assets/videos/relationship/iv${r.videoNumber}.jpg`;
  const video = `assets/videos/relationship/v${r.videoNumber}.mp4`;
  csvRows.push(
    [
      "relationship",
      r.id,
      r.name,
      "",
      "relationship",
      "relationship",
      "",
      r.emoji,
      "thumbnail",
      "jpg",
      thumb,
      publicUrl(thumb),
      "",
      false,
      false,
      false,
    ].map(csvEscape).join(",")
  );
  csvRows.push(
    [
      "relationship",
      r.id,
      r.name,
      "",
      "relationship",
      "relationship",
      "",
      r.emoji,
      "video",
      "mp4",
      video,
      publicUrl(video),
      `Tuk-Tuk/assets/videos/v${r.videoNumber}.mp4`,
      false,
      false,
      false,
    ].map(csvEscape).join(",")
  );
});

fs.writeFileSync(path.join(outDir, "media-upload-checklist.csv"), csvRows.join("\n"), "utf8");

console.log("Generated:");
console.log("  backend-docs/party-gift-catalog.json");
console.log("  backend-docs/media-upload-checklist.csv");
