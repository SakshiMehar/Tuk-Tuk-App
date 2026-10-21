import { NativeModules } from "react-native";

// Detect whether the native Notifee module is compiled into the current binary
export const isNotifeeNativeAvailable = Boolean(
  NativeModules && NativeModules.NotifeeApiModule
);

let realNotifee = null;
let AndroidCategory = {
  ALARM: "alarm",
  CALL: "call",
  EMAIL: "email",
  ERROR: "error",
  EVENT: "event",
  MESSAGE: "msg",
  NAVIGATION: "navigation",
  PROGRESS: "progress",
  PROMO: "promo",
  RECOMMENDATION: "recommendation",
  REMINDER: "reminder",
  SERVICE: "service",
  SOCIAL: "social",
  STATUS: "status",
  SYSTEM: "sys",
  TRANSPORT: "transport",
};

let AndroidImportance = {
  NONE: 0,
  MIN: 1,
  LOW: 2,
  DEFAULT: 3,
  HIGH: 4,
};

let EventType = {
  UNKNOWN: -1,
  DISMISSED: 0,
  PRESS: 1,
  ACTION_PRESS: 2,
  DELIVERED: 3,
  APP_BLOCKED: 4,
  CHANNEL_BLOCKED: 5,
  CHANNEL_GROUP_BLOCKED: 6,
  TRIGGER_NOTIFICATION_CREATED: 7,
  FG_ALREADY_EXIST: 8,
};

if (isNotifeeNativeAvailable) {
  try {
    const rawNotifee = require("@notifee/react-native");
    realNotifee = rawNotifee.default || rawNotifee;
    if (rawNotifee.AndroidCategory) AndroidCategory = rawNotifee.AndroidCategory;
    if (rawNotifee.AndroidImportance) AndroidImportance = rawNotifee.AndroidImportance;
    if (rawNotifee.EventType) EventType = rawNotifee.EventType;
  } catch (err) {
    console.warn("[safeNotifee] Could not initialize native Notifee:", err?.message);
    realNotifee = null;
  }
}

// Graceful fallback mock when running in an environment without Notifee compiled in
const fallbackNotifee = {
  isAvailable: false,
  createChannel: async () => "incoming-calls-v3",
  displayNotification: async () => "mock-notification-id",
  cancelNotification: async () => {},
  cancelAllNotifications: async () => {},
  getInitialNotification: async () => null,
  onForegroundEvent: () => () => {},
  onBackgroundEvent: () => {},
};

const notifee = isNotifeeNativeAvailable && realNotifee ? realNotifee : fallbackNotifee;

export { AndroidCategory, AndroidImportance, EventType };
export default notifee;
