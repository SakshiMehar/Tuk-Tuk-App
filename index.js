import notifee from '@notifee/react-native';
import messaging from "@react-native-firebase/messaging";
import { handleBackgroundCallSignal, handleNotifeeBackgroundEvent } from "./src/services/callBackgroundService";

notifee.onBackgroundEvent(handleNotifeeBackgroundEvent);

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    const payload = remoteMessage.data;
    if (payload && payload.type === 'CALL_INCOMING' || payload?.type === 'CALL_ENDED' || payload?.type === 'CALL_REJECTED') {
        await handleBackgroundCallSignal(payload);
    }
});

messaging().onMessage(async (remoteMessage) => {
    console.log("====== NEW PUSH NOTIFICATION RECEIVED ======");
    console.log(JSON.stringify(remoteMessage, null, 2));
    console.log("============================================");
});

require("expo-router/entry");
