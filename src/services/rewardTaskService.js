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
