const { AndroidConfig, withAndroidManifest } = require("@expo/config-plugins");

// Agora's SDK contributes a screen-sharing service/activity that requires
// FOREGROUND_SERVICE_MEDIA_PROJECTION. The app only uses Agora for voice
// party rooms, not screen sharing, so Play Console flags this permission as
// unjustified. Strip it (and the two Agora components that require it) from
// the manifest Expo generates during prebuild — editing android/ directly
// doesn't work because .easignore excludes that folder from EAS builds.
const MEDIA_PROJECTION_PERMISSION = "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION";
const SCREEN_SHARE_SERVICE = "io.agora.rtc2.extensions.MediaProjectionMgr$LocalScreenSharingService";
const SCREEN_SHARE_ACTIVITY = "io.agora.rtc2.extensions.MediaProjectionMgr$LocalScreenCaptureAssistantActivity";

function blockComponent(manifest, tag, name) {
  const app = manifest.manifest.application?.[0];
  if (!app) return;
  if (!Array.isArray(app[tag])) app[tag] = [];
  const existing = app[tag].find((item) => item.$["android:name"] === name);
  if (existing) {
    existing.$["tools:node"] = "remove";
  } else {
    app[tag].push({ $: { "android:name": name, "tools:node": "remove" } });
  }
}

const withoutAgoraScreenShare = (config) => {
  config = AndroidConfig.Permissions.withBlockedPermissions(config, [MEDIA_PROJECTION_PERMISSION]);
  return withAndroidManifest(config, (config) => {
    config.modResults = AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);
    blockComponent(config.modResults, "service", SCREEN_SHARE_SERVICE);
    blockComponent(config.modResults, "activity", SCREEN_SHARE_ACTIVITY);
    return config;
  });
};

module.exports = withoutAgoraScreenShare;
