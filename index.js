import notifee from "./src/services/safeNotifee";
import messaging from "@react-native-firebase/messaging";
import { handleBackgroundCallSignal, handleNotifeeBackgroundEvent } from "./src/services/callBackgroundService";

notifee.onBackgroundEvent(handleNotifeeBackgroundEvent);

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    try {
        const payload = remoteMessage?.data;
        if (
            payload &&
            (payload.type === 'CALL_INCOMING' ||
             payload.type === 'CALL_ENDED' ||
             payload.type === 'CALL_REJECTED' ||
             payload.type === 'CALL_ACCEPTED')
        ) {
            await handleBackgroundCallSignal(payload);
        }
    } catch (err) {
        console.warn("[FCM Background] Failed to process background message:", err);
    }
});

messaging().onMessage(async (remoteMessage) => {
    try {
        console.log("====== NEW PUSH NOTIFICATION RECEIVED ======");
        console.log(JSON.stringify(remoteMessage, null, 2));
        console.log("============================================");
    } catch (err) {
        console.warn("[FCM Foreground] Error handling push message:", err);
    }
});

require("expo-router/entry");
