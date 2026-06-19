import AsyncStorage from "@react-native-async-storage/async-storage";
import { claimDailyTask } from "../api/userApi";

const STORAGE_KEY = "@reward_tasks_claimed";

/**
 * Reward tasks shown in Profile → Menu → Task. reward is in diamonds (💎).
 * `taskType` is the path param sent to POST /api/daily-tasks/{taskType}/claim.
 * Adjust these to match your backend's task-type values if they differ.
 */
export const REWARD_TASKS = [
  { id: "login_today",      taskType: "LOGIN_TODAY",      label: "Log in today",                 reward: 100,  emoji: "🔓" },
  { id: "make_friend",      taskType: "MAKE_FRIEND",      label: "Make 1 new friend",            reward: 100,  emoji: "🤝" },
  { id: "voice_30min",      taskType: "VOICE_ROOM_30MIN", label: "Join a voice room for 30 min", reward: 250,  emoji: "🎙️" },
  { id: "follow_10",        taskType: "FOLLOW_10",        label: "Follow 10 new users",          reward: 100,  emoji: "➕" },
  { id: "recharge_once",    taskType: "RECHARGE_ONCE",    label: "Recharge once",                reward: 1500, emoji: "💳" },
  { id: "post_10",          taskType: "POST_10",          label: "Create 10 posts today",        reward: 1000, emoji: "📝" },
  { id: "send_gift_300",    taskType: "SEND_GIFT_300",    label: "Send a gift over 300💎",       reward: 100,  emoji: "🎁" },
  { id: "like_post",        taskType: "LIKE_POST",        label: "Like a post",                  reward: 50,   emoji: "❤️" },
  { id: "receive_gift_100", taskType: "RECEIVE_GIFT_100", label: "Receive a 100💎 gift",         reward: 50,   emoji: "💝" },
];

export const TASKS_TOTAL_REWARD = REWARD_TASKS.reduce(
  (sum, task) => sum + task.reward,
  0
);

export const loadClaimedTasks = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
};

export const saveClaimedTasks = async (ids) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Non-fatal — claim state just won't persist this time.
  }
};

/** Sum of diamond rewards for the given claimed task ids. */
export const claimedBonusTotal = (claimedIds = []) =>
  REWARD_TASKS.reduce(
    (sum, task) => (claimedIds.includes(task.id) ? sum + task.reward : sum),
    0
  );

/** Claim a reward task on the backend and log the response in the terminal. */
export const claimRewardTask = async (task) => {
  const data = await claimDailyTask(task.taskType ?? task.id);
  console.log(
    "[rewardTaskService] claim response:",
    JSON.stringify({ taskType: task.taskType ?? task.id, response: data }, null, 2)
  );
  return data;
};
