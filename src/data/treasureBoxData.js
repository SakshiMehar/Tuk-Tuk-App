export const TREASURE_CHESTS = [
  {
    id: 0,
    name: "Bronze Chest",
    image: require("../../assets/Treasure/chest-tier-1.png"),
    requiredPower: 100,
  },
  {
    id: 1,
    name: "Silver Chest",
    image: require("../../assets/Treasure/chest-tier-2.png"),
    requiredPower: 100,
  },
  {
    id: 2,
    name: "Royal Chest",
    image: require("../../assets/Treasure/chest-tier-3.png"),
    requiredPower: 100,
  },
  {
    id: 3,
    name: "Crown Chest",
    image: require("../../assets/Treasure/chest-tier-4.png"),
    requiredPower: 100,
  },
];

export const TREASURE_KEY_IMAGE = require("../../assets/Treasure/treasure-key.png");

export const TREASURE_REWARDS_BY_CHEST = {
  0: [
    {
      id: "c0-phoenix",
      image: require("../../assets/Treasure/reward-phoenix.png"),
      qty: "x1",
      duration: "1 Day",
      featured: true,
    },
    {
      id: "c0-ring",
      image: require("../../assets/Treasure/reward-ring.png"),
      qty: "x1",
      duration: "1 Day",
    },
    {
      id: "c0-backpack",
      image: require("../../assets/Treasure/reward-backpack.png"),
      qty: "x1",
      duration: "1 Day",
    },
    {
      id: "c0-scroll",
      image: require("../../assets/Treasure/reward-scroll.png"),
      qty: "x1",
      duration: "1 Day",
    },
    {
      id: "c0-gems",
      image: require("../../assets/Treasure/reward-gems.png"),
      qty: "x570",
    },
  ],
  1: [
    {
      id: "c1-phoenix",
      image: require("../../assets/Treasure/reward-phoenix.png"),
      qty: "x2",
      duration: "1 Day",
      featured: true,
    },
    {
      id: "c1-ring",
      image: require("../../assets/Treasure/reward-ring.png"),
      qty: "x2",
      duration: "1 Day",
    },
    {
      id: "c1-backpack",
      image: require("../../assets/Treasure/reward-backpack.png"),
      qty: "x1",
      duration: "3 Day",
    },
    {
      id: "c1-scroll",
      image: require("../../assets/Treasure/reward-scroll.png"),
      qty: "x2",
      duration: "1 Day",
    },
    {
      id: "c1-gems",
      image: require("../../assets/Treasure/reward-gems.png"),
      qty: "x1200",
    },
  ],
  2: [
    {
      id: "c2-phoenix",
      image: require("../../assets/Treasure/reward-phoenix.png"),
      qty: "x3",
      duration: "3 Day",
      featured: true,
    },
    {
      id: "c2-ring",
      image: require("../../assets/Treasure/reward-ring.png"),
      qty: "x3",
      duration: "3 Day",
    },
    {
      id: "c2-backpack",
      image: require("../../assets/Treasure/reward-backpack.png"),
      qty: "x2",
      duration: "3 Day",
    },
    {
      id: "c2-scroll",
      image: require("../../assets/Treasure/reward-scroll.png"),
      qty: "x3",
      duration: "1 Day",
    },
    {
      id: "c2-gems",
      image: require("../../assets/Treasure/reward-gems.png"),
      qty: "x2500",
    },
  ],
  3: [
    {
      id: "c3-phoenix",
      image: require("../../assets/Treasure/reward-phoenix.png"),
      qty: "x5",
      duration: "7 Day",
      featured: true,
    },
    {
      id: "c3-ring",
      image: require("../../assets/Treasure/reward-ring.png"),
      qty: "x5",
      duration: "7 Day",
    },
    {
      id: "c3-backpack",
      image: require("../../assets/Treasure/reward-backpack.png"),
      qty: "x3",
      duration: "7 Day",
    },
    {
      id: "c3-scroll",
      image: require("../../assets/Treasure/reward-scroll.png"),
      qty: "x5",
      duration: "3 Day",
    },
    {
      id: "c3-gems",
      image: require("../../assets/Treasure/reward-gems.png"),
      qty: "x5000",
    },
  ],
};

export const TREASURE_RESET_LABEL = "Daily reset at 00:00 (GMT+5:30)";

export const TREASURE_POWER_TICK_PERCENT = 1;
export const TREASURE_POWER_TICK_MS = 12000;
