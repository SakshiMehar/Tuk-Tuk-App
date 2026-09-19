import { claimDailyTask, getDailyTasks } from "../api/userApi";

const TASK_EMOJIS = {
  LOGIN_TODAY: "🔓",
  MAKE_NEW_FRIEND: "🤝",
  MAKE_FRIEND: "🤝",
  JOIN_VOICE_ROOM_30_MIN: "🎙️",
  VOICE_ROOM_30MIN: "🎙️",
  FOLLOW_10_NEW_USERS: "➕",
  FOLLOW_10: "➕",
  RECHARGE_ONCE: "💳",
  CREATE_10_POSTS: "📝",
  POST_10: "📝",
  SEND_GIFT_OVER_300: "🎁",
  SEND_GIFT_300: "🎁",
  LIKE_A_POST: "❤️",
  LIKE_POST: "❤️",
  RECEIVE_100_GIFT: "💝",
  RECEIVE_GIFT_100: "💝",
};

const TASK_ICONS = {
  LOGIN_TODAY: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Lock.png",
  MAKE_NEW_FRIEND: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Friend.png",
  MAKE_FRIEND: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Friend.png",
  JOIN_VOICE_ROOM_30_MIN: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Voice.png",
  VOICE_ROOM_30MIN: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Voice.png",
  FOLLOW_10_NEW_USERS: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/New+user.png",
  FOLLOW_10: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/New+user.png",
  RECHARGE_ONCE: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Recharge.png",
  CREATE_10_POSTS: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Post.png",
  POST_10: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Post.png",
  SEND_GIFT_OVER_300: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/gift+box1.png",
  SEND_GIFT_300: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/gift+box1.png",
  LIKE_A_POST: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Heart.png",
  LIKE_POST: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Heart.png",
  RECEIVE_100_GIFT: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Heart+gift.png",
  RECEIVE_GIFT_100: "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/Rechargebonus/Popupheader/Heart+gift.png",
};
const normalizeDailyTask = (task) => {
  const taskType = task?.taskType ?? task?.type ?? task?.id ?? "";
  return {
    id: taskType,
    taskType,
    label: task?.title ?? task?.label ?? taskType,
    reward: task?.rewardDiamonds ?? task?.reward ?? 0,
    progressCount: task?.progressCount ?? 0,
    targetCount: task?.targetCount ?? 1,
    completed: Boolean(task?.completed),
    claimed: Boolean(task?.claimed),
    emoji: TASK_EMOJIS[taskType] ?? "✨",
    iconUrl: TASK_ICONS[taskType] ?? "https://tuk-tuk-storage-352306493926.s3.ap-south-1.amazonaws.com/icons/gift+box1.png",
  };
};

/** GET /api/app/daily-tasks */
export const loadDailyTasks = async () => {
  const data = await getDailyTasks();
  const tasks = (Array.isArray(data) ? data : data?.tasks ?? []).map(normalizeDailyTask);
  
  return tasks;
};

export const tasksTotalReward = (tasks = []) =>
  tasks.reduce((sum, task) => sum + (task.reward ?? 0), 0);

export const claimedTasksDiamondTotal = (tasks = []) =>
  tasks.reduce(
    (sum, task) => (task.claimed ? sum + (task.reward ?? 0) : sum),
    0
  );

/** POST /api/app/daily-tasks/{taskType}/claim */
export const claimRewardTask = async (task) => {
  const taskType = task?.taskType ?? task?.id;
  const data = await claimDailyTask(taskType);
  
  return data;
};
