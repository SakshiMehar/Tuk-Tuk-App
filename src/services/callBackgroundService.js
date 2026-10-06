import notifee, { AndroidCategory, AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Process FCM Background Messages
export const handleBackgroundCallSignal = async (payload) => {
    const { type, callId, senderId, senderName } = payload;

    if (type === 'CALL_INCOMING') {
        const channelId = await notifee.createChannel({
            id: 'incoming-calls-v2',
            name: 'Incoming Calls',
            sound: 'default',
            vibration: true,
            importance: AndroidImportance.HIGH,
        });

        await notifee.displayNotification({
            id: `call_${callId}`,
            title: 'Incoming Call',
            body: `${senderName || 'Someone'} is calling...`,
            data: {
                callId: String(callId),
                senderId: String(senderId),
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
                        title: 'Reject',
                        pressAction: { id: 'reject-call' },
                    },
                    {
                        title: 'Accept',
                        pressAction: { id: 'accept-call', launchActivity: 'default' },
                    },
                ],
            },
        });
    } else if (type === 'CALL_ENDED' || type === 'CALL_REJECTED' || type === 'CALL_ACCEPTED') {
        // Cancel the ongoing notification if the caller drops or call is handled
        await notifee.cancelNotification(`call_${callId}`);
    }
};

// 2. Handle Notifee Button Presses in Background
export const handleNotifeeBackgroundEvent = async ({ type, detail }) => {
    const { notification, pressAction } = detail;

    if (type === EventType.ACTION_PRESS) {
        if (pressAction.id === 'reject-call') {
            // Logic to reject call via API if possible (needs token)
            await notifee.cancelNotification(notification.id);
        } else if (pressAction.id === 'accept-call') {
            // Save pending acceptance so the foreground app can pick it up instantly
            await AsyncStorage.setItem('pending_call_accept', JSON.stringify(notification.data));
            await notifee.cancelNotification(notification.id);
        }
    }
};
