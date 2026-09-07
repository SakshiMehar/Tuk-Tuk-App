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
    try {
        const [listData, countData] = await Promise.allSettled([
            apiGetNotifications({ page, size }),
            apiGetUnreadNotificationCount(),
        ]);

        const rawList = listData.status === "fulfilled" ? listData.value : null;
        const rawCount = countData.status === "fulfilled" ? countData.value : null;

        const content =
            rawList?.notifications?.content ??
            rawList?.notifications ??
            rawList?.content ??
            rawList?.data ??
            (Array.isArray(rawList) ? rawList : []);

        const unreadCount =
            typeof rawCount === "number"
                ? rawCount
                : Number(
                    rawCount?.unreadCount ??
                    rawCount?.count ??
                    rawCount?.data?.unreadCount ??
                    content.filter((n) => n.unread === true || n.read === false || n.isRead === false).length
                );

        return { content, unreadCount };
    } catch {
        return { content: [], unreadCount: 0 };
    }
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
export const registerCurrentDeviceToken = async (token, userId = null) => {
    if (!token) return null;
    const response = await apiRegisterDeviceToken(token, undefined, userId);
    return { token, response };
};

// Unregister a specific FCM token.
export const unregisterCurrentDeviceToken = async (token, userId = null) => {
    if (!token) return null;
    return apiUnregisterDeviceToken(token, undefined, userId);
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