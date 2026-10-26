import notifee, { AndroidCategory, AndroidImportance, EventType } from './safeNotifee';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { rejectCall as apiRejectCall } from '../api/callApi';

// 1. Process FCM Background Messages
export const handleBackgroundCallSignal = async (payload) => {
    if (!payload || typeof payload !== 'object') return;
    try {
        const { type, callId, senderId, senderName } = payload;
        if (!callId && type === 'CALL_INCOMING') return;

        if (type === 'CALL_INCOMING') {
            const channelId = await notifee.createChannel({
                id: 'incoming-calls-v3',
                name: 'Incoming Calls',
                sound: 'ringtone',
                vibration: true,
                importance: AndroidImportance.HIGH,
            });

            await notifee.displayNotification({
                id: `call_${callId}`,
                title: 'Incoming Call',
                body: `${senderName || 'Someone'} is calling...`,
                data: {
                    callId: String(callId),
                    senderId: String(senderId || ''),
                    senderName: String(senderName || ''),
                },
                android: {
                    channelId,
                    category: AndroidCategory.CALL,
                    importance: AndroidImportance.HIGH,
                    ongoing: true,
                    autoCancel: false,
                    loopSound: true,
                    pressAction: {
                        id: 'default',
                        launchActivity: 'default',
                    },
                    fullScreenAction: {
                        id: 'default',
                        launchActivity: 'default',
                    },
                    actions: [
                        {
                            title: '❌ Decline',
                            pressAction: { id: 'reject-call' },
                        },
                        {
                            title: '✅ Answer',
                            pressAction: { id: 'accept-call', launchActivity: 'default' },
                        },
                    ],
                },
            });
        } else if (type === 'CALL_ENDED' || type === 'CALL_REJECTED' || type === 'CALL_ACCEPTED') {
            // Cancel the ongoing notification if the caller drops or call is handled
            if (callId) {
                await notifee.cancelNotification(`call_${callId}`).catch(() => {});
            }
        }
    } catch (err) {
        console.warn("[callBackgroundService] Failed to handle background call signal:", err);
    }
};

// 2. Handle Notifee Button Presses in Background
export const handleNotifeeBackgroundEvent = async (event) => {
    if (!event || !event.detail) return;
    try {
        const { type, detail } = event;
        const notification = detail?.notification;
        const pressAction = detail?.pressAction;

        if (type === EventType.ACTION_PRESS && pressAction?.id) {
            if (pressAction.id === 'reject-call') {
                // Reject call via API so the caller's UI updates
                if (notification?.data?.callId) {
                    try {
                        await apiRejectCall(notification.data.callId);
                    } catch (err) {
                        console.log("Failed to reject call in background", err);
                    }
                }
                if (notification?.id) {
                    await notifee.cancelNotification(notification.id).catch(() => {});
                }
            } else if (pressAction.id === 'accept-call') {
                // Save pending acceptance so the foreground app can pick it up instantly
                if (notification?.data) {
                    await AsyncStorage.setItem('pending_call_accept', JSON.stringify(notification.data));
                }
                if (notification?.id) {
                    await notifee.cancelNotification(notification.id).catch(() => {});
                }
            }
        }
    } catch (err) {
        console.warn("[callBackgroundService] Error in background Notifee event:", err);
    }
};
