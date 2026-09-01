import {
    getNotifications as apiGetNotifications,
    getUnreadNotificationCount as apiGetUnreadNotificationCount,
    markNotificationsRead as apiMarkNotificationsRead,
    registerDeviceToken as apiRegisterDeviceToken,
    unregisterDeviceToken as apiUnregisterDeviceToken,
    getNotificationSwitch as apiGetNotificationSwitch,
    patchNotificationSwitch as apiPatchNotificationSwitch,
} from "../api/notificationApi";

// Fetch notification list (paginated).
export const loadNotifications = async ({
    page = 0,
    size = 20,
} = {}) => {
    return apiGetNotifications({ page, size });
};

// Fetch unread notification count — returns a plain number.
export const loadUnreadNotificationCount = async () => {
    const data = await apiGetUnreadNotificationCount();

    if (typeof data === "number") {
        return data;
    }

    return Number(
        data?.unreadCount ?? data?.count ?? data?.data?.unreadCount ?? 0
    );
};

// Fetch notification list + unread count in a single parallel call.
// Returns { content: [], unreadCount: 0 } so the caller only needs one await.
export const fetchNotificationsData = async ({ page = 0, size = 20 } = {}) => {
    const [listData, countData] = await Promise.all([
        apiGetNotifications({ page, size }),
        apiGetUnreadNotificationCount(),
    ]);

    const content = listData?.notifications?.content ?? [];
    const unreadCount =
        typeof countData === "number"
            ? countData
            : Number(countData?.unreadCount ?? 0);

    return { content, unreadCount };
};

// Mark specific notifications as read by ID array.
export const markNotificationsAsRead = async (notificationIds = []) => {
    return apiMarkNotificationsRead(notificationIds);
};

// Mark all notifications as read.
export const markAllNotificationsAsRead = async () => {
    return apiMarkNotificationsRead("all");
};

// Register current FCM token with the backend.
export const registerCurrentDeviceToken = async (token) => {
    if (!token) return null;
    const response = await apiRegisterDeviceToken(token);
    return { token, response };
};

// Unregister a specific FCM token.
export const unregisterCurrentDeviceToken = async (token) => {
    if (!token) return null;
    return apiUnregisterDeviceToken(token);
};

// GET notification switch — returns the full response object so callers can
// read notificationsEnabled and messageNotificationsEnabled independently.
export const loadNotificationSwitch = async () => {
    return apiGetNotificationSwitch();
};

// PATCH notification switch — returns the full updated response object.
export const updateNotificationSwitch = async (enabled) => {
    return apiPatchNotificationSwitch(enabled);
};