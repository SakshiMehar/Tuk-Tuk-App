export const HONOR_PRIVILEGES = [
  { id: "birthdays", icon: "gift", label: "Birthdays" },
  { id: "notifications", icon: "notifications", label: "Notifications" },
  { id: "badges", icon: "ribbon", label: "Badges" },
  { id: "personal", icon: "image", label: "Personal..." },
  { id: "avatarFrame", icon: "person-circle", label: "Avatar f..." },
  { id: "chatFrame", icon: "chatbox-ellipses", label: "Chat fra..." },
  { id: "extra", icon: "planet", label: "Extra be..." },
];

export const HONOR_LEVELS = [
  {
    level: 1,
    name: "H.1",
    monthValue: 54000,
    requiredNext: 53999,
    bg: "#F3F4F6", // Light gray
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level1.png",
    privilegeIds: ["birthdays", "notifications", "badges"],
  },
  {
    level: 2,
    name: "H.2",
    monthValue: 92000,
    requiredNext: 91999,
    bg: "#DCFCE7", // Light green
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level2.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal"],
  },
  {
    level: 3,
    name: "H.3",
    monthValue: 180000,
    requiredNext: 179999,
    bg: "#FFEDD5", // Light orange
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level3.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },
  {
    level: 4,
    name: "H.4",
    monthValue: 313000,
    requiredNext: 312999,
    bg: "#F3E8FF", // Light purple
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level4.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },
  {
    level: 5,
    name: "H.5",
    monthValue: 515000,
    requiredNext: 514999,
    bg: "#E0F2FE", // Light blue
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level5.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },
  {
    level: 6,
    name: "H.6",
    monthValue: 763000,
    requiredNext: 762999,
    bg: "#FCE7F3", // Pink
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level6.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },
  {
    level: 7,
    name: "H.7",
    monthValue: 1580000,
    requiredNext: 1579999,
    bg: "#FAE8FF", // Darker purple
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level7.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },
  {
    level: 8,
    name: "H.8",
    monthValue: 3000000,
    requiredNext: 2999999,
    bg: "#FEF3C7", // Yellowish
    image: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/assets/level/level10.png",
    privilegeIds: ["birthdays", "notifications", "badges", "personal", "avatarFrame", "chatFrame", "extra"],
  },

];
