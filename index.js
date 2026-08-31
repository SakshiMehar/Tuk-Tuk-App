import messaging from "@react-native-firebase/messaging";

// Must run before the app registers — handles push messages that arrive
// while the app is backgrounded or fully killed. FCM auto-displays the
// system-tray notification in that state when the payload has a `notification`
// block; this handler is where data-only background messages get processed.
// Registered via require() (not `import`) so it truly runs first — Babel
// hoists `import` statements above plain statements, which would otherwise
// run expo-router/entry's app registration before this handler is set.
messaging().setBackgroundMessageHandler(async () => {});

require("expo-router/entry");
